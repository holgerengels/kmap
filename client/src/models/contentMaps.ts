import {createModel, RoutingState} from '@captaincodeman/rdx-model';
import { State, Dispatch } from '../store';
import {endpoint} from "../endpoint";
import {config} from "../config";

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
  effects: (dispatch: Dispatch, getState) => ({
    async load() {
      const state: State = getState();
      // @ts-ignore
      if (Date.now() - state.contentMaps.timestamp > 3000) {
        dispatch.contentMaps.requestLoad();
        const resp = await fetch(`${config.server}edit?modules=all`, endpoint.get(state));
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
      const resp = await fetch(`${config.server}content?import-module=${names.join(",")}`, {... endpoint.post(state), body: formData});
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
    async export(payload: Module) {
      const state: State = getState();

      dispatch.contentMaps.requestExport();
      const resp = await fetch(`${config.server}content?subject=${payload.subject}&export-module=${payload.module}`, endpoint.get(state));
      if (resp.ok) {
        const blob: Blob = await resp.blob();

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
      }
      else {
        const message = await resp.text();
        // @ts-ignore
        dispatch.app.handleError({ code: resp.status, message: message });
        // @ts-ignore
        dispatch.contentMaps.error(message);
      }
    },
    async delete(payload: Module) {
      const state: State = getState();

      dispatch.contentMaps.requestDelete();
      const resp = await fetch(`${config.server}edit?subject=${payload.subject}&delete=${payload.module}`, endpoint.get(state));
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

    'routing/change': async function(payload: RoutingState) {
      switch (payload.page) {
        case 'content-manager':
          // @ts-ignore
          dispatch.contentMaps.load();
          break;
      }
    },
    'app/chooseInstance': async function() {
      dispatch.contentMaps.forget();
    },
  })
})
