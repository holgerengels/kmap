import { createModel } from '@captaincodeman/rdx-model';
import { Store } from '../store';
import {endpoint, fetchjson} from "../endpoint";
import {urls} from "../urls";

export interface Error {
  code: number,
  message: string,
}

export interface Login {
  userid: string,
  roles: string[],
}

export interface Credentials {
  userid: string,
  password: string,
}

export interface AppState {
  instance: string,
  userid: string,
  roles: string[],
  offline: boolean,
  authenticating: boolean,
  error: string,
  loginResponse: string,
}

export default createModel({
  state: <AppState>{
    instance: "",
    userid: "",
    roles: [],
    offline: false,
    authenticating: false,
    error: "",
    loginResponse: "",
  },
  reducers: {
    chooseInstance(state, instance: string | null) {
      return { ...state, instance: instance ? instance : "" }
    },
    updateOffline(state, offline: boolean) {
      return { ...state, offline: offline }
    },
    requestLogin(state) {
      return { ...state, authenticating: true, loginResponse: "" };
    },
    receivedLogin(state, payload: Login) {
      return { ...state,
        userid: payload.userid,
        roles: payload.roles,
        authenticating: false,
      };
    },
    requestLogout(state) {
      return { ...state, authenticating: true, error: "" };
    },
    receivedLogout(state) {
      return { ...state,
        userid: '',
        roles: [],
        authenticating: false,
      };
    },
    logout(state) {
      return { ...state, userid: "", roles: [] };
    },
    error(state, message) {
      return { ...state,
        authenticating: false,
        error: message,
      }
    },
    loginResponse(state, message) {
      return { ...state, authenticating: false, loginResponse: message }
    },
    clearLoginResponse(state) {
      return { ...state, loginResponse: "" }
    },
  },

  // @ts-ignore
  effects: (store: Store) => ({
    async login(payload: Credentials) {
      const dispatch = store.dispatch();
      const state = store.getState();
      // @ts-ignore
      dispatch.app.requestLogin();
      fetchjson(`${urls.server}state?login=${payload.userid}`, {... endpoint.post(state), body: JSON.stringify(payload)},
        (json) => {
          dispatch.app.receivedLogin({ userid: payload.userid, roles: json});
        },
        dispatch.app.handleError,
        dispatch.app.loginResponse);
    },
    async logout() {
      const dispatch = store.dispatch();
      const state = store.getState();
      // @ts-ignore
      dispatch.app.requestLogout();
      fetchjson(`${urls.server}state?logout=${state.app.userid}`, {... endpoint.post(state), body: JSON.stringify({userid: state.app.userid})},
        () => {
          dispatch.app.receivedLogout();
        },
        dispatch.app.handleError,
        dispatch.app.error);
    },

    handleError(error: Error) {
      const dispatch = store.dispatch();
      switch (error.code) {
        case 401:
          dispatch.shell.showMessage(error.message);
          dispatch.app.logout();
          break;
        case 500:
          dispatch.shell.showMessage(error.message);
          break;
      }
    },

    'app/chooseInstance': async function() {
      const dispatch = store.dispatch();
      dispatch.app.logout();
    },
  })
})
