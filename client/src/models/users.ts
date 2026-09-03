import {createModel} from '@captaincodeman/rdx'
import {Store} from '../store'
import {endpoint, fetchjson} from "../endpoint";
import {urls} from "../urls";

export interface User {
  userid: string,
  email: string,
  displayName: string,
  roles: string[],
}

export interface UsersState {
  users: User[],
  loading: boolean,
  creating: boolean,
  editing: boolean,
  deleting: boolean,
}

export default createModel({
  state: <UsersState>{
    users: [],
    loading: false,
    creating: false,
    editing: false,
    deleting: false,
  },

  reducers: {
    requestLoad(state) {
      return { ...state, loading: true };
    },
    receivedLoad(state, users: User[]) {
      return { ...state, users: users, loading: false };
    },
    requestCreate(state) {
      return { ...state, creating: true };
    },
    receivedCreate(state) {
      return { ...state, creating: false };
    },
    requestEdit(state) {
      return { ...state, editing: true };
    },
    receivedEdit(state) {
      return { ...state, editing: false };
    },
    requestDelete(state) {
      return { ...state, deleting: true };
    },
    receivedDelete(state) {
      return { ...state, deleting: false };
    },
    error(state, _message) {
      return { ...state, loading: false, creating: false, editing: false, deleting: false };
    },
  },

  effects(store: Store) {
    const dispatch = store.getDispatch();
    return {
      async load() {
        const state = store.getState();
        dispatch.users.requestLoad();
        fetchjson(`${urls.server}auth?users=true`, {
            ...endpoint.get(state),
          },
          (json) => {
            dispatch.users.receivedLoad(json);
          },
          dispatch.app.handleError,
          (msg) => { dispatch.users.error(msg); dispatch.shell.showMessage(msg); });
      },
      async create(payload: {userid: string, email: string, password: string, displayName: string}) {
        const state = store.getState();
        dispatch.users.requestCreate();
        fetchjson(`${urls.server}auth?create-user=true`, {
            ...endpoint.post(state),
            body: JSON.stringify(payload)
          },
          () => {
            dispatch.users.receivedCreate();
            dispatch.users.load();
            dispatch.shell.showMessage("Benutzer angelegt");
          },
          dispatch.app.handleError,
          (msg) => { dispatch.users.error(msg); dispatch.shell.showMessage(msg); });
      },
      async edit(payload: {userid: string, email?: string, displayName?: string, roles?: string[]}) {
        const state = store.getState();
        dispatch.users.requestEdit();
        fetchjson(`${urls.server}auth?edit-user=${payload.userid}`, {
            ...endpoint.post(state),
            body: JSON.stringify(payload)
          },
          () => {
            dispatch.users.receivedEdit();
            dispatch.users.load();
            dispatch.shell.showMessage("Benutzer gespeichert");
          },
          dispatch.app.handleError,
          (msg) => { dispatch.users.error(msg); dispatch.shell.showMessage(msg); });
      },
      async deleteUser(userid: string) {
        const state = store.getState();
        dispatch.users.requestDelete();
        fetchjson(`${urls.server}auth?delete-user=${userid}`, {
            ...endpoint.post(state),
            body: JSON.stringify({userid: userid})
          },
          () => {
            dispatch.users.receivedDelete();
            dispatch.users.load();
            dispatch.shell.showMessage("Benutzer gelöscht");
          },
          dispatch.app.handleError,
          (msg) => { dispatch.users.error(msg); dispatch.shell.showMessage(msg); });
      },
      async resetUserPassword(userid: string) {
        const state = store.getState();
        fetchjson(`${urls.server}auth?reset-user-password=${userid}`, {
            ...endpoint.post(state),
            body: JSON.stringify({userid: userid})
          },
          () => {
            dispatch.shell.showMessage("Reset-Mail gesendet");
          },
          dispatch.app.handleError,
          (msg) => { dispatch.shell.showMessage(msg); });
      },
    }
  }
})
