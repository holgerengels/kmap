import {handleErrors} from "./fetchy";
import {config} from "../config";
import {logout, showMessage} from "./app";

export const LOAD_STATES = 'LOAD_STATES';
export const STORE_STATES = 'STORE_STATES';

export const fetchStateIfNeeded = (subject) => (dispatch, getState) => {
  let state = getState();
  let userid = state.app.userid;
  if (userid && subject && !state.states.loadFetching) {
    dispatch(requestState(subject));
    return fetch(`${config.server}state?load=${userid}&subject=${subject}`, {
      method: "GET",
      mode: "cors",
      cache: "no-cache",
      credentials: "include",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "X-Instance": state.app.instance,
      }
    })
      .then(handleErrors)
      .then(res => res.json())
      .then(response => dispatch(receiveState(subject, response.data)))
      .catch(error => {
        dispatch(failState(subject, error));
        dispatch(showMessage(error.message));
        if (error.message === "invalid session")
          dispatch(logout({userid: state.userid}));
      });
  }
  else {
    return Promise.resolve();
  }
};

export const forgetState = (subject) => {
  return {
    type: LOAD_STATES,
    status: 'forget',
    subject,
  };
};

const requestState = (subject) => {
  return {
    type: LOAD_STATES,
    status: 'pending',
    subject,
  };
};

const receiveState = (subject, state) => {
  return {
    type: LOAD_STATES,
    status: 'success',
    subject,
    state,
  };
};

const failState = (subject, response) => {
  return {
    type: LOAD_STATES,
    status: 'error',
    subject,
    response,
  };
};

function handleSessionTimeout(response) {
  let res = response.json();
  if (res.response === "error") {
    throw Error(res.message);
  }
  return response;
}

export const storeState = (state, id, rate) => (dispatch, getState) => {
  if (state && state.userid && state.subject && id && rate) {
    dispatch(requestStore(state.userid, state.subject, id, rate));
    return fetch(`${config.server}state?save=${state.userid}&subject=${state.subject}`, {
      method: "POST",
      mode: "cors",
      cache: "no-cache",
      credentials: "include",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "X-Instance": getState().app.instance,
      },
      body: JSON.stringify({save: state.userid, subject: state.subject, id: id, state: rate})
    })
      .then(handleErrors)
      .then(res => res.json())
      .then(response => dispatch(receiveStore(state.userid, state.subject, response.data)))
      .catch(error => {
        dispatch(failStore(state.userid, state.subject, error));
        dispatch(showMessage(error.message));
        if (error.message === "invalid session")
          dispatch(logout({userid: state.userid}));
      });
  }
  else {
    return Promise.resolve();
  }
};

const requestStore = (userid, subject) => {
  return {
    type: STORE_STATES,
    userid, subject,
    status: 'pending',
  };
};

const receiveStore = (userid, subject, state) => {
  return {
    type: STORE_STATES,
    userid, subject,
    status: 'success',
    state,
  };
};

const failStore = (userid, subject, response) => {
  return {
    type: STORE_STATES,
    userid, subject,
    status: 'error',
    response: response.message,
  };
};
