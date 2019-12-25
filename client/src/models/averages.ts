import { createModel } from '@captaincodeman/rdx-model';
import { State, Dispatch } from '../store';
import {endpoint} from "../endpoint";
import {config} from "../config";
import {Path} from "./types";

export interface AverageRateState {
  subject: string,
  course: string,
  rates: {},
  timestamp: number,
  loading: boolean,
  error: string,
}

export default createModel({
  state: <AverageRateState>{
    subject: "",
    course: "",
    rates: {},
    timestamp: -1,
    loading: false,
    error: "",
  },
  reducers: {
    requestLoad(state) {
      return { ...state, loading: true,
        rates: {},
        timestamp: Date.now(),
        error: "",
      };
    },

    receivedLoad(state, payload: AverageRateState) {
      return { ...state,
        subject: payload.subject,
        course: payload.course,
        rates: payload.rates,
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
    async load(payload: Path) {
      const state: State = getState();
      // @ts-ignore
      if (Date.now() - state.averages.timestamp > 3000 || state.averages.subject !== payload.subject || state.averages.course !== state.courses.selectedCourse) {
        dispatch.averages.requestLoad();
        const resp = await fetch(`${config.server}state?load=${state.app.userid}&subject=${payload.subject}&course=${state.courses.selectedCourse}`, endpoint.get(state));
        if (resp.ok) {
          const json = await resp.json();
          // @ts-ignore
          dispatch.averages.receivedLoad({subject: payload.subject, course: payload.course, rates: json.data});
        }
        else {
          const message = await resp.text();
          // @ts-ignore
          dispatch.averages.error(message);
        }
      }
    },

    /*
    'routing/change': async function(payload: RoutingState) {
      switch (payload.page) {
        case 'browser':
          // @ts-ignore
          dispatch.averages.load(payload.page["subject"], payload.page["chapter"]);
          break;
      }
    }
 */
  })
})

// TODO: forgetAverages on logout
