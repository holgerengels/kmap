import {handleErrors} from "./fetchy";
import {logout, showMessage} from "./app";

export const MODULES = 'MODULES';
export const IMPORT_MAP = 'IMPORT_MAP';
export const EXPORT_MAP = 'EXPORT_MAP';
export const DELETE_MAP = 'DELETE_MAP';

export const modules = () => (dispatch, getState) => {
  dispatch(requestModules());
  return fetch(`http://127.0.0.1:8081/kmap/kmap/edit?modules=all`, {
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
    .then(response => dispatch(receiveModules(response)))
    .catch(error => {
        dispatch(failModules(error));
        dispatch(showMessage({ message: error.message }));
      }
    );
};

const requestModules = () => {
  return {
    type: MODULES,
    status: 'pending',
  };
};

const receiveModules = (data) => {
  return {
    type: MODULES,
    status: 'success',
    data,
  };
};

const failModules = (response) => {
  return {
    type: MODULES,
    status: 'error',
    response: response.message,
  };
};

export const importMap = (subject, module, data) => (dispatch, getState) => {
  if (subject && module && data) {
    dispatch(requestImportMap(subject, module, data));
    return fetch(`http://127.0.0.1:8081/kmap/kmap/edit?subject=${subject}&import=${module}`, {
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
        dispatch(receiveImportMap(subject, module, data));
        dispatch(modules());
      })
      .catch(error => {
          dispatch(failImportMap(subject, module, error));
          dispatch(showMessage({ message: error.message }));
        }
      );
  } else {
    return Promise.resolve();
  }
};

const requestImportMap = (subject, module, data) => {
  return {
    type: IMPORT_MAP,
    subject, module,
    status: 'pending',
    data,
  };
};

const receiveImportMap = (subject, module, data) => {
  return {
    type: IMPORT_MAP,
    subject, module,
    status: 'success',
    data,
  };
};

const failImportMap = (subject, module, response) => {
  return {
    type: IMPORT_MAP,
    subject, module,
    status: 'error',
    response: response.message,
  };
};

export const exportMap = (subject, module) => (dispatch, getState) => {
  dispatch(requestExportMap());
  return fetch(`http://127.0.0.1:8081/kmap/kmap/edit?subject=${subject}&load=${module}`, {
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
    .then(response => dispatch(receiveExportMap(response)))
    .catch(error => {
        dispatch(failExportMap(error));
        dispatch(showMessage({ message: error.message }));
      }
    );
};

const requestExportMap = () => {
  return {
    type: EXPORT_MAP,
    status: 'pending',
  };
};

const receiveExportMap = (data) => {
  return {
    type: EXPORT_MAP,
    status: 'success',
    data: data.data,
  };
};

const failExportMap = (response) => {
  return {
    type: EXPORT_MAP,
    status: 'error',
    response: response.message,
  };
};

export const deleteMap = (subject, module) => (dispatch, getState) => {
  if (subject && module) {
    dispatch(requestDeleteMap(subject, module));
    return fetch(`http://127.0.0.1:8081/kmap/kmap/edit?subject=${subject}&delete=${module}`, {
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
        dispatch(receiveDeleteMap(subject, module));
        dispatch(modules());
      })
      .catch(error => {
          dispatch(failDeleteMap(subject, module, error));
          dispatch(showMessage(error.message));
        }
      );
  } else {
    return Promise.resolve();
  }
};

const requestDeleteMap = (subject, module) => {
  return {
    type: DELETE_MAP,
    subject, module,
    status: 'pending',
  };
};

const receiveDeleteMap = (subject, module) => {
  return {
    type: DELETE_MAP,
    subject, module,
    status: 'success',
  };
};

const failDeleteMap = (subject, module, response) => {
  return {
    type: DELETE_MAP,
    subject, module,
    status: 'error',
    response: response.message,
  };
};
