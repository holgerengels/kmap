import {createModel} from '@captaincodeman/rdx-model';
import { State, Dispatch } from '../store';
import {endpoint} from "../endpoint";
import {config} from "../config";

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
    forget(state) {
      return { ...state,
        rates: {},
        timestamp: Date.now(),
        error: "",
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
      const userid = state.app.userid;
      const subject = state.maps.subject;
      const course = state.courses.selectedCourse;
      if (!userid || !subject || !course)
        return;

      // @ts-ignore
      if (Date.now() - state.averages.timestamp > 3000 || state.averages.subject !== subject || state.averages.course !== course) {
        dispatch.averages.requestLoad();
        const resp = await fetch(`${config.server}state?load=${userid}&subject=${subject}&course=${course}`, endpoint.get(state));
        if (resp.ok) {
          const json = await resp.json();
          // @ts-ignore
          dispatch.averages.receivedLoad({subject: subject, course: course, rates: json});
        }
        else {
          const message = await resp.text();
          // @ts-ignore
          dispatch.app.handleError({ code: resp.status, message: message });
          // @ts-ignore
          dispatch.averages.error(message);
        }
      }
    },

    'maps/received': async function() {
      dispatch.rates.load();
    },
    'courses/selectCourse': async function() {
      dispatch.averages.load();
    },
    'courses/unselectCourse': async function() {
      dispatch.averages.forget();
    },
    'app/receivedLogin': async function() {
      dispatch.rates.load();
    },
    'app/receivedLogout': async function() {
      dispatch.rates.forget();
    },
  })
})
