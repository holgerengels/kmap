import {handleErrors} from "./fetchy";
import {config} from "../config";
import {logout, showMessage} from "./app";

export const LOAD_AVERAGE_STATES = 'LOAD_AVERAGE_STATES';
export const STORE_AVERAGE_STATES = 'STORE_AVERAGE_STATES';

export const fetchAverageStateIfNeeded = (subject, course) => (dispatch, getState) => {
  let state = getState();
  let userid = state.app.userid;
  if (userid && course && subject && !state.states.loadFetching) {
    dispatch(requestState(subject, course));
    return fetch(`${config.server}state?load=${userid}&subject=${subject}&course=${course}`, {
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
      .then(response => dispatch(receiveState(subject, course, response.data)))
      .catch(error => {
        dispatch(failState(subject, course, error));
        dispatch(showMessage(error.message));
        if (error.message === "invalid session")
          dispatch(logout({userid: state.userid}));
      });
  } else {
    return Promise.resolve();
  }
};

export const forgetAverageState = (subject, course) => {
  return {
    type: LOAD_AVERAGE_STATES,
    subject, course,
    status: 'forget',
  };
};

const requestState = (subject, course) => {
  return {
    type: LOAD_AVERAGE_STATES,
    subject, course,
    status: 'pending',
  };
};

const receiveState = (subject, course, state) => {
  return {
    type: LOAD_AVERAGE_STATES,
    subject, course,
    status: 'success',
    state,
  };
};

const failState = (subject, course, response) => {
  return {
    type: LOAD_AVERAGE_STATES,
    subject, course,
    status: 'error',
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
