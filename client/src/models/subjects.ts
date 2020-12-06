import {createModel, RoutingState} from '@captaincodeman/rdx';
import { Store } from '../store';
import {endpoint, fetchjson} from "../endpoint";
import {urls} from "../urls";

export interface Subject {
  name: string,
  count: number,
}
export interface SubjectsState {
  subjects: Subject[],
  timestamp: number,
  loading: boolean,
  error: string,
}

export default createModel({
  state: <SubjectsState>{
    subjects: [],
    timestamp: -1,
    loading: false,
    error: "",
  },
  reducers: {
    requestLoad(state) {
      return { ...state, loading: true,
        timestamp: Date.now(),
        error: "",
      };
    },
    receivedLoad(state, payload: Subject[]) {
      return { ...state,
        subjects: payload,
        loading: false,
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
        if (Date.now() - state.subjects.timestamp > 3000) {
          dispatch.subjects.requestLoad();
          fetchjson(`${urls.server}data?subjects=all`, endpoint.get(state),
            (json) => {
              dispatch.subjects.receivedLoad(json);
            },
            dispatch.app.handleError,
            dispatch.subjects.error);
        }
      },

      'routing/change': async function (routing: RoutingState<string>) {
        switch (routing.page) {
          case 'home':
            document.title = "KMap - Knowledge Map";
          case 'test':
            if (Object.keys(routing.params).length === 0)
              dispatch.subjects.load();
            break;
        }
      },
      'app/chooseInstance': async function () {
        dispatch.subjects.load();
      },
    }
  }
})
