import { createModel } from '@captaincodeman/rdx';
import {Store} from '../store';
import {endpoint, fetchjson} from "../endpoint";
import {urls} from "../urls";

export interface Error {
  code: number,
  message: string,
}

export interface Login {
  userid: string,
  username: string,
  roles: string[],
}

export interface Credentials {
  userid: string,
  password: string,
}

export interface Registration {
  userid: string,
  email: string,
  password: string,
  displayName: string,
}

export interface AppState {
  version: string,
  instance: string,
  userid: string,
  username?: string,
  roles: string[],
  offline: boolean,
  authenticating: boolean,
  error: string,
  loginResponse: string,
}

export default createModel({
  state: <AppState>{
    version: (window as any).kmapVersion,
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
        username: payload.username,
        roles: payload.roles.sort(),
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
    requestDeleteData(state) {
      return { ...state, authenticating: true, error: "" };
    },
    receivedDeleteData(state) {
      return { ...state,
        authenticating: false,
      };
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

  effects(store: Store) {
    const dispatch = store.getDispatch();
    return {
      async init() {
        const state = store.getState();
        if (state.app.instance === "") {
          if ((window as any).kmapInstance)
            dispatch.app.chooseInstance((window as any).kmapInstance);
          else
            dispatch.app.chooseInstance("root");
        }
      },
      async login(payload: Credentials) {
        const state = store.getState();

        dispatch.app.requestLogin();
        fetchjson(`${urls.server}auth?login=${payload.userid}`, {
            ...endpoint.post(state),
            body: JSON.stringify(payload)
          },
          (json) => {
            const roles = json.filter(r => !r.startsWith("displayName:"));
            const username = roles.length != json.length ? json.filter(r => r.startsWith("displayName:"))[0].substr("displayName:".length) : payload.userid;
            dispatch.app.receivedLogin({userid: payload.userid, roles: roles, username: username});
          },
          dispatch.app.handleError,
          dispatch.app.loginResponse);
      },
      async logout() {
        const state = store.getState();

        dispatch.app.requestLogout();
        fetchjson(`${urls.server}auth?logout=${state.app.userid}`, {
            ...endpoint.post(state),
            body: JSON.stringify({userid: state.app.userid})
          },
          () => {
            dispatch.app.receivedLogout();
          },
          dispatch.app.handleError,
          dispatch.app.error);
      },
      async deleteData() {
        const state = store.getState();

        dispatch.app.requestDeleteData();
        fetchjson(`${urls.server}state?delete=${state.app.userid}`, {
            ...endpoint.post(state),
            body: JSON.stringify({userid: state.app.userid})
          },
          () => {
            dispatch.app.receivedDeleteData();
            dispatch.app.receivedLogout();
          },
          dispatch.app.handleError,
          dispatch.app.error);
      },
      async deleteAccount() {
        const state = store.getState();

        dispatch.app.requestDeleteData();
        // First delete learning data
        fetchjson(`${urls.server}state?delete=${state.app.userid}`, {
            ...endpoint.post(state),
            body: JSON.stringify({userid: state.app.userid})
          },
          () => {
            // Then delete the CouchDB account
            fetchjson(`${urls.server}auth?delete-account=true`, {
                ...endpoint.post(state),
                body: JSON.stringify({userid: state.app.userid})
              },
              () => {
                dispatch.app.receivedDeleteData();
                dispatch.app.receivedLogout();
                dispatch.shell.showMessage("Konto und Daten wurden gelöscht");
              },
              dispatch.app.handleError,
              dispatch.app.error);
          },
          dispatch.app.handleError,
          dispatch.app.error);
      },
      async register(payload: Registration) {
        const state = store.getState();

        dispatch.app.requestLogin();
        fetchjson(`${urls.server}auth?register=true`, {
            ...endpoint.post(state),
            body: JSON.stringify(payload)
          },
          () => {
            dispatch.app.loginResponse("Registrierung erfolgreich! Du kannst dich jetzt anmelden.");
          },
          dispatch.app.handleError,
          dispatch.app.loginResponse);
      },
      async resetPassword(email: string) {
        const state = store.getState();

        dispatch.app.requestLogin();
        fetchjson(`${urls.server}auth?reset-password=true`, {
            ...endpoint.post(state),
            body: JSON.stringify({email: email})
          },
          (json) => {
            dispatch.app.loginResponse(json);
          },
          dispatch.app.handleError,
          dispatch.app.loginResponse);
      },
      async resetPasswordConfirm(payload: {token: string, password: string}) {
        const state = store.getState();

        dispatch.app.requestLogin();
        fetchjson(`${urls.server}auth?reset-password-confirm=true`, {
            ...endpoint.post(state),
            body: JSON.stringify(payload)
          },
          (json) => {
            dispatch.app.loginResponse(json);
          },
          dispatch.app.handleError,
          dispatch.app.loginResponse);
      },

      async changePassword(payload: {oldPassword: string, newPassword: string}) {
        const state = store.getState();

        dispatch.app.requestLogin();
        fetchjson(`${urls.server}auth?change-password=true`, {
            ...endpoint.post(state),
            body: JSON.stringify(payload)
          },
          (json) => {
            dispatch.app.loginResponse(json);
          },
          dispatch.app.handleError,
          dispatch.app.loginResponse);
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

      'app/chooseInstance': async function () {
        dispatch.app.logout();
      },
    }
  }
})
