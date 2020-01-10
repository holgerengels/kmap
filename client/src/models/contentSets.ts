import {createModel} from '@captaincodeman/rdx-model';
import { State, Dispatch } from '../store';
import {endpoint} from "../endpoint";
import {config} from "../config";
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
export interface ContentMapsState {
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
  state: <ContentMapsState>{
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
        set: {subject: payload.subject, set: payload.set},
        tests: payload.tests,
      };
    },

    selectSet(state, set: Set) {
      return { ...state, selected: set }
    },
    unselectSet(state) {
      return { ...state, selected: undefined }
    },

    error(state, message) {
      return { ...state,
        loading: false,
        error: message,
      }
    },
  },

  // @ts-ignore
  effects: (dispatch: Dispatch, getState) => ({
    async load() {
      const state: State = getState();
      // @ts-ignore
      if (Date.now() - state.contentMaps.timestamp > 3000) {
        dispatch.contentMaps.requestLoad();
        const resp = await fetch(`${config.server}tests?sets=all`, endpoint.get(state));
        if (resp.ok) {
          const json = await resp.json();
          // @ts-ignore
          dispatch.contentMaps.receivedLoad(json);
        }
        else {
          const message = await resp.text();
          // @ts-ignore
          dispatch.app.handleError({ code: resp.status, message: message });
          // @ts-ignore
          dispatch.contentMaps.error(message);
        }
      }
    },
    async loadSet(set: Set) {
      const state: State = getState();
      if (!set.subject || !set.set)
        return;

      dispatch.contentSets.requestSet();
      const resp = await fetch(`${config.server}tests?subject=${set.subject}&set=${set.set}`, endpoint.get(state));
      if (resp.ok) {
        const json = await resp.json();
        dispatch.contentSets.receivedSet({subject: set.subject, set: set.set, tests: json});
      }
      else {
        const message = await resp.text();
        // @ts-ignore
        dispatch.app.handleError({ code: resp.status, message: message });
        // @ts-ignore
        dispatch.contentSets.error(message);
      }
    },

    async import(files: File[]) {
      const state: State = getState();

      let names: string[] = [];
      var formData: FormData = new FormData();

      for (let i = 0; i < files.length; i++) {
        let file:File = files[i];
        names.push(file.name);
        formData.append('files', file);
      }

      dispatch.contentMaps.requestImport();
      const resp = await fetch(`${config.server}content?import-set=${names.join(",")}`, {... endpoint.post(state), body: formData});
      if (resp.ok) {
        await resp.json();
        // @ts-ignore
        dispatch.contentMaps.receivedImport();
      }
      else {
        const message = await resp.text();
        // @ts-ignore
        dispatch.app.handleError({ code: resp.status, message: message });
        // @ts-ignore
        dispatch.contentMaps.error(message);
      }
    },
    async export(payload: Set) {
      const state: State = getState();

      dispatch.contentMaps.requestExport();
      const resp = await fetch(`${config.server}content?subject=${payload.subject}&export-set=${payload.set}`, endpoint.get(state));
      if (resp.ok) {
        const blob: Blob = await resp.blob();

        let url = window.URL.createObjectURL(blob);
        var a: HTMLAnchorElement = document.createElement('a');
        a.href = url;
        a.download = payload.subject + " - " + payload.set + "-tests.zip";
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        // @ts-ignore
        dispatch.contentMaps.receivedExport();
      }
      else {
        const message = await resp.text();
        // @ts-ignore
        dispatch.app.handleError({ code: resp.status, message: message });
        // @ts-ignore
        dispatch.contentMaps.error(message);
      }
    },
    async delete(payload: Set) {
      const state: State = getState();

      dispatch.contentMaps.requestDelete();
      const resp = await fetch(`${config.server}tests?subject=${payload.subject}&delete=${payload.set}`, endpoint.get(state));
      if (resp.ok) {
        await resp.json();
        // @ts-ignore
        dispatch.contentMaps.receivedDelete();
      }
      else {
        const message = await resp.text();
        // @ts-ignore
        dispatch.app.handleError({ code: resp.status, message: message });
        // @ts-ignore
        dispatch.contentMaps.error(message);
      }
    },
  })
})
