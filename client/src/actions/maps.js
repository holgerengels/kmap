import {handleErrors} from "./fetchy";
import {config} from "../config";
import {logout, showMessage} from "./app";

export const LOAD_MAP = 'LOAD_MAP';
export const SELECT_SUMMARY_CARD = 'SELECT_SUMMARY_CARD';

export const fetchMapIfNeeded = (subject, chapter) => (dispatch, getState) => {
  let state = getState();
  if ((subject !== state.maps.map.subject || chapter !== state.maps.map.chapter || state.maps.invalidated) && !state.maps.loadFetching) {
    dispatch(requestMap(subject, chapter));
    return fetch(`${config.server}data?subject=${subject}&load=${chapter}`, {
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
      .then(map => dispatch(receiveMap(subject, chapter, map)))
      .catch(error => {
        dispatch(failMap(subject, chapter, error));
        dispatch(showMessage(error.message));
        if (error.message === "invalid session")
          dispatch(logout({userid: userid}));
      });
  } else {
    return Promise.resolve();
  }
};

const requestMap = (subject, chapter) => {
  return { type: LOAD_MAP, status: 'pending', subject, chapter, };
};

const receiveMap = (subject, chapter, map) => {
  return { type: LOAD_MAP, status: 'success', subject, chapter, map, };
};

const failMap = (subject, chapter, response) => {
  return { type: LOAD_MAP, status: 'error', subject, chapter, response, };
};

export const invalidateMap = (subject, chapter) => {
  return { type: LOAD_MAP, status: 'invalidate', subject, chapter, };
};

export const selectSummaryCard = (card) => {
  return { type: SELECT_SUMMARY_CARD, card };
};

