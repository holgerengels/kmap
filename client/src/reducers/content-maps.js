import {
  MODULES,
  FORGET_MODULES,
  SELECT_MODULE,
  IMPORT_MAP,
  DELETE_MAP,
} from '../actions/content-maps';

const INITIAL_STATE = {
  modulesFailure: false,
  modulesFetching: false,
  modulesResponse: null,
  modules: [],
  selectedModule: null,
  importMapFailure: false,
  importMapFetching: false,
  importMapResponse: null,
  deleteMapFailure: false,
  deleteMapFetching: false,
  deleteMapResponse: null,
};

const state = (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case MODULES:
      switch (action.status) {
        case 'pending':
          return {
            ...state,
            modulesFetching: true,
            modulesFailure: false,
            modulesResponse: null,
          };
        case 'success':
          return {
            ...state,
            modulesFetching: false,
            modulesFailure: false,
            modulesResponse: null,
            modules: action.data
          };
        case 'error':
          return {
            ...state,
            modulesFetching: false,
            modulesFailure: true,
            modulesResponse: action.response,
          };
      }
    case IMPORT_MAP:
      switch (action.status) {
        case 'pending':
          return {
            ...state,
            importMapFetching: true,
            importMapFailure: false,
            importMapResponse: null,
          };
        case 'success':
          return {
            ...state,
            importMapFetching: false,
            importMapFailure: false,
            importMapResponse: null,
          };
        case 'error':
          return {
            ...state,
            importMapFetching: false,
            importMapFailure: true,
            importMapResponse: action.response,
          };
      }
    case FORGET_MODULES:
      return {
        ...state,
        modules: []
      };
    case DELETE_MAP:
      switch (action.status) {
        case 'pending':
          return {
            ...state,
            deleteMapFetching: true,
            deleteMapFailure: false,
            deleteMapResponse: null,
          };
        case 'success':
          return {
            ...state,
            deleteMapFetching: false,
            deleteMapFailure: false,
            deleteMapResponse: null,
          };
        case 'error':
          return {
            ...state,
            deleteMapFetching: false,
            deleteMapFailure: true,
            deleteMapResponse: action.response,
          };
      }
    case SELECT_MODULE:
      return {
        ...state,
        selectedModule: action.module
      };

    default:
      return state;
  }
};

export default state;
