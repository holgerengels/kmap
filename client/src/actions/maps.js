import {handleErrors} from "./fetchy";
import {config} from "../config";

export const REQUEST_MAP = 'REQUEST_MAP';
export const RECEIVE_MAP = 'RECEIVE_MAP';
export const FAIL_MAP = 'FAIL_MAP';
export const SELECT_SUMMARY_CARD = 'SELECT_SUMMARY_CARD';

export const fetchMapIfNeeded = (map) => (dispatch, getState) => {
    if (map && map.subject && map.chapter && !map.lines && !map.isFetching) {
        dispatch(requestMap(map.subject, map.chapter));
        return fetch(`${config.server}data?subject=${map.subject}&load=${map.chapter}`, {
            method: "GET",
            mode: "cors",
            cache: "no-cache",
            //credentials: "include",
            headers: {
                "Content-Type": "application/json; charset=utf-8",
            }
        })
          .then(handleErrors)
          .then(res => res.json())
          .then(map => dispatch(receiveMap(map.subject, map.chapter, map)))
          .catch(() => dispatch(failMap(map.subject, map.chapter)));
    } else {
        return Promise.resolve();
    }
};

const requestMap = (subject, chapter) => {
    return {
        type: REQUEST_MAP,
        subject, chapter
    };
};

const receiveMap = (subject, chapter, map) => {
    return {
        type: RECEIVE_MAP,
        subject, chapter,
        map
    };
};

const failMap = (subject, chapter) => {
    return {
        type: FAIL_MAP,
        subject, chapter
    };
};

export const selectSummaryCard = (card) => {
    return {
        type: SELECT_SUMMARY_CARD,
        card
    };
};

