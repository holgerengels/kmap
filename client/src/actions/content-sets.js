import {handleErrors} from "./fetchy";
import {config} from "../config";
import {logout, showMessage} from "./app";
import {store} from "../store";

export const SETS = 'SETS';
export const SELECT_SET = 'SELECT_SET';
export const IMPORT_SET = 'IMPORT_SET';
export const EXPORT_SET = 'EXPORT_SET';
export const DELETE_SET = 'DELETE_SET';

export const loadSets = () => (dispatch, getState) => {
  let state = getState();
  let userid = state.app.userid;
  if (userid && !state.contentSets.setsFetching) {
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
      .then(res => res.json())
      .then(result => dispatch(receiveSets(result)))
      .catch(error => {
        dispatch(failSets(error));
        dispatch(showMessage(error.message));
        if (error.message === "invalid session")
          dispatch(logout({userid: userid}));
      });
  } else {
    return Promise.resolve();
  }
};

const requestSets = () => {
  return { type: SETS, status: 'pending', };
};

const receiveSets = (data) => {
  return { type: SETS, status: 'success', data, };
};

const failSets = (response) => {
  return { type: SETS, status: 'error', response: response.message, };
};

export const invalidateSets = () => {
  return { type: SETS, status: 'invalidate', };
};

export const forgetSets = () => {
  return { type: SETS, status: 'forget', };
};

export const selectSet = (set) => {
  return {
    type: SELECT_SET,
    set,
  };
};

export const importSet = (files) => (dispatch, getState) => {
  let state = getState();
  let userid = state.app.userid;

  if (userid && files) {
    let names = [];
    var formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      let file = files[i];
      names.push(file.name);
      formData.append('files', file);
    }
    dispatch(requestImportSet(names));
    return fetch(`${config.server}content?import-set=${names.join(",")}`, {
      method: "POST",
      mode: "cors",
      cache: "no-cache",
      credentials: "include",
      body: formData,
    })
      .then(handleErrors)
      .then(res => res.json())
      .then(response => dispatch(receiveImportSet(names)))
      .then(lala => window.setTimeout(function() { store.dispatch(loadSets()); }.bind(undefined), 1000))
      .catch(error => {
        dispatch(failImportSet(names, error));
        dispatch(showMessage(error.message));
        if (error.message === "invalid session")
          dispatch(logout({userid: userid}));
      });
  } else {
    return Promise.resolve();
  }
};

const requestImportSet = (files) => {
  return { type: IMPORT_SET, files, status: 'pending', };
};

const receiveImportSet = (files) => {
  return { type: IMPORT_SET, files, status: 'success', };
};

const failImportSet = (files) => {
  return { type: IMPORT_SET, files, status: 'error', response: response.message, };
};

export const exportSet = (subject, set) => (dispatch, getState) => {
  let state = getState();
  let userid = state.app.userid;

  if (userid && subject && set) {
    dispatch(requestExportSet(subject, set));
    return fetch(`${config.server}content?subject=${subject}&export-set=${set}`, {
      method: "GET",
      mode: "cors",
      cache: "no-cache",
      credentials: "include",
    })
      .then(handleErrors)
      .then(response => response.blob())
      .then(blob => {
        let url = window.URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = subject + " - " + set + "-tests.zip";
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        dispatch(receiveExportMap())
      })
      .catch(error => {
        dispatch(failExportSet(subject, set, error));
        dispatch(showMessage(error.message));
        if (error.message === "invalid session")
          dispatch(logout({userid: userid}));
      });
  } else {
    return Promise.resolve();
  }
};

const requestExportSet = (subject, set) => {
  return { type: EXPORT_SET, status: 'pending', subject, set };
};

const receiveExportSet = (subject, set) => {
  return { type: EXPORT_SET, status: 'success', subject, set};
};

const failExportSet = (subject, set, response) => {
  return { type: EXPORT_SET, status: 'error', subject, set, response: response.message, };
};

export const deleteSet = (subject, set) => (dispatch, getState) => {
  let state = getState();
  let userid = state.app.userid;

  if (userid && subject && set) {
    dispatch(requestDeleteSet(subject, set));
    return fetch(`${config.server}tests?subject=${subject}&delete=${set}`, {
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
      .then(response => dispatch(receiveDeleteSet(subject, set)))
      .then(lala => window.setTimeout(function() { store.dispatch(loadSets()); }.bind(undefined), 1000))
      .catch(error => {
        dispatch(failDeleteSet(subject, set, error));
        dispatch(showMessage(error.message));
        if (error.message === "invalid session")
          dispatch(logout({userid: userid}));
      });
  }
  else {
    return Promise.resolve();
  }
};

const requestDeleteSet = (subject, set) => {
  return { type: DELETE_SET, status: 'pending', subject, set, };
};

const receiveDeleteSet = (subject, set) => {
  return { type: DELETE_SET, status: 'success', subject, set, };
};

const failDeleteSet = (subject, set, response) => {
  return { type: DELETE_SET, status: 'error', response: response.message, subject, set, };
};
