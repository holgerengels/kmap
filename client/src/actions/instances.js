import {handleErrors} from "./fetchy";
import {config} from "../config";
import {logout, showMessage} from "./app";
import {store} from "../store";

export const INSTANCES = 'INSTANCES';
export const CREATE_INSTANCE = 'CREATE_INSTANCE';
export const DROP_INSTANCE = 'DROP_INSTANCE';

export const loadInstances = () => (dispatch, getState) => {
  let state = getState();
  let userid = state.app.userid;
  if (userid && !state.instances.instancesFetching) {
    dispatch(requestInstances());
    return fetch(`${config.server}content?instances=lala`, {
      method: "GET",
      mode: "cors",
      cache: "no-cache",
      credentials: "include",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
      }
    })
      .then(handleErrors)
      .then(res => res.json())
      .then(result => dispatch(receiveInstances(result)))
      .catch(error => {
        dispatch(failInstances(error));
        dispatch(showMessage(error.message));
        if (error.message === "invalid session")
          dispatch(logout({userid: userid}));
      });
  } else {
    return Promise.resolve();
  }
};

const requestInstances = () => {
  return { type: INSTANCES, status: 'pending', };
};

const receiveInstances = (instances) => {
  return { type: INSTANCES, status: 'success', instances, };
};

const failInstances = (response) => {
  return { type: INSTANCES, status: 'error', response: response.message, };
};

export const invalidateInstances = () => {
  return { type: INSTANCES, status: 'invalidate', };
};

export const forgetInstances = () => {
  return { type: INSTANCES, status: 'forget', };
};

export const createInstance = (name) => (dispatch, getState) => {
  let state = getState();
  let userid = state.app.userid;
  if (userid && name) {
    dispatch(requestCreateInstance(name));
    return fetch(`${config.server}content?create=${name}`, {
      method: "POST",
      mode: "cors",
      cache: "no-cache",
      credentials: "include",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
      },
    })
      .then(handleErrors)
      .then(res => res.json())
      .then(response => dispatch(receiveCreateInstance(name)))
      .then(lala => window.setTimeout(function() { store.dispatch(loadInstances()); }.bind(undefined), 1000))
      .catch(error => {
        dispatch(failCreateInstance(error));
        dispatch(showMessage(error.message));
        if (error.message === "invalid session")
          dispatch(logout({userid: userid}));
      });
  } else {
    return Promise.resolve();
  }
};

const requestCreateInstance = (name) => {
  return { type: CREATE_INSTANCE, status: 'pending', name, };
};

const receiveCreateInstance = (name) => {
  return { type: CREATE_INSTANCE, status: 'success', name, };
};

const failCreateInstance = (response) => {
  return { type: CREATE_INSTANCE, status: 'error', response: response.message, };
};

export const dropInstance = (name) => (dispatch, getState) => {
  let state = getState();
  let userid = state.app.userid;

  if (userid && name) {
    dispatch(requestDropInstance(name));
    return fetch(`${config.server}content?drop=${name}`, {
      method: "POST",
      mode: "cors",
      cache: "no-cache",
      credentials: "include",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
      },
    })
      .then(handleErrors)
      .then(res => res.json())
      .then(response => dispatch(receiveDropInstance(name)))
      .then(lala => window.setTimeout(function() { store.dispatch(loadInstances()); }.bind(undefined), 1000))
      .catch(error => {
        dispatch(failDropInstance(error));
        dispatch(showMessage(error.message));
        if (error.message === "invalid session")
          dispatch(logout({userid: userid}));
      });
  }
  else {
    return Promise.resolve();
  }
};

const requestDropInstance = (name) => {
  return { type: DROP_INSTANCE, status: 'pending', name, };
};

const receiveDropInstance = (name) => {
  return { type: DROP_INSTANCE, status: 'success', name, };
};

const failDropInstance = (response) => {
  return { type: DROP_INSTANCE, status: 'error', response: response.message, };
};
