import {createModel, RoutingState} from '@captaincodeman/rdx-model';
import { Store } from '../store';
import {endpoint, fetchblob, fetchjson} from "../endpoint";
import {urls} from "../urls";
import {Test} from "./tests";

export interface Set {
  subject: string,
  set: string,
  count?: number,
}
interface TestSet {
  subject: string,
  set: string,
  tests: Test[],
}
export interface ContentSetsState {
  sets: Set[],
  selected?: Set,
  timestamp: number,
  loading: boolean,
  importing: boolean,
  exporting: boolean,
  deleting: boolean,
  set?: Set,
  tests?: Test[],
  loadingSet: boolean,
  error: string,
}

export default createModel({
  state: <ContentSetsState>{
    sets: [],
    selected: undefined,
    timestamp: -1,
    loading: false,
    importing: false,
    exporting: false,
    deleting: false,
    set: undefined,
    tests: undefined,
    loadingSet: false,
    error: "",
  },
  reducers: {
    requestLoad(state) {
      return { ...state, loading: true,
        timestamp: Date.now(),
        error: "",
      };
    },
    receivedLoad(state, payload: Set[]) {
      return { ...state,
        sets: payload,
        loading: false,
      };
    },
    forget(state) {
      return { ...state,
        sets: [],
        selected: undefined,
        set: undefined,
        tests: undefined,
      }
    },

    requestImport(state) {
      return { ...state, importing: true, error: "" };
    },
    receivedImport(state) {
      return { ...state, importing: false };
    },
    requestExport(state) {
      return { ...state, exporting: true, error: "" };
    },
    receivedExport(state) {
      return { ...state, exporting: false };
    },
    requestDelete(state) {
      return { ...state, deleteing: true, error: "" };
    },
    receivedDelete(state) {
      return { ...state, deleteing: false };
    },

    requestSet(state) {
      return { ...state, loadingSet: true, error: "" };
    },
    receivedSet(state, payload: TestSet) {
      return { ...state,
        loadingSet: false,
        set: {subject: payload.subject, set: payload.set, count: payload.tests.length},
        tests: payload.tests,
      };
    },

    selectSet(state, set: Set) {
      return { ...state, selected: set }
    },
    unselectSet(state) {
      return { ...state, selected: undefined, tests: undefined }
    },

    error(state, message) {
      return { ...state,
        loading: false,
        error: message,
      }
    },
  },

  // @ts-ignore
  effects: (store: Store) => ({
    async load() {
      const dispatch = store.dispatch();
      const state = store.getState();
      if (Date.now() - state.contentSets.timestamp > 3000) {
        dispatch.contentSets.requestLoad();
        const resp = await fetch(`${urls.server}tests?sets=all`, endpoint.get(state));
        if (resp.ok) {
          const json = await resp.json();
          // @ts-ignore
          dispatch.contentSets.receivedLoad(json);
        }
        else {
          const message = await resp.text();
          // @ts-ignore
          dispatch.app.handleError({ code: resp.status, message: message });
          // @ts-ignore
          dispatch.contentSets.error(message);
        }
      }
    },
    async loadSet(set: Set) {
      const dispatch = store.dispatch();
      const state = store.getState();
      if (!set.subject || !set.set)
        return;

      dispatch.contentSets.requestSet();
      const resp = await fetch(`${urls.server}tests?subject=${set.subject}&set=${set.set}`, endpoint.get(state));
      if (resp.ok) {
        const json = await resp.json();
        dispatch.contentSets.receivedSet({subject: set.subject, set: set.set, tests: json});
        const sets: Set[] = [...state.contentSets.sets];
        for (const s of sets) {
          if (s.set === set.set)
            s.count = json.length;
        }
        dispatch.contentSets.receivedLoad(sets);
      }
      else {
        const message = await resp.text();
        // @ts-ignore
        dispatch.app.handleError({ code: resp.status, message: message });
        // @ts-ignore
        dispatch.contentSets.error(message);
      }
    },
    selectSet(set: Set) {
      const dispatch = store.dispatch();
      if (!set.subject || !set.set)
        return;

      dispatch.contentSets.loadSet(set);
      dispatch.maps.loadAllTopics(set.subject);
    },
    maybeNewSet(set: Set) {
      const dispatch = store.dispatch();
      const state = store.getState();
      if (state.contentSets.sets.filter(s => s.subject === set.subject && s.set === set.set).length === 0) {
        // @ts-ignore
        dispatch.contentSets.receivedLoad([...new Set(state.contentSets.sets).add(set)].sort((a, b) => a.set.localeCompare(b.set)));
        dispatch.contentSets.selectSet(set);
      }
      else
        window.setTimeout(function(set: Set) {
          dispatch.contentSets.loadSet(set);
        }.bind(undefined, set), 1000);
    },
    maybeObsoleteSet(set: Set) {
      const dispatch = store.dispatch();
      const state = store.getState();

      // @ts-ignore
      if (state.contentSets.set.count === 1 ) {
        dispatch.contentSets.receivedLoad(state.contentSets.sets.filter(s => s.set !== set.set));
        dispatch.contentSets.unselectSet();
      }
      else
        window.setTimeout(function(set: Set) {
          dispatch.contentSets.loadSet(set);
        }.bind(undefined, set), 1000);
    },

    async import(files: FileList) {
      const dispatch = store.dispatch();
      const state = store.getState();

      let names: string[] = [];
      var formData: FormData = new FormData();

      for (let i = 0; i < files.length; i++) {
        let file:File = files[i];
        names.push(file.name);
        formData.append('files', file);
      }

      dispatch.contentSets.requestImport();
      fetchjson(`${urls.server}content?import-set=${names.join(",")}`, {... endpoint.postFormData(state), body: formData},
        () => {
          dispatch.contentSets.receivedImport();
          dispatch.shell.addMessage("Import von " + names.join(", ") + " abgeschlossen");
        },
        dispatch.app.handleError,
        dispatch.contentSets.error);
    },
    async export(payload: Set) {
      const dispatch = store.dispatch();
      const state = store.getState();

      dispatch.contentSets.requestExport();
      fetchblob(`${urls.server}content?subject=${payload.subject}&export-set=${payload.set}`, endpoint.get(state),
        (blob) => {
          let url = window.URL.createObjectURL(blob);
          var a: HTMLAnchorElement = document.createElement('a');
          a.href = url;
          a.download = payload.subject + " - " + payload.set + "-tests.zip";
          document.body.appendChild(a);
          a.click();
          a.remove();
          URL.revokeObjectURL(url);
          // @ts-ignore
          dispatch.contentSets.receivedExport();
        },
        dispatch.app.handleError,
        dispatch.contentSets.error);
    },
    async delete(payload: Set) {
      const dispatch = store.dispatch();
      const state = store.getState();

      dispatch.contentSets.requestDelete();
      fetchjson(`${urls.server}tests?subject=${payload.subject}&delete=${payload.set}`, endpoint.get(state),
        () => {
          dispatch.contentSets.receivedDelete();
        },
        dispatch.app.handleError,
        dispatch.contentSets.error);
    },

    'routing/change': async function(routing: RoutingState) {
      const dispatch = store.dispatch();
      const state = store.getState();
      if (state.app.roles.includes("teacher") && (routing.page === 'content-manager' || routing.page === 'test'))
        dispatch.contentSets.load();
    },
    'app/receivedLogin': async function() {
      const dispatch = store.dispatch();
      const state = store.getState();
      const routing: RoutingState = state.routing;
      if (state.app.roles.includes("teacher") && (routing.page === 'content-manager' || routing.page === 'test'))
        dispatch.contentSets.load();
    },

    'app/receivedLogout': async function() {
      const dispatch = store.dispatch();
      dispatch.contentSets.forget();
    },
    'app/chooseInstance': async function() {
      const dispatch = store.dispatch();
      dispatch.contentSets.forget();
    },
  })
})
