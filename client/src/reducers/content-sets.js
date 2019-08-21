import {
  SETS,
  SELECT_SET,
  IMPORT_SET,
  DELETE_SET,
} from '../actions/content-sets';

const INITIAL_STATE = {
  setsFailure: false,
  setsFetching: false,
  setsResponse: null,
  sets: [],
  selectedSet: null,
  importSetFailure: false,
  importSetFetching: false,
  importSetResponse: null,
  deleteSetFailure: false,
  deleteSetFetching: false,
  deleteSetResponse: null,
};

const state = (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case SETS:
      switch (action.status) {
        case 'pending':
          return {
            ...state,
            setsFetching: true,
            setsFailure: false,
            setsResponse: null,
          };
        case 'success':
          return {
            ...state,
            setsFetching: false,
            setsFailure: false,
            setsResponse: null,
            sets: action.data
          };
        case 'error':
          return {
            ...state,
            setsFetching: false,
            setsFailure: true,
            setsResponse: action.response,
          };
        case 'forget':
          return {
            ...state,
            setsFetching: false,
            setsFailure: false,
            setsResponse: null,
            sets: [],
            selectedSet: null,
          };
      }
    case IMPORT_SET:
      switch (action.status) {
        case 'pending':
          return {
            ...state,
            importSetFetching: true,
            importSetFailure: false,
            importSetResponse: null,
          };
        case 'success':
          return {
            ...state,
            importSetFetching: false,
            importSetFailure: false,
            importSetResponse: null,
          };
        case 'error':
          return {
            ...state,
            importSetFetching: false,
            importSetFailure: true,
            importSetResponse: action.response,
          };
      }
    case DELETE_SET:
      switch (action.status) {
        case 'pending':
          return {
            ...state,
            deleteSetFetching: true,
            deleteSetFailure: false,
            deleteSetResponse: null,
          };
        case 'success':
          return {
            ...state,
            deleteSetFetching: false,
            deleteSetFailure: false,
            deleteSetResponse: null,
          };
        case 'error':
          return {
            ...state,
            deleteSetFetching: false,
            deleteSetFailure: true,
            deleteSetResponse: action.response,
          };
      }
    case SELECT_SET:
      return {
        ...state,
        selectedSet: action.set
      };

    default:
      return state;
  }
};

export default state;
