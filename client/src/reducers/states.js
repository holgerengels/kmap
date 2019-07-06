import {
  LOAD,
  STORE,
} from '../actions/states.js';

const INITIAL_STATE = {
  loadFailure: false,
  loadFetching: false,
  loadResponse: null,
  storeFailure: false,
  storeFetching: false,
  storeResponse: null,
  state: [],
};

const state = (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case LOAD:
      switch (action.status) {
        case 'pending':
          return {
            ...state,
            loadFetching: true,
            loadFailure: false,
            loadResponse: null,
          };
        case 'success':
          return {
            ...state,
            loadFetching: false,
            loadFailure: false,
            loadResponse: null,
            state: action.state
          };
        case 'error':
          return {
            ...state,
            loadFetching: false,
            loadFailure: true,
            loadResponse: action.response,
          };
        case 'forget':
          return {
            ...state,
            loadFetching: false,
            loadFailure: false,
            loadResponse: null,
            state: [],
          };
      }
    case STORE:
      switch (action.status) {
        case 'pending':
          return {
            ...state,
            storeFetching: true,
            storeFailure: false,
            storeResponse: null,
          };
        case 'success':
          return {
            ...state,
            storeFetching: false,
            storeFailure: false,
            storeResponse: null,
            state: action.state
          };
        case 'error':
          return {
            ...state,
            storeFetching: false,
            storeFailure: true,
            storeResponse: action.response,
          };
      }
    default:
      return state;
  }
};

export default state;
