import { createModel } from '@captaincodeman/rdx-model';
import { State, Dispatch } from '../store';
import {endpoint} from "../endpoint";
import {config} from "../config";

export interface Course {
  name: string,
  students: string[],
}

export interface CoursesState {
  courses: string[],
  selectedCourse: string,
  timestamp: number,
  loading: boolean,
  storing: boolean,
  storingChange: boolean,
  error: string,
}

export default createModel({
  state: <CoursesState>{
    courses: [],
    selectedCourse: "",
    timestamp: -1,
    loading: false,
    storing: false,
    storingChange: false,
    error: "",
  },
  reducers: {
    requestLoad(state) {
      return { ...state, loading: true,
        courses: [],
        timestamp: Date.now(),
        error: "",
      };
    },
    receivedLoad(state, payload: string[]) {
      return { ...state,
        courses: payload,
        selectedCourse: payload.includes(state.selectedCourse) ? state.selectedCourse : "",
        loading: false,
      };
    },
    forget(state) {
      return { ...state,
        courses: [],
        timestamp: Date.now(),
        error: "",
      };
    },

    requestStore(state) {
      return { ...state, storing: true,
        courses: [],
        timestamp: Date.now(),
        error: "",
      };
    },
    receivedStore(state, payload: string[]) {
      return { ...state,
        courses: payload,
        selectedCourse: payload.includes(state.selectedCourse) ? state.selectedCourse : "",
        storing: false,
      };
    },

    requestStoreChange(state) {
      return { ...state, storingChange: true,
        error: "",
      };
    },
    receivedStoreChange(state) {
      return { ...state,
        storingChange: false,
      };
    },

    selectCourse(state, course: string) {
      return { ...state, selectedCourse: course }
    },
    unselectCourse(state) {
      return { ...state, selectedCourse: "" }
    },

    error(state, message) {
      return { ...state,
        loading: false,
        storing: false,
        storingChange: false,
        error: message,
      }
    },
  },

  // @ts-ignore
  effects: (dispatch: Dispatch, getState) => ({
    async load() {
      const state: State = getState();
      const userid = state.app.userid;
      if (!userid)
        return;

      // @ts-ignore
      if (Date.now() - state.courses.timestamp > 3000) {
        dispatch.courses.requestLoad();
        const resp = await fetch(`${config.server}state?courses=${userid}`, endpoint.get(state));
        if (resp.ok) {
          const json = await resp.json();
          // @ts-ignore
          dispatch.courses.receivedLoad(json);
        }
        else {
          const message = await resp.text();
          // @ts-ignore
          dispatch.app.handleError({ code: resp.status, message: message });
          dispatch.courses.error(message);
        }
      }
    },
    async store(payload: string[]) {
      const state: State = getState();
      dispatch.courses.requestStore();
      const resp = await fetch(`${config.server}state?userid=${state.app.userid}&storeCourses=${state.app.userid}`, {... endpoint.post(state), body: JSON.stringify(payload)});
      if (resp.ok) {
        const json = await resp.json();
        dispatch.courses.receivedStore(json);
      }
      else {
        const message = await resp.text();
        // @ts-ignore
        dispatch.app.handleError({ code: resp.status, message: message });
        dispatch.courses.error(message);
      }
    },
    async storeChange(payload: Course) {
      const state: State = getState();
      dispatch.courses.requestStoreChange();
      const resp = await fetch(`${config.server}state?userid=${state.app.userid}&storeCourse=${payload.name}`, {... endpoint.post(state), body: JSON.stringify(payload.students)});
      if (resp.ok) {
        // @ts-ignore
        const json = await resp.json();
        dispatch.courses.receivedStoreChange();
      }
      else {
        const message = await resp.text();
        // @ts-ignore
        dispatch.app.handleError({ code: resp.status, message: message });
        dispatch.courses.error(message);
      }
    },

    'app/receivedLogin': async function() {
      dispatch.courses.load();
    },
    'app/receivedLogout': async function() {
      dispatch.courses.forget();
    },
  })
})
