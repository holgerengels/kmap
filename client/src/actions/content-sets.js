import {handleErrors} from "./fetchy";
import {config} from "../config";
import {logout, showMessage} from "./app";

export const SETS = 'SETS';
export const IMPORT_SET = 'IMPORT_SET';
export const EXPORT_SET = 'EXPORT_SET';
export const DELETE_SET = 'DELETE_SET';

export const sets = () => (dispatch, getState) => {
  dispatch(requestSets());
  return fetch(`${config.server}tests?sets=all`, {
    method: "GET",
    mode: "cors",
    cache: "no-cache",
    credentials: "include",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
    },
  })
    .then(handleErrors)
    .then(response => response.json())
    .then(response => dispatch(receiveSets(response)))
    .catch(error => {
      dispatch(failSets(error));
      dispatch(showMessage(error.message));
      if (error.message === "invalid session")
        dispatch(logout({userid: state.userid}));
    });
};

const requestSets = () => {
  return {
    type: SETS,
    status: 'pending',
  };
};

const receiveSets = (data) => {
  return {
    type: SETS,
    status: 'success',
    data,
  };
};

const failSets = (response) => {
  return {
    type: SETS,
    status: 'error',
    response: response.message,
  };
};

export const importSet = (subject, module, data) => (dispatch, getState) => {
  if (subject && module && data) {
    dispatch(requestImportSet(subject, module, data));
    return fetch(`${config.server}tests?subject=${subject}&import=${module}`, {
      method: "POST",
      mode: "cors",
      cache: "no-cache",
      credentials: "include",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
      },
      body: JSON.stringify({docs: data})
    })
      .then(handleErrors)
      .then(res => res.json())
      .then(response => {
        dispatch(receiveImportSet(subject, module, data));
        dispatch(sets());
      })
      .catch(error => {
        dispatch(failImportSet(subject, module, error));
        dispatch(showMessage(error.message));
        if (error.message === "invalid session")
          dispatch(logout({userid: state.userid}));
      });
  }
  else {
    return Promise.resolve();
  }
};

const requestImportSet = (subject, module, data) => {
  return {
    type: IMPORT_SET,
    subject, module,
    status: 'pending',
    data,
  };
};

const receiveImportSet = (subject, module, data) => {
  return {
    type: IMPORT_SET,
    subject, module,
    status: 'success',
    data,
  };
};

const failImportSet = (subject, module, response) => {
  return {
    type: IMPORT_SET,
    subject, module,
    status: 'error',
    response: response.message,
  };
};

export const exportSet = (subject, module) => (dispatch, getState) => {
  dispatch(requestExportSet());
  return fetch(`${config.server}tests?subject=${subject}&load=${module}`, {
    method: "GET",
    mode: "cors",
    cache: "no-cache",
    credentials: "include",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
    },
  })
    .then(handleErrors)
    .then(response => response.json())
    .then(response => dispatch(receiveExportSet(response)))
    .catch(error => {
      dispatch(failExportSet(error));
      dispatch(showMessage(error.message));
      if (error.message === "invalid session")
        dispatch(logout({userid: state.userid}));
    });
};

const requestExportSet = () => {
  return {
    type: EXPORT_SET,
    status: 'pending',
  };
};

const receiveExportSet = (data) => {
  return {
    type: EXPORT_SET,
    status: 'success',
    data: data.data,
  };
};

const failExportSet = (response) => {
  return {
    type: EXPORT_SET,
    status: 'error',
    response: response.message,
  };
};

export const deleteSet = (subject, module) => (dispatch, getState) => {
  if (subject && module) {
    dispatch(requestDeleteSet(subject, module));
    return fetch(`${config.server}tests?subject=${subject}&delete=${module}`, {
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
      .then(response => {
        dispatch(receiveDeleteSet(subject, module));
        dispatch(sets());
      })
      .catch(error => {
        dispatch(failDeleteSet(subject, module, error));
        dispatch(showMessage(error.message));
        if (error.message === "invalid session")
          dispatch(logout({userid: state.userid}));
        });
  }
  else {
    return Promise.resolve();
  }
};

const requestDeleteSet = (subject, module) => {
  return {
    type: DELETE_SET,
    subject, module,
    status: 'pending',
  };
};

const receiveDeleteSet = (subject, module) => {
  return {
    type: DELETE_SET,
    subject, module,
    status: 'success',
  };
};

const failDeleteSet = (subject, module, response) => {
  return {
    type: DELETE_SET,
    subject, module,
    status: 'error',
    response: response.message,
  };
};
