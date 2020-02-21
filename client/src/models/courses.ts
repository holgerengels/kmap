import {createModel, RoutingState} from '@captaincodeman/rdx-model';
import { Store } from '../store';
import {endpoint, fetchjson} from "../endpoint";
import {urls} from "../urls";

export interface Course {
  name: string,
  students: string[],
}

export interface CoursesState {
  courses: string[],
  selectedCourse: string,
  students?: string[],
  timestamp: number,
  loading: boolean,
  loadingCourse: boolean,
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
    loadingCourse: false,
    storing: false,
    storingChange: false,
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
        courses: payload,
        selectedCourse: payload.includes(state.selectedCourse) ? state.selectedCourse : "",
        students: undefined,
        loading: false,
      };
    },
    forget(state) {
      return { ...state,
        courses: [],
        selectedCourse: "",
        students: undefined,
        timestamp: Date.now(),
        error: "",
      };
    },

    requestLoadCourse(state) {
      return { ...state, loadingCourse: true,
        error: "",
      };
    },
    receivedLoadCourse(state, payload: string[]) {
      return { ...state,
        students: payload,
        loadingCourse: false,
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
        students: payload.includes(state.selectedCourse) ? state.students : undefined,
        storing: false,
      };
    },

    requestStoreChange(state) {
      return { ...state, storingChange: true,
        error: "",
      };
    },
    receivedStoreChange(state, payload: string[]) {
      return { ...state,
        students: payload,
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
  effects: (store: Store) => ({
    async load() {
      const dispatch = store.dispatch();
      const state = store.getState();
      const userid = state.app.userid;
      if (!userid)
        return;

      // @ts-ignore
      if (Date.now() - state.courses.timestamp < 3000) {
        console.warn("reloading after " + (state.courses.timestamp - Date.now()) + " ms");
      }

      dispatch.courses.requestLoad();
      fetchjson(`${urls.server}state?courses=${userid}`, endpoint.get(state),
        (json) => {
          dispatch.courses.receivedLoad(json);
        },
        dispatch.app.handleError,
        dispatch.courses.error);
    },

    async store(payload: string[]) {
      const dispatch = store.dispatch();
      const state = store.getState();
      const userid = state.app.userid;
      if (!userid)
        return;

      dispatch.courses.requestStore();
      fetchjson(`${urls.server}state?userid=${userid}&storeCourses=${userid}`, {... endpoint.post(state), body: JSON.stringify(payload)},
        () => {
          dispatch.courses.receivedStore(payload);
        },
        dispatch.app.handleError,
        dispatch.courses.error);
    },
    async loadCourse(course: string) {
      const dispatch = store.dispatch();
      const state = store.getState();
      const userid = state.app.userid;
      if (!userid || !course)
        return;

      dispatch.courses.requestLoadCourse();
      fetchjson(`${urls.server}state?userid=${userid}&course=${course}`, endpoint.get(state),
        (json) => {
          dispatch.courses.receivedLoadCourse(json);
        },
        dispatch.app.handleError,
        dispatch.courses.error);
    },
    async storeChange(payload: Course) {
      const dispatch = store.dispatch();
      const state = store.getState();
      const userid = state.app.userid;
      if (!userid)
        return;

      dispatch.courses.requestStoreChange();
      fetchjson(`${urls.server}state?userid=${userid}&storeCourse=${payload.name}`, {... endpoint.post(state), body: JSON.stringify(payload.students)},
        () => {
          dispatch.courses.receivedStoreChange(payload.students);

          if (!state.courses.courses.includes(payload.name))
            dispatch.courses.receivedLoad([... state.courses.courses, payload.name].sort());
        },
        dispatch.app.handleError,
        dispatch.courses.error);
    },

    'routing/change': async function(routing: RoutingState) {
      switch (routing.page) {
        case 'courses':
          document.title = "KMap - Kurse";
      }
    },
    'app/receivedLogin': async function() {
      const dispatch = store.dispatch();
      const state = store.getState();
      if (state.app.roles.includes("teacher"))
        dispatch.courses.load();
    },
    'app/receivedLogout': async function() {
      const dispatch = store.dispatch();
      dispatch.courses.forget();
    },
    'app/chooseInstance': async function() {
      const dispatch = store.dispatch();
      dispatch.courses.forget();
    },
  })
})
