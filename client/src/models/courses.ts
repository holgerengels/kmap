import {createModel, RoutingState} from '@captaincodeman/rdx-model';
import { Store } from '../store';
import {endpoint, fetchjson} from "../endpoint";
import {urls} from "../urls";

export interface Course {
  subject: string,
  name: string,
  students: string[],
  curriculum: string,
}

export interface Timeline {
  subject: string,
  name: string,
  curriculum: string,
}

export interface CoursesState {
  courses: Course[],
  selectedCourse?: Course,
  timelines: Timeline[],
  selectedTimeline?: Timeline,
  timestamp: number,
  loading: boolean,
  loadingCourse: boolean,
  saving: boolean,
  deleting: boolean,
  error: string,
}

export default createModel({
  state: <CoursesState>{
    courses: [],
    selectedCourse: undefined,
    timelines: [],
    selectedTimeline: undefined,
    timestamp: -1,
    loading: false,
    loadingCourse: false,
    saving: false,
    deleting: false,
    error: "",
  },
  reducers: {
    requestLoadCourses(state) {
      return { ...state, loading: true,
        timestamp: Date.now(),
        error: "",
      };
    },
    receivedLoadCourses(state, payload: Course[]) {
      return { ...state,
        courses: payload,
        selectedCourse: state.selectedCourse && payload.includes(state.selectedCourse) ? state.selectedCourse : undefined,
        students: undefined,
        loading: false,
      };
    },
    requestLoadTimelines(state) {
      return { ...state, loading: true,
        timestamp: Date.now(),
        error: "",
      };
    },
    receivedLoadTimelines(state, payload: Timeline[]) {
      return { ...state,
        timelines: payload,
        selectedTimeline: state.selectedTimeline && payload.includes(state.selectedTimeline) ? state.selectedTimeline : undefined,
        students: undefined,
        loading: false,
      };
    },
    forget(state) {
      return { ...state,
        courses: [],
        selectedCourse: undefined,
        timelines: [],
        selectedTimeline: undefined,
        students: undefined,
        timestamp: Date.now(),
        error: "",
      };
    },

    requestDeleteCourse(state) {
      return { ...state, deleting: true,
        error: "",
      };
    },
    receivedDeleteCourse(state, payload: Course[]) {
      return { ...state,
        courses: payload,
        selectedCourse: state.selectedCourse && payload.includes(state.selectedCourse) ? state.selectedCourse : undefined,
        deleting: false,
      };
    },

    requestSaveCourse(state) {
      return { ...state, saving: true,
        error: "",
      };
    },
    receivedSaveCourse(state, payload: Course[]) {
      return { ...state,
        courses: payload,
        selectedCourse: state.selectedCourse && payload.includes(state.selectedCourse) ? state.selectedCourse : undefined,
        saving: false,
      };
    },

    selectCourse(state, course: Course) {
      return { ...state, selectedCourse: course }
    },
    unselectCourse(state) {
      return { ...state, selectedCourse: undefined }
    },

    selectTimeline(state, timeline: Timeline) {
      return { ...state, selectedTimeline: timeline }
    },
    unselectTimeline(state) {
      return { ...state, selectedTimeline: undefined }
    },

    error(state, message) {
      return { ...state,
        loading: false,
        deleting: false,
        saving: false,
        error: message,
      }
    },
  },

  // @ts-ignore
  effects: (store: Store) => ({
    async loadCourses() {
      const dispatch = store.dispatch();
      const state = store.getState();
      const userid = state.app.userid;
      if (!userid)
        return;

      // @ts-ignore
      if (Date.now() - state.courses.timestamp < 3000) {
        console.warn("reloading after " + (state.courses.timestamp - Date.now()) + " ms");
      }

      dispatch.courses.requestLoadCourses();
      fetchjson(`${urls.server}state?courses=${userid}`, endpoint.get(state),
        (json) => {
          dispatch.courses.receivedLoadCourses(json);
        },
        dispatch.app.handleError,
        dispatch.courses.error);
    },
    async loadTimelines() {
      const dispatch = store.dispatch();
      const state = store.getState();
      const userid = state.app.userid;
      if (!userid)
        return;

      // @ts-ignore
      if (Date.now() - state.courses.timestamp < 3000) {
        console.warn("reloading after " + (state.courses.timestamp - Date.now()) + " ms");
      }

      dispatch.courses.requestLoadTimelines();
      fetchjson(`${urls.server}state?timelines=${userid}`, endpoint.get(state),
        (json) => {
          dispatch.courses.receivedLoadTimelines(json);
        },
        dispatch.app.handleError,
        dispatch.courses.error);
    },

    async deleteCourse(course: Course) {
      const dispatch = store.dispatch();
      const state = store.getState();
      const userid = state.app.userid;
      if (!userid)
        return;

      dispatch.courses.requestDeleteCourse();
      fetchjson(`${urls.server}state?userid=${userid}&deleteCourse=${name}`, {... endpoint.post(state), body: JSON.stringify(course)},
        () => {
          const courses: Course[] = state.courses.courses.filter(c => c.name != course.name);
          dispatch.courses.receivedDeleteCourse(courses);
        },
        dispatch.app.handleError,
        dispatch.courses.error);
    },

    async saveCourse(course: Course) {
      const dispatch = store.dispatch();
      const state = store.getState();
      const userid = state.app.userid;
      if (!userid)
        return;

      dispatch.courses.requestSaveCourse();
      fetchjson(`${urls.server}state?userid=${userid}&saveCourse=${course.name}`, {... endpoint.post(state), body: JSON.stringify(course)},
        () => {
          const courses: Course[] = state.courses.courses.filter(c => c.name != course.name);
          courses.push(course);
          courses.sort((a, b) => a.name.localeCompare(b.name));
          dispatch.courses.receivedSaveCourse(courses);
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
        dispatch.courses.loadCourses();
    },
    'app/receivedLogout': async function() {
      const dispatch = store.dispatch();
      dispatch.courses.forget();
    },
    'app/chooseInstance': async function() {
      const dispatch = store.dispatch();
      dispatch.courses.forget();
    },
    'shell/addLayer': async function() {
      const dispatch = store.dispatch();
      const state = store.getState();
      if (state.shell.layers.includes("timeline")) {
        dispatch.shell.addMessage("Die Timeline Funktion ist noch nicht fertig umgesetzt");
        dispatch.courses.loadTimelines();
      }
    },
  })
})
