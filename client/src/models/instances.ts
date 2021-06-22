import {createModel, RoutingState} from '@captaincodeman/rdx';
import { Store } from '../store';
import {endpoint, fetchjson} from "../endpoint";
import {urls} from "../urls";

export interface Sync {
  from: string,
  to: string,
}
export interface Batch {
  instance: string,
  json: string,
}
export interface Instance {
  name: string,
  description?: string,
  authconf?: string,
}
export interface InstancesState {
  instances: Instance[],
  timestamp: number,
  loading: boolean,
  creating: boolean,
  editing: boolean,
  batching: boolean,
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
    editing: false,
    batching: false,
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
        instances: [...state.instances, payload].sort((a, b) => a.name.localeCompare(b.name))
      };
    },

    requestEdit(state) {
      return { ...state, editing: true,
        error: "",
      };
    },
    receivedEdit(state, payload: Instance) {
      return { ...state,
        editing: false,
        instances: [...state.instances.filter(i => i.name !== payload.name), payload].sort((a, b) => a.name.localeCompare(b.name))
      };
    },

    requestBatch(state) {
      return { ...state, batching: true,
        error: "",
      };
    },
    receivedBatch(state) {
      return { ...state,
        batching: false,
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

  effects(store: Store) {
    const dispatch = store.getDispatch();
    return {
      async load() {
        const state = store.getState();
        // @ts-ignore
        if (Date.now() - state.instances.timestamp > 3000) {
          dispatch.instances.requestLoad();
          fetchjson(`${urls.server}content?instances=all`, endpoint.get(state),
            (json) => {
              dispatch.instances.receivedLoad(json);
            },
            dispatch.app.handleError,
            dispatch.instances.error);
        }
      },
      async create(instance: Instance) {
        const state = store.getState();
        // @ts-ignore
        dispatch.instances.requestCreate();
        fetchjson(`${urls.server}content?create=${instance.name}`,
          {
            ...endpoint.post(state),
            body: JSON.stringify({name: instance.name, description: instance.description, authconf: instance.authconf})
          },
          () => {
            dispatch.instances.receivedCreate(instance);
          },
          dispatch.app.handleError,
          dispatch.instances.error);
      },
      async edit(instance: Instance) {
        const state = store.getState();
        // @ts-ignore
        dispatch.instances.requestEdit();
        fetchjson(`${urls.server}content?edit=${instance.name}`,
          {
            ...endpoint.post(state),
            body: JSON.stringify({name: instance.name, description: instance.description, authconf: instance.authconf})
          },
          () => {
            dispatch.instances.receivedEdit(instance);
          },
          dispatch.app.handleError,
          dispatch.instances.error);
      },
      async batch(batch: Batch) {
        const state = store.getState();
        // @ts-ignore
        dispatch.instances.requestBatch();
        fetchjson(`${urls.server}content?batch-cards=${batch.instance}`,
          {
            ...endpoint.post(state),
            body: JSON.stringify({instance: batch.instance, json: batch.json})
          },
          () => {
            dispatch.instances.receivedBatch();
          },
          dispatch.app.handleError,
          dispatch.instances.error);
      },
      async drop(instance: Instance) {
        const state = store.getState();
        // @ts-ignore
        dispatch.instances.requestDrop();
        fetchjson(`${urls.server}content?drop=${instance.name}`,
          {...endpoint.post(state), body: JSON.stringify({name: instance.name, description: instance.description})},
          () => {
            dispatch.instances.receivedDrop(instance);
          },
          dispatch.app.handleError,
          dispatch.instances.error);
      },

      async sync(sync: Sync) {
        const state = store.getState();
        // @ts-ignore
        dispatch.instances.requestSync();
        fetchjson(`${urls.server}content?sync=${sync.from}`,
          {...endpoint.post(state), body: JSON.stringify(sync)},
          () => {
            dispatch.instances.receivedSync();
            dispatch.shell.addMessage("Sync von " + sync.from + " nach " + sync.to + " abgeschlossen");
          },
          dispatch.app.handleError,
          dispatch.instances.error);
      },

      'routing/change': async function (routing: RoutingState<string>) {
        switch (routing.page) {
          case 'content-manager':
            document.title = "KMap - Content Manager";
            dispatch.instances.load();
        }
      },
    }
  }
})
