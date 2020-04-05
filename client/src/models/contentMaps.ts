import {createModel, RoutingState} from '@captaincodeman/rdx-model';
import { Store } from '../store';
import {endpoint, fetchblob, fetchjson} from "../endpoint";
import {urls} from "../urls";

export interface Module {
  subject: string,
  module: string,
  count?: number,
}
export interface ContentMapsState {
  modules: Module[],
  selected?: Module,
  timestamp: number,
  loading: boolean,
  importing: boolean,
  exporting: boolean,
  deleting: boolean,
  error: string,
}

export default createModel({
  state: <ContentMapsState>{
    modules: [],
    selected: undefined,
    timestamp: -1,
    loading: false,
    importing: false,
    exporting: false,
    deleting: false,
    error: "",
  },
  reducers: {
    requestLoad(state) {
      return { ...state, loading: true,
        timestamp: Date.now(),
        error: "",
      };
    },
    receivedLoad(state, payload: Module[]) {
      return { ...state,
        modules: payload,
        loading: false,
      };
    },
    forget(state) {
      return { ...state, modules: [], selected: undefined}
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

    selectModule(state, module: Module) {
      return { ...state, selected: module }
    },
    unselectModule(state) {
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
  effects: (store: Store) => ({
    async load() {
      const dispatch = store.dispatch();
      const state = store.getState();
      // @ts-ignore
      if (Date.now() - state.contentMaps.timestamp > 3000) {
        dispatch.contentMaps.requestLoad();
        fetchjson(`${urls.server}edit?modules=all`, endpoint.get(state),
          (json) => {
            dispatch.contentMaps.receivedLoad(json);
          },
          dispatch.app.handleError,
          dispatch.contentMaps.error);
      }
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

      dispatch.contentMaps.requestImport();
      fetchjson(`${urls.server}content?import-module=${names.join(",")}`, {... endpoint.postFormData(state), body: formData},
        () => {
          dispatch.contentMaps.receivedImport();
          dispatch.shell.addMessage("Import von " + names.join(", ") + " abgeschlossen");
        },
        dispatch.app.handleError,
        dispatch.contentMaps.error);
    },
    async export(payload: Module) {
      const dispatch = store.dispatch();
      const state = store.getState();

      dispatch.contentMaps.requestExport();
      fetchblob(`${urls.server}content?subject=${payload.subject}&export-module=${payload.module}`, endpoint.get(state),
        (blob) => {
          let url = window.URL.createObjectURL(blob);
          var a: HTMLAnchorElement = document.createElement('a');
          a.href = url;
          a.download = payload.subject + " - " + payload.module + ".zip";
          document.body.appendChild(a);
          a.click();
          a.remove();
          URL.revokeObjectURL(url);
          // @ts-ignore
          dispatch.contentMaps.receivedExport();
        },
        dispatch.app.handleError,
        dispatch.contentMaps.error);
    },
    async delete(payload: Module) {
      const dispatch = store.dispatch();
      const state = store.getState();

      dispatch.contentMaps.requestDelete();
      fetchjson(`${urls.server}edit?subject=${payload.subject}&delete=${payload.module}`, endpoint.get(state),
        () => {
          dispatch.contentMaps.receivedDelete();
        },
        dispatch.app.handleError,
        dispatch.contentMaps.error);
    },

    'routing/change': async function(routing: RoutingState) {
      const dispatch = store.dispatch();
      const state = store.getState();
      if (state.app.roles.includes("teacher") && (routing.page === 'content-manager' || routing.page === 'browser'))
        dispatch.contentMaps.load();
    },
    'app/receivedLogin': async function() {
      const dispatch = store.dispatch();
      const state = store.getState();
      const routing: RoutingState = state.routing;
      if (state.app.roles.includes("teacher") && (routing.page === 'content-manager' || routing.page === 'browser'))
        dispatch.contentMaps.load();
    },

    'app/receivedLogout': async function() {
      const dispatch = store.dispatch();
      dispatch.contentMaps.forget();
    },
    'app/chooseInstance': async function() {
      const dispatch = store.dispatch();
      dispatch.contentMaps.forget();
    },
  })
})
