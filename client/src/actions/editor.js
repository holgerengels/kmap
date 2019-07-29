import {handleErrors} from "./fetchy";
import {config} from "../config";
import {logout, showMessage} from "./app";

export const SAVE_TOPIC = 'SAVE_TOPIC';
export const RENAME_TOPIC = 'RENAME_TOPIC';
export const DELETE_TOPIC = 'DELETE_TOPIC';

export const saveTopic = (subject, module, card) => (dispatch, getState) => {
  let userid = getState().app.userid;

  if (userid && subject && module && card) {
    dispatch(requestSaveTopic(subject, module, card));
    return fetch(`${config.server}edit?userid=${userid}&subject=${subject}&save=${module}`, {
      method: "POST",
      mode: "cors",
      cache: "no-cache",
      credentials: "include",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
      },
      body: JSON.stringify({old: card, changed: card})
    })
      .then(handleErrors)
      .then(res => res.json())
      .then(response => dispatch(receiveSaveTopic(subject, module, card)))
      .catch(error => {
        dispatch(failSaveTopic(subject, module, card, error));
        dispatch(showMessage(error.message));
        if (error.message === "invalid session")
          dispatch(logout({userid: userid}));
      });
  }
  else {
    return Promise.resolve();
  }
};

const requestSaveTopic = (subject, module, card) => {
  return { type: SAVE_TOPIC, status: 'pending', subject, module, topic: card.name, card, };
};

const receiveSaveTopic = (subject, module, card) => {
  return { type: SAVE_TOPIC, status: 'success', subject, module, topic: card.name, card, };
};

const failSaveTopic = (subject, module, card, response) => {
  return { type: SAVE_TOPIC, status: 'error', subject, module, topic: card.name, response: response.message, };
};

export const renameTopic = (subject, module, card, name) => (dispatch, getState) => {
  let userid = getState().app.userid;

  if (userid && subject && module && card && name) {
    dispatch(requestRenameTopic(subject, module, card));
    return fetch(`${config.server}edit?userid=${userid}&subject=${subject}&save=${module}`, {
      method: "POST",
      mode: "cors",
      cache: "no-cache",
      credentials: "include",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
      },
      body: JSON.stringify({rename: card, name})
    })
      .then(handleErrors)
      .then(res => res.json())
      .then(response => dispatch(receiveRenameTopic(subject, module, card, name)))
      .catch(error => {
        dispatch(failRenameTopic(subject, module, card, name, error));
        dispatch(showMessage(error.message));
        if (error.message === "invalid session")
          dispatch(logout({userid: userid}));
      });
  }
  else {
    return Promise.resolve();
  }
};

const requestRenameTopic = (subject, module, card, name) => {
  return { type: RENAME_TOPIC, status: 'pending', subject, module, topic: card.name, name, };
};

const receiveRenameTopic = (subject, module, card, name) => {
  return { type: RENAME_TOPIC, status: 'success', subject, module, topic: card.name, name, };
};

const failRenameTopic = (subject, module, card, name, response) => {
  return { type: RENAME_TOPIC, status: 'error', subject, module, topic: card.name, name, response: response.message, };
};

export const deleteTopic = (subject, module, card) => (dispatch, getState) => {
  let userid = getState().app.userid;

  if (userid && subject && module && card) {
    dispatch(requestDeleteTopic(subject, module, card));
    return fetch(`${config.server}edit?userid=${userid}&subject=${subject}&save=${module}`, {
      method: "POST",
      mode: "cors",
      cache: "no-cache",
      credentials: "include",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
      },
      body: JSON.stringify({delete: card})
    })
      .then(handleErrors)
      .then(res => res.json())
      .then(response => dispatch(receiveDeleteTopic(subject, module, card)))
      .catch(error => {
        dispatch(failDeleteTopic(subject, module, card, error));
        dispatch(showMessage(error.message));
        if (error.message === "invalid session")
          dispatch(logout({userid: userid}));
      });
  }
  else {
    return Promise.resolve();
  }
};

const requestDeleteTopic = (subject, module, card) => {
  return { type: DELETE_TOPIC, status: 'pending', subject, module, topic: card.name, card, };
};

const receiveDeleteTopic = (subject, module, card) => {
  return { type: DELETE_TOPIC, status: 'success', subject, module, topic: card.name, card, };
};

const failDeleteTopic = (subject, module, card, response) => {
  return { type: DELETE_TOPIC, status: 'error', subject, module, topic: card.name, response: response.message, };
};
