import {createModel} from '@captaincodeman/rdx';
import { Store } from '../store';
import {endpoint, fetchjson} from "../endpoint";
import {urls} from "../urls";

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

  effects(store: Store) {
    const dispatch = store.getDispatch();
    return {
      async load() {
        const state = store.getState();
        const userid = state.app.userid;
        const subject = state.maps.subject;
        const course = state.courses.selectedCourse;
        if (!userid || !subject || !course)
          return;

        // @ts-ignore
        if (Date.now() - state.averages.timestamp > 3000 || state.averages.subject !== subject || state.averages.course !== course.name) {
          dispatch.averages.requestLoad();
          fetchjson(`${urls.server}state?load=${userid}&subject=${subject}&course=${course.name}`, endpoint.get(state),
            (json) => {
              // @ts-ignore
              dispatch.averages.receivedLoad({subject: subject, course: course.name, rates: json});
            },
            dispatch.app.handleError,
            dispatch.averages.error);
        }
      },

      'maps/received': async function () {
        dispatch.rates.load();
      },
      'courses/selectCourse': async function () {
        dispatch.averages.load();
      },
      'courses/unselectCourse': async function () {
        dispatch.averages.forget();
      },
      'app/receivedLogin': async function () {
        dispatch.rates.load();
      },
      'app/receivedLogout': async function () {
        dispatch.rates.forget();
      },
      'app/chooseInstance': async function () {
        dispatch.rates.forget();
      },
    }
  }
})
