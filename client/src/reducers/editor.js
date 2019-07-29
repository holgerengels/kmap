import {
  SAVE_TOPIC,
  RENAME_TOPIC,
  DELETE_TOPIC,
} from '../actions/editor';

const INITIAL_STATE = {
  saveTopicFailure: false,
  saveTopicFetching: false,
  saveTopicResponse: null,
  renameTopicFailure: false,
  renameTopicFetching: false,
  renameTopicResponse: null,
  deleteTopicFailure: false,
  deleteTopicFetching: false,
  deleteTopicResponse: null,
  command: '',
};

const state = (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case SAVE_TOPIC:
      switch (action.status) {
        case 'pending':
          return {
            ...state,
            saveTopicFetching: true,
            saveTopicFailure: false,
            saveTopicResponse: null,
          };
        case 'success':
          return {
            ...state,
            saveTopicFetching: false,
            saveTopicFailure: false,
            saveTopicResponse: null,
            command: action.command
          };
        case 'error':
          return {
            ...state,
            saveTopicFetching: false,
            saveTopicFailure: true,
            saveTopicResponse: action.response,
          };
      }
    case RENAME_TOPIC:
      switch (action.status) {
        case 'pending':
          return {
            ...state,
            renameTopicFetching: true,
            renameTopicFailure: false,
            renameTopicResponse: null,
          };
        case 'success':
          return {
            ...state,
            renameTopicFetching: false,
            renameTopicFailure: false,
            renameTopicResponse: null,
            command: action.command
          };
        case 'error':
          return {
            ...state,
            renameTopicFetching: false,
            renameTopicFailure: true,
            renameTopicResponse: action.response,
          };
      }
    case DELETE_TOPIC:
      switch (action.status) {
        case 'pending':
          return {
            ...state,
            deleteTopicFetching: true,
            deleteTopicFailure: false,
            deleteTopicResponse: null,
          };
        case 'success':
          return {
            ...state,
            deleteTopicFetching: false,
            deleteTopicFailure: false,
            deleteTopicResponse: null,
            command: action.command
          };
        case 'error':
          return {
            ...state,
            deleteTopicFetching: false,
            deleteTopicFailure: true,
            deleteTopicResponse: action.response,
          };
      }
    default:
      return state;
  }
};

export default state;
