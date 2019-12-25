import { createModel } from '@captaincodeman/rdx-model';
import { State, Dispatch } from '../store';
import {endpoint} from "../endpoint";
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
    chooseInstance(state, instance: string) {
      return { ...state, instance: instance }
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
      const resp = await fetch(`${config.server}state?login=${payload.userid}`, {... endpoint.post(state), body: JSON.stringify(payload)});
      if (resp.ok) {
        const json = await resp.json();
        // @ts-ignore
        dispatch.app.receivedLogin({ userid: payload.userid, roles: json});
      }
      else {
        const message = await resp.text();
        // @ts-ignore
        dispatch.app.handleError({ code: resp.status, message: message });
        dispatch.app.error(message);
      }
    },
    async logout() {
      const state: State = getState();
      // @ts-ignore
      dispatch.app.requestLogout();
      const resp = await fetch(`${config.server}state?logout=${state.app.userid}`, {... endpoint.post(state), body: JSON.stringify({userid: state.app.userid})});
      if (resp.ok) {
        // @ts-ignore
        const json = await resp.json();
        dispatch.app.receivedLogout();
      }
      else {
        const message = await resp.text();
        // @ts-ignore
        dispatch.app.handleError({ code: resp.status, message: message });
        dispatch.app.error(message);
      }
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
