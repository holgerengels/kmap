import {createModel, RoutingState} from '@captaincodeman/rdx-model';
import { State, Dispatch } from '../store';
import {endpoint} from "../endpoint";
import {config} from "../config";

export interface Instance {
  name: string,
  description?: string,
}
export interface InstancesState {
  instances: Instance[],
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
    receivedLoad(state, payload: Instance[]) {
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
    receivedCreate(state, payload: Instance) {
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
    receivedDrop(state, payload: Instance) {
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
    async create(instance: Instance) {
      const state: State = getState();
      // @ts-ignore
      dispatch.instances.requestCreate();
      const resp = await fetch(`${config.server}content?create=${instance.name}`,
        {... endpoint.post(state), body: JSON.stringify({name: instance.name, description: instance.description})});
      if (resp.ok) {
        await resp.json();
        // @ts-ignore
        dispatch.instances.receivedCreate(instance);
      }
      else {
        const message = await resp.text();
        // @ts-ignore
        dispatch.app.handleError({ code: resp.status, message: message });
        // @ts-ignore
        dispatch.instances.error(message);
      }
    },
    async drop(instance: Instance) {
      const state: State = getState();
      // @ts-ignore
      dispatch.instances.requestDrop();
      const resp = await fetch(`${config.server}content?drop=${instance.name}`,
        {... endpoint.post(state), body: JSON.stringify({name: instance.name, description: instance.description})});
      if (resp.ok) {
        await resp.json();
        // @ts-ignore
        dispatch.instances.receivedDrop(instance);
      }
      else {
        const message = await resp.text();
        // @ts-ignore
        dispatch.app.handleError({ code: resp.status, message: message });
        // @ts-ignore
        dispatch.instances.error(message);
      }
    },

    'routing/change': async function(routing: RoutingState) {
      switch (routing.page) {
        case 'content-manager':
          document.title = "KMap - Content Manager";
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
