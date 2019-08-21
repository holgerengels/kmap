import {
  LOAD_SET,
  SAVE_TEST,
  DELETE_TEST,
} from '../actions/test-editor';

const INITIAL_STATE = {
  loadSetFailure: false,
  loadSetFetching: false,
  loadSetResponse: null,
  tests: [],
  invalidated: true,
  saveTestFailure: false,
  saveTestFetching: false,
  saveTestResponse: null,
  deleteTestFailure: false,
  deleteTestFetching: false,
  deleteTestResponse: null,
  command: '',
};

const state = (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case LOAD_SET:
      switch (action.status) {
        case 'pending':
          return {
            ...state,
            loadSetFetching: true,
            loadSetFailure: false,
            loadSetResponse: null,
          };
        case 'success':
          return {
            ...state,
            loadSetFetching: false,
            loadSetFailure: false,
            loadSetResponse: null,
            tests: action.tests
          };
        case 'error':
          return {
            ...state,
            loadSetFetching: false,
            loadSetFailure: true,
            loadSetResponse: action.response,
          };
        case 'invalidate':
          return {
            ...state,
            loadSetFetching: false,
            loadSetFailure: false,
            loadSetResponse: null,
            invalidated: true,
          };
        case 'forget':
          return {
            ...state,
            loadSetFetching: false,
            loadSetFailure: false,
            loadSetResponse: null,
            tests: [],
          };
      }
    case SAVE_TEST:
      switch (action.status) {
        case 'pending':
          return {
            ...state,
            saveTestFetching: true,
            saveTestFailure: false,
            saveTestResponse: null,
          };
        case 'success':
          return {
            ...state,
            saveTestFetching: false,
            saveTestFailure: false,
            saveTestResponse: null,
            command: action.command
          };
        case 'error':
          return {
            ...state,
            saveTestFetching: false,
            saveTestFailure: true,
            saveTestResponse: action.response,
          };
      }
    case DELETE_TEST:
      switch (action.status) {
        case 'pending':
          return {
            ...state,
            deleteTestFetching: true,
            deleteTestFailure: false,
            deleteTestResponse: null,
          };
        case 'success':
          return {
            ...state,
            deleteTestFetching: false,
            deleteTestFailure: false,
            deleteTestResponse: null,
            command: action.command
          };
        case 'error':
          return {
            ...state,
            deleteTestFetching: false,
            deleteTestFailure: true,
            deleteTestResponse: action.response,
          };
      }
    default:
      return state;
  }
};

export default state;
