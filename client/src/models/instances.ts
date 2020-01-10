import {createModel} from '@captaincodeman/rdx-model';
import { State, Dispatch } from '../store';
import {endpoint} from "../endpoint";
import {config} from "../config";

export interface InstancesState {
  instances: string[],
  timestamp: number,
  loading: boolean,
  creating: boolean,
  dropping: boolean,
  error: string,
}

export default createModel({
  state: <InstancesState>{
    instances: [],
    timestamp: -1,
    loading: false,
    creating: false,
    dropping: false,
    error: "",
  },
  reducers: {
    requestLoad(state) {
      return { ...state, loading: true,
        timestamp: Date.now(),
        error: "",
      };
    },
    receivedLoad(state, payload: string[]) {
      return { ...state,
        instances: payload,
        loading: false,
      };
    },
    forget(state) {
      return { ...state,
        instances: [],
        timestamp: Date.now(),
        error: "",
      };
    },

    requestCreate(state) {
      return { ...state, creating: true,
        timestamp: Date.now(),
        error: "",
      };
    },
    receivedCreate(state, payload: string) {
      return { ...state,
        creating: false,
        instances: [...state.instances, payload].sort()
      };
    },

    requestDrop(state) {
      return { ...state, dropping: true,
        timestamp: Date.now(),
        error: "",
      };
    },
    receivedDrop(state, payload: string) {
      return { ...state,
        dropping: false,
        instances: state.instances.filter(i => i !== payload)
      };
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
      if (Date.now() - state.instances.timestamp > 3000) {
        dispatch.instances.requestLoad();
        const resp = await fetch(`${config.server}content?instances=all`, endpoint.get(state));
        if (resp.ok) {
          const json = await resp.json();
          // @ts-ignore
          dispatch.instances.receivedLoad(json);
        }
        else {
          const message = await resp.text();
          // @ts-ignore
          dispatch.app.handleError({ code: resp.status, message: message });
          // @ts-ignore
          dispatch.instances.error(message);
        }
      }
    },
    async create(name: string) {
      const state: State = getState();
      // @ts-ignore
      dispatch.instances.requestCreate();
      const resp = await fetch(`${config.server}content?create=${name}`, endpoint.get(state));
      if (resp.ok) {
        await resp.json();
        // @ts-ignore
        dispatch.instances.receivedCreate(name);
      }
      else {
        const message = await resp.text();
        // @ts-ignore
        dispatch.app.handleError({ code: resp.status, message: message });
        // @ts-ignore
        dispatch.instances.error(message);
      }
    },
    async drop(name: string) {
      const state: State = getState();
      // @ts-ignore
      dispatch.instances.requestDrop();
      const resp = await fetch(`${config.server}content?drop=${name}`, endpoint.get(state));
      if (resp.ok) {
        await resp.json();
        // @ts-ignore
        dispatch.instances.receivedDrop(name);
      }
      else {
        const message = await resp.text();
        // @ts-ignore
        dispatch.app.handleError({ code: resp.status, message: message });
        // @ts-ignore
        dispatch.instances.error(message);
      }
    },
    'app/receivedLogin': async function() {
      dispatch.instances.load();
    },
    'app/receivedLogout': async function() {
      dispatch.instances.forget();
    },
  })
})
