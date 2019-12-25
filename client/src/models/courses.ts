import { createModel, RoutingState } from '@captaincodeman/rdx-model';
import { State, Dispatch } from '../rdxstore';
import {endpoint} from "../endpoint";
import {config} from "../config";
import {Path} from "./types";

export interface Course {
  name: string,
  students: string[],
}

export interface CoursesState {
  courses: string[],
  selectedCourse: "",
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
        rates: {},
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
      // @ts-ignore
      if (Date.now() - state.courses.timestamp > 3000) {
        dispatch.courses.requestLoad();
        const resp = await fetch(`${config.server}state?courses=${state.app.userid}`, endpoint.get(state));
        if (resp.ok) {
          const json = await resp.json();
          // @ts-ignore
          dispatch.courses.receivedLoad(json.data);
        }
        else {
          const message = await resp.text();
          // @ts-ignore
          dispatch.courses.error(message);
        }
      }
    },
    async store(payload: string[]) {
      const state: State = getState();
      dispatch.courses.requestStore();
      const resp = await fetch(`${config.server}state?userid=${state.app.userid}&storeCourses=${state.app.userid}`, {... endpoint.post, body: JSON.stringify(payload)});
      if (resp.ok) {
        const json = await resp.json();
        dispatch.courses.receivedStore(json.data);
      }
      else {
        const message = await resp.text();
        // @ts-ignore
        dispatch.courses.error(message);
      }
    },
    async storeChange(payload: Course) {
      const state: State = getState();
      dispatch.courses.requestStoreChange();
      const resp = await fetch(`${config.server}state?userid=${state.app.userid}&storeCourse=${payload.name}`, {... endpoint.post, body: JSON.stringify(payload.students)});
      if (resp.ok) {
        const json = await resp.json();
        dispatch.courses.receivedStoreChange();
      }
      else {
        const message = await resp.text();
        // @ts-ignore
        dispatch.courses.error(message);
      }
    },

/*
    'routing/change': async function(payload: RoutingState) {
      switch (payload.page) {
        case 'browser':
          // @ts-ignore
          dispatch.courses.load(payload.page["subject"], payload.page["chapter"]);
          break;
      }
    }
 */
  })
})

// TODO: forgetCourses on logout
