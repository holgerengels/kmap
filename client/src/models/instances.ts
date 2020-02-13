import {createModel, RoutingState} from '@captaincodeman/rdx-model';
import { State, Dispatch } from '../store';
import {endpoint, fetchjson} from "../endpoint";
import {config} from "../config";

export interface Sync {
  from: string,
  to: string,
}
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
  syncing: boolean,
  error: string,
}

export default createModel({
  state: <InstancesState>{
    instances: [],
    timestamp: -1,
    loading: false,
    creating: false,
    dropping: false,
    syncing: false,
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
        error: "",
      };
    },

    requestCreate(state) {
      return { ...state, creating: true,
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
        error: "",
      };
    },
    receivedDrop(state, payload: Instance) {
      return { ...state,
        dropping: false,
        instances: state.instances.filter(i => i !== payload)
      };
    },

    requestSync(state) {
      return { ...state, syncing: true,
        error: "",
      };
    },
    receivedSync(state) {
      return { ...state,
        syncing: false,
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
        fetchjson(`${config.server}content?instances=all`, endpoint.get(state),
          (json) => {
            dispatch.instances.receivedLoad(json);
          },
          dispatch.app.handleError,
          dispatch.instances.error);
      }
    },
    async create(instance: Instance) {
      const state: State = getState();
      // @ts-ignore
      dispatch.instances.requestCreate();
      fetchjson(`${config.server}content?create=${instance.name}`,
        {... endpoint.post(state), body: JSON.stringify({name: instance.name, description: instance.description})},
        () => {
          dispatch.instances.receivedCreate(instance);
        },
        dispatch.app.handleError,
        dispatch.instances.error);
    },
    async drop(instance: Instance) {
      const state: State = getState();
      // @ts-ignore
      dispatch.instances.requestDrop();
      fetchjson(`${config.server}content?drop=${instance.name}`,
        {... endpoint.post(state), body: JSON.stringify({name: instance.name, description: instance.description})},
        () => {
          dispatch.instances.receivedDrop(instance);
        },
        dispatch.app.handleError,
        dispatch.instances.error);
    },

    async sync(sync: Sync) {
      const state: State = getState();
      // @ts-ignore
      dispatch.instances.requestSync();
      fetchjson(`${config.server}content?sync=${sync.from}`,
        {... endpoint.post(state), body: JSON.stringify(sync)},
        () => {
          dispatch.instances.receivedSync();
        },
        dispatch.app.handleError,
        dispatch.instances.error);
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
