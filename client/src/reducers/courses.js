import {
  LOAD_COURSES,
  STORE_COURSES,
  FORGET_COURSES,
  STORE_COURSE,
  SELECT_COURSE,
} from '../actions/courses';

const INITIAL_STATE = {
  loadCoursesFailure: false,
  loadCoursesFetching: false,
  loadCoursesResponse: null,
  storeCoursesFailure: false,
  storeCoursesFetching: false,
  storeCoursesResponse: null,
  loadCourseFailure: false,
  loadCourseFetching: false,
  loadCourseResponse: null,
  storeCourseFailure: false,
  storeCourseFetching: false,
  storeCourseResponse: null,
  courses: [],
  selectedCourse: '',
};

const state = (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case LOAD_COURSES:
      switch (action.status) {
        case 'pending':
          return {
            ...state,
            coursesFetching: true,
            coursesFailure: false,
            coursesResponse: null,
          };
        case 'success':
          return {
            ...state,
            coursesFetching: false,
            coursesFailure: false,
            coursesResponse: null,
            courses: action.courses
          };
        case 'error':
          return {
            ...state,
            coursesFetching: false,
            coursesFailure: true,
            coursesResponse: action.response,
          };
      }
    case STORE_COURSES:
      switch (action.status) {
        case 'pending':
          return {
            ...state,
            storeCoursesFetching: true,
            storeCoursesFailure: false,
            storeCoursesResponse: null,
          };
        case 'success':
          return {
            ...state,
            storeCoursesFetching: false,
            storeCoursesFailure: false,
            storeCoursesResponse: null,
            courses: action.courses
          };
        case 'error':
          return {
            ...state,
            storeCoursesFetching: false,
            storeCoursesFailure: true,
            storeCoursesResponse: action.response,
          };
      }
    case FORGET_COURSES:
      return {
        ...state,
        courses: []
      };
    case STORE_COURSE:
      switch (action.status) {
        case 'pending':
          return {
            ...state,
            storeCourseFetching: true,
            storeCourseFailure: false,
            storeCourseResponse: null,
          };
        case 'success':
          return {
            ...state,
            storeCourseFetching: false,
            storeCourseFailure: false,
            storeCourseResponse: null,
          };
        case 'error':
          return {
            ...state,
            storeCourseFetching: false,
            storeCourseFailure: true,
            storeCourseResponse: action.response,
          };
      }
    case SELECT_COURSE:
      return {
        ...state,
        selectedCourse: action.course
      };

    default:
      return state;
  }
};

export default state;
