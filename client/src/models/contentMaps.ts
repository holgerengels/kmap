import {createModel} from '@captaincodeman/rdx';
import { Store } from '../store';
import {endpoint, fetchblob, fetchjson} from "../endpoint";
import {urls} from "../urls";

export interface Module {
  subject: string,
  module: string,
  count?: number,
}
export interface ContentMapsState {
  modules?: Module[],
  selected?: Module,
  loading: boolean,
  importing: boolean,
  exporting: boolean,
  deleting: boolean,
  error: string,
}

export default createModel({
  state: <ContentMapsState>{
    loading: false,
    importing: false,
    exporting: false,
    deleting: false,
    error: "",
  },
  reducers: {
    requestLoad(state) {
      return { ...state, loading: true,
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
      return { ...state, modules: undefined, selected: undefined}
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

  effects(store: Store) {
    const dispatch = store.getDispatch();
    return {
      async load() {
        const state = store.getState();

          dispatch.contentMaps.requestLoad();
          fetchjson(`${urls.server}edit?modules=all`, endpoint.get(state),
            (json) => {
              dispatch.contentMaps.receivedLoad(json);
            },
            dispatch.app.handleError,
            dispatch.contentMaps.error);
      },
      async import(files: FileList) {
        const state = store.getState();

        let names: string[] = [];
        var formData: FormData = new FormData();

        for (let i = 0; i < files.length; i++) {
          let file: File = files[i];
          names.push(file.name);
          formData.append('files', file);
        }

        dispatch.contentMaps.requestImport();
        fetchjson(`${urls.server}content?import-module=${names.join(",")}`, {
            ...endpoint.postFormData(state),
            body: formData
          },
          () => {
            dispatch.contentMaps.receivedImport();
            dispatch.shell.showMessage("Import von " + names.join(", ") + " abgeschlossen");
          },
          dispatch.app.handleError,
          dispatch.contentMaps.error);
      },
      async export(payload: Module) {
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
        const state = store.getState();

        dispatch.contentMaps.requestDelete();
        fetchjson(`${urls.server}content?subject=${payload.subject}&delete-module=${payload.module}`, endpoint.post(state),
          () => {
            dispatch.contentMaps.receivedDelete();
          },
          dispatch.app.handleError,
          dispatch.contentMaps.error);
      },

      'app/receivedLogin': async function () {
        const state = store.getState();
        if (state.app.roles.includes("teacher") && state.shell.layers.includes('editor'))
          dispatch.contentMaps.load();
      },
      'shell/addLayer': async function () {
        const state = store.getState();
        if (state.app.roles.includes("teacher") && state.shell.layers.includes('editor'))
          dispatch.contentMaps.load();
      },
      'contentMaps/receivedDelete': async function() {
        dispatch.contentMaps.forget();
        dispatch.contentMaps.load();
      },
      'contentMaps/receivedImport': async function() {
        dispatch.contentMaps.forget();
        dispatch.contentMaps.load();
      },
      'app/receivedLogout': async function () {
        dispatch.contentMaps.forget();
      },
      'app/chooseInstance': async function () {
        dispatch.contentMaps.forget();
      },
    }
  }
})
