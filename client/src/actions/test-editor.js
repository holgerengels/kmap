import {handleErrors} from "./fetchy";
import {config} from "../config";
import {logout, showMessage} from "./app";

export const LOAD_SET = 'LOAD_SET';
export const SAVE_TEST = 'SAVE_TEST';
export const DELETE_TEST = 'DELETE_TEST';

export const loadSet = (subject, set) => (dispatch, getState) => {
  let state = getState();
  let userid = state.app.userid;

  if (userid && !state.testEditor.setFetching) {
    dispatch(requestSet(subject, set));
    return fetch(`${config.server}tests?subject=${subject}&set=${set}`, {
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
      .then(data => dispatch(receiveSet(subject, set, data.data)))
      .catch(error => {
        dispatch(failSet(subject, set, error));
        dispatch(showMessage(error.message));
        if (error.message === "invalid session")
          dispatch(logout({userid: userid}));
      });
  } else {
    return Promise.resolve();
  }
};

const requestSet = (subject, set) => {
  return { type: LOAD_SET, status: 'pending', subject, set, };
};

const receiveSet = (subject, set, tests) => {
  return { type: LOAD_SET, status: 'success', subject, set, tests, };
};

const failSet = (subject, set, response) => {
  return { type: LOAD_SET, status: 'error', subject, set, response, };
};

export const invalidateSet = (subject, set) => {
  return { type: LOAD_SET, status: 'invalidate', subject, set, };
};

export const forgetSet = () => {
  return { type: LOAD_SET, status: 'forget', };
};


export const saveTest = (subject, set, test) => (dispatch, getState) => {
  let userid = getState().app.userid;

  if (userid && subject && set && test) {
    dispatch(requestSaveTest(subject, set, test.title));
    return fetch(`${config.server}tests?userid=${userid}&subject=${subject}&save=${set}`, {
      method: "POST",
      mode: "cors",
      cache: "no-cache",
      credentials: "include",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
      },
      body: JSON.stringify(test.added ? {changed: test} : {old: test, changed: test})
    })
      .then(handleErrors)
      .then(res => res.json())
      .then(response => dispatch(receiveSaveTest(subject, set, test.title)))
      .catch(error => {
        dispatch(failSaveTest(subject, set, test.title, error));
        dispatch(showMessage(error.message));
        if (error.message === "invalid session")
          dispatch(logout({userid: userid}));
      });
  }
  else {
    return Promise.resolve();
  }
};

const requestSaveTest = (subject, set, test) => {
  return { type: SAVE_TEST, status: 'pending', subject, set, test,};
};

const receiveSaveTest = (subject, set, test) => {
  return { type: SAVE_TEST, status: 'success', subject, set, test, };
};

const failSaveTest = (subject, set, test, response) => {
  return { type: SAVE_TEST, status: 'error', subject, set, test, response: response.message, };
};

export const deleteTest = (subject, set, test) => (dispatch, getState) => {
  let userid = getState().app.userid;

  if (userid && subject && set && test) {
    dispatch(requestDeleteTest(subject, set, test.title));
    return fetch(`${config.server}tests?userid=${userid}&subject=${subject}&save=${set}`, {
      method: "POST",
      mode: "cors",
      cache: "no-cache",
      credentials: "include",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
      },
      body: JSON.stringify({delete: test})
    })
      .then(handleErrors)
      .then(res => res.json())
      .then(response => dispatch(receiveDeleteTest(subject, set, test.title)))
      .catch(error => {
        dispatch(failDeleteTest(subject, set, test.title, error));
        dispatch(showMessage(error.message));
        if (error.message === "invalid session")
          dispatch(logout({userid: userid}));
      });
  }
  else {
    return Promise.resolve();
  }
};

const requestDeleteTest = (subject, set, test) => {
  return { type: DELETE_TEST, status: 'pending', subject, set, test, };
};

const receiveDeleteTest = (subject, set, test) => {
  return { type: DELETE_TEST, status: 'success', subject, set, test, };
};

const failDeleteTest = (subject, set, test, response) => {
  return { type: DELETE_TEST, status: 'error', subject, set, response: response.message, };
};
