import {handleErrors} from "./fetchy";
import {logout, showMessage} from "./app";

export const LOAD = 'LOAD';

export const fetchStateIfNeeded = (state) => (dispatch, getState) => {
  if (state && state.userid && state.subject && !state.states && !state.loadFetching) {
    dispatch(requestState(state.userid, state.subject));
    return fetch(`http://127.0.0.1:8081/kmap/kmap/state?load=${state.userid}&subject=${state.subject}`, {
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
      .then(response => dispatch(receiveState(state.userid, state.subject, response.data)))
      .catch(error => dispatch(failState(state.userid, state.subject, error)));
  } else {
    return Promise.resolve();
  }
};

export const forgetState = (userid, subject) => {
  return {
    type: LOAD,
    userid,
    subject,
    status: 'forget',
  };
};

const requestState = (userid, subject) => {
  return {
    type: LOAD,
    userid, subject,
    status: 'pending',
  };
};

const receiveState = (userid, subject, state) => {
  return {
    type: LOAD,
    userid, subject,
    status: 'success',
    state,
  };
};

const failState = (userid, subject, response) => {
  return {
    type: LOAD,
    userid, subject,
    status: 'error',
    response,
  };
};

export const STORE = 'STORE';

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
    return fetch(`http://127.0.0.1:8081/kmap/kmap/state?save=${state.userid}&subject=${state.subject}`, {
      method: "POST",
      mode: "cors",
      cache: "no-cache",
      credentials: "include",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
      },
      body: JSON.stringify({save: state.userid, subject: state.subject, id: id, state: rate})
    })
      .then(handleErrors)
      .then(res => res.json())
      .then(response => dispatch(receiveStore(state.userid, state.subject, response.data)))
      .catch(error => {
          dispatch(failStore(state.userid, state.subject, error));
          dispatch(logout({ userid: state.userid }));
          dispatch(showMessage(error.message));
        }
      );
  } else {
    return Promise.resolve();
  }
};

const requestStore = (userid, subject) => {
  return {
    type: STORE,
    userid, subject,
    status: 'pending',
  };
};

const receiveStore = (userid, subject, state) => {
  return {
    type: STORE,
    userid, subject,
    status: 'success',
    state,
  };
};

const failStore = (userid, subject, response) => {
  return {
    type: STORE,
    userid, subject,
    status: 'error',
    response: response.message,
  };
};
