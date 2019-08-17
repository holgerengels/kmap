import {
  INSTANCES,
  CREATE_INSTANCE,
  DROP_INSTANCE,
} from '../actions/instances';

const INITIAL_STATE = {
  instancesFailure: false,
  instancesFetching: false,
  instancesResponse: null,
  instances: [],
  createInstanceFailure: false,
  createInstanceFetching: false,
  createInstanceResponse: null,
  dropInstanceFailure: false,
  dropInstanceFetching: false,
  dropInstanceResponse: null,
};

const state = (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case INSTANCES:
      switch (action.status) {
        case 'pending':
          return {
            ...state,
            instancesFetching: true,
            instancesFailure: false,
            instancesResponse: null,
          };
        case 'success':
          return {
            ...state,
            instancesFetching: false,
            instancesFailure: false,
            instancesResponse: null,
            instances: action.instances
          };
        case 'error':
          return {
            ...state,
            instancesFetching: false,
            instancesFailure: true,
            instancesResponse: action.response,
          };
        case 'forget':
          return {
            ...state,
            instancesFetching: false,
            instancesFailure: false,
            instancesResponse: null,
            instances: [],
          };
      }
    case CREATE_INSTANCE:
      switch (action.status) {
        case 'pending':
          return {
            ...state,
            createInstanceFetching: true,
            createInstanceFailure: false,
            createInstanceResponse: null,
          };
        case 'success':
          return {
            ...state,
            createInstanceFetching: false,
            createInstanceFailure: false,
            createInstanceResponse: null,
          };
        case 'error':
          return {
            ...state,
            createInstanceFetching: false,
            createInstanceFailure: true,
            createInstanceResponse: action.response,
          };
      }
    case DROP_INSTANCE:
      switch (action.status) {
        case 'pending':
          return {
            ...state,
            dropInstanceFetching: true,
            dropInstanceFailure: false,
            dropInstanceResponse: null,
          };
        case 'success':
          return {
            ...state,
            dropInstanceFetching: false,
            dropInstanceFailure: false,
            dropInstanceResponse: null,
          };
        case 'error':
          return {
            ...state,
            dropInstanceFetching: false,
            dropInstanceFailure: true,
            dropInstanceResponse: action.response,
          };
      }
    default:
      return state;
  }
};

export default state;
