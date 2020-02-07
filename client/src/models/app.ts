import { createModel } from '@captaincodeman/rdx-model';
import { State, Dispatch } from '../store';
import {endpoint, fetchjson} from "../endpoint";
import {config} from "../config";

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
}

export default createModel({
  state: <AppState>{
    instance: "",
    userid: "",
    roles: [],
    offline: false,
    authenticating: false,
    error: "",
  },
  reducers: {
    chooseInstance(state, instance: string | null) {
      return { ...state, instance: instance ? instance : "" }
    },
    updateOffline(state, offline: boolean) {
      return { ...state, offline: offline }
    },
    requestLogin(state) {
      return { ...state, authenticating: true };
    },
    receivedLogin(state, payload: Login) {
      return { ...state,
        userid: payload.userid,
        roles: payload.roles,
        authenticating: false,
      };
    },
    requestLogout(state) {
      return { ...state, authenticating: true };
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
  },

  // @ts-ignore
  effects: (dispatch: Dispatch, getState) => ({
    async login(payload: Credentials) {
      const state: State = getState();
      // @ts-ignore
      dispatch.app.requestLogin();
      fetchjson(`${config.server}state?login=${payload.userid}`, {... endpoint.post(state), body: JSON.stringify(payload)},
        (json) => {
          dispatch.app.receivedLogin({ userid: payload.userid, roles: json});
        },
        dispatch.app.handleError,
        dispatch.app.error);
    },
    async logout() {
      const state: State = getState();
      // @ts-ignore
      dispatch.app.requestLogout();
      fetchjson(`${config.server}state?logout=${state.app.userid}`, {... endpoint.post(state), body: JSON.stringify({userid: state.app.userid})},
        () => {
          dispatch.app.receivedLogout();
        },
        dispatch.app.handleError,
        dispatch.app.error);
    },
    handleError(error: Error) {
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

    /*
        'routing/change': async function(payload: RoutingState) {
          switch (payload.page) {
            case 'browser':
              // @ts-ignore
              dispatch.maps.load(payload.page["subject"], payload.page["chapter"]);
              break;
          }
        }
     */
  })
})