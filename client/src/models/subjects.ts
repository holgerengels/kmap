import { createModel, RoutingState } from '@captaincodeman/rdx-model';
import { State, Dispatch } from '../rdxstore';
import {endpoint} from "../endpoint";
import {config} from "../config";
import {Path} from "./types";

export interface SubjectsState {
  subjects: string[],
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
    receivedLoad(state, payload: string[]) {
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

  // @ts-ignore
  effects: (dispatch: Dispatch, getState) => ({
    async load() {
      const state: State = getState();
      // @ts-ignore
      if (Date.now() - state.subjects.timestamp > 3000) {
        dispatch.subjects.requestLoad();
        const resp = await fetch(`${config.server}data?subjects=all`, endpoint.get(state));
        if (resp.ok) {
          const json = await resp.json();
          // @ts-ignore
          dispatch.subjects.receivedLoad(json);
        }
        else {
          const message = await resp.text();
          // @ts-ignore
          dispatch.subjects.error(message);
        }
      }
    },

/*
    'routing/change': async function(payload: RoutingState) {
      switch (payload.page) {
        case 'browser':
          // @ts-ignore
          dispatch.subjects.load(payload.page["subject"], payload.page["chapter"]);
          break;
      }
    }
 */
  })
})

// TODO: forgetSubjects on logout
