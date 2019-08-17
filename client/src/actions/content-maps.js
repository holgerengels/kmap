import {handleErrors} from "./fetchy";
import {config} from "../config";
import {logout, showMessage} from "./app";
import {store} from "../store";

export const MODULES = 'MODULES';
export const SELECT_MODULE = 'SELECT_MODULE';
export const IMPORT_MAP = 'IMPORT_MAP';
export const EXPORT_MAP = 'EXPORT_MAP';
export const DELETE_MAP = 'DELETE_MAP';

export const loadModules = () => (dispatch, getState) => {
  let state = getState();
  let userid = state.app.userid;
  if (userid && !state.contentMaps.modulesFetching) {
    dispatch(requestModules());
    return fetch(`${config.server}edit?modules=all`, {
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
      .then(result => dispatch(receiveModules(result)))
      .catch(error => {
        dispatch(failModules(error));
        dispatch(showMessage(error.message));
        if (error.message === "invalid session")
          dispatch(logout({userid: userid}));
      });
  } else {
    return Promise.resolve();
  }
};

const requestModules = () => {
  return { type: MODULES, status: 'pending', };
};

const receiveModules = (data) => {
  return { type: MODULES, status: 'success', data, };
};

const failModules = (response) => {
  return { type: MODULES, status: 'error', response: response.message, };
};

export const invalidateModules = () => {
  return { type: MODULES, status: 'invalidate', };
};

export const forgetModules = () => {
  return { type: MODULES, status: 'forget', };
};

export const selectModule = (module) => {
  return {
    type: SELECT_MODULE,
    module,
  };
};

export const importMap = (files) => (dispatch, getState) => {
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
    dispatch(requestImportMap(names));
    return fetch(`${config.server}content?import-module=${names.join(",")}`, {
      method: "POST",
      mode: "cors",
      cache: "no-cache",
      credentials: "include",
      body: formData,
    })
      .then(handleErrors)
      .then(res => res.json())
      .then(response => dispatch(receiveImportMap(names)))
      .then(lala => window.setTimeout(function() { store.dispatch(loadModules()); }.bind(undefined), 1000))
      .catch(error => {
        dispatch(failImportMap(names, error));
        dispatch(showMessage(error.message));
        if (error.message === "invalid session")
          dispatch(logout({userid: userid}));
      });
  } else {
    return Promise.resolve();
  }
};

const requestImportMap = (files) => {
  return { type: IMPORT_MAP, files, status: 'pending', };
};

const receiveImportMap = (files) => {
  return { type: IMPORT_MAP, files, status: 'success', };
};

const failImportMap = (files, response) => {
  return { type: IMPORT_MAP, files, status: 'error', response: response.message, };
};

export const exportMap = (subject, module) => (dispatch, getState) => {
  let state = getState();
  let userid = state.app.userid;

  if (userid && subject && module) {
    dispatch(requestExportMap(subject, module));
    return fetch(`${config.server}content?subject=${subject}&export-module=${module}`, {
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
        a.download = subject + " - " + module + ".zip";
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        dispatch(receiveExportMap(subject, module))
      })
      .catch(error => {
        dispatch(failExportMap(subject, module, error));
        dispatch(showMessage(error.message));
        if (error.message === "invalid session")
          dispatch(logout({userid: userid}));
      });
  } else {
    return Promise.resolve();
  }
};

const requestExportMap = (subject, module) => {
  return { type: EXPORT_MAP, status: 'pending', subject, module };
};

const receiveExportMap = (subject, module) => {
  return { type: EXPORT_MAP, status: 'success', subject, module};
};

const failExportMap = (subject, module, response) => {
  return { type: EXPORT_MAP, status: 'error', subject, module, response: response.message, };
};

export const deleteMap = (subject, module) => (dispatch, getState) => {
  let state = getState();
  let userid = state.app.userid;

  if (userid && subject && module) {
    dispatch(requestDeleteMap(subject, module));
    return fetch(`${config.server}edit?subject=${subject}&delete=${module}`, {
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
      .then(response => dispatch(receiveDeleteMap(subject, module)))
      .then(lala => window.setTimeout(function() { store.dispatch(loadModules()); }.bind(undefined), 1000))
      .catch(error => {
        dispatch(failDeleteMap(subject, module, error));
        dispatch(showMessage(error.message));
        if (error.message === "invalid session")
          dispatch(logout({userid: userid}));
      });
  }
  else {
    return Promise.resolve();
  }
};

const requestDeleteMap = (subject, module) => {
  return { type: DELETE_MAP, status: 'pending', subject, module, };
};

const receiveDeleteMap = (subject, module) => {
  return { type: DELETE_MAP, status: 'success', subject, module, };
};

const failDeleteMap = (subject, module, response) => {
  return { type: DELETE_MAP, status: 'error', response: response.message, subject, module, };
};
