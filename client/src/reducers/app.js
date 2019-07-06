import {
  UPDATE_PAGE,
  UPDATE_OFFLINE,
  OPEN_DRAWER,
  CLOSE_DRAWER,
  SHOW_MESSAGE,
  TIMEOUT_MESSAGE,
  UPDATE_DATA_PATH,
  UPDATE_TITLE,
  LOGIN,
  LOGOUT,
} from '../actions/app.js';

const INITIAL_STATE = {
  page: '',
  offline: false,
  messages: [],
  drawerOpen: false,
  dataPath: [],
  title: "KnowledgeMap",
  userid: null,
  loginFailure: false,
  loginFetching: false,
  loginResponse: null,
  logoutFailure: false,
  logoutFetching: false,
  logoutResponse: null,
};

const app = (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case UPDATE_PAGE:
      return {
        ...state,
        page: action.page
      };
    case UPDATE_OFFLINE:
      return {
        ...state,
        offline: action.offline
      };
    case SHOW_MESSAGE:
      return {
        ...state,
        messages: [...state.messages, action.message]
      };
    case TIMEOUT_MESSAGE:
      let messages = [...state.messages];
      let index = messages.indexOf(action.message);
      if (index !== -1)
        messages.splice(index, 1);
      return {
        ...state,
        messages: messages
      };
    case UPDATE_DATA_PATH:
      return {
        ...state,
        dataPath: action.dataPath
      };
    case UPDATE_TITLE:
      return {
        ...state,
        title: action.title
      };
    case OPEN_DRAWER:
      return {
        ...state,
        drawerOpened: true
      };
    case CLOSE_DRAWER:
      return {
        ...state,
        drawerOpened: false
      };
    case LOGIN:
      switch (action.status) {
        case 'pending':
          return {
            ...state,
            loginFetching: true,
            loginFailure: false,
            loginResponse: null,
          };
        case 'success':
          return {
            ...state,
            loginFetching: false,
            loginFailure: false,
            loginResponse: null,
            userid: action.userid,
            roles: action.roles
          };
        case 'error':
          return {
            ...state,
            loginFetching: false,
            loginFailure: true,
            loginResponse: action.response,
          };
      }
    case LOGOUT:
      switch (action.status) {
        case 'pending':
          return {
            ...state,
            logoutFetching: true,
            logoutFailure: false,
            logoutResponse: null,
          };
        case 'success':
          return {
            ...state,
            logoutFetching: false,
            logoutFailure: false,
            logoutResponse: null,
            userid: null,
            roles: []
          };
        case 'error':
          return {
            ...state,
            logoutFetching: false,
            logoutFailure: true,
            logoutResponse: action.response
          };
      }
    default:
      return state;
  }
};

export default app;
