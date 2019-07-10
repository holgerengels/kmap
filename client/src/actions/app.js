/**
 @license
 Copyright (c) 2018 The Polymer Project Authors. All rights reserved.
 This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
 The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
 The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
 Code distributed by Google as part of the polymer project is also
 subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
 */
import {handleErrors} from "./fetchy";
import {config} from "../config";

export const UPDATE_PAGE = 'UPDATE_PAGE';
export const UPDATE_OFFLINE = 'UPDATE_OFFLINE';
export const UPDATE_DATA_PATH = 'UPDATE_DATA_PATH';
export const UPDATE_LOCATION = 'UPDATE_LOCATION';
export const UPDATE_TITLE = 'UPDATE_TITLE';
export const OPEN_DRAWER = 'OPEN_DRAWER';
export const CLOSE_DRAWER = 'CLOSE_DRAWER';
export const SHOW_MESSAGE = 'SHOW_MESSAGE';
export const TIMEOUT_MESSAGE = 'TIMEOUT_MESSAGE';
export const LOGIN = 'LOGIN';
export const LOGOUT = 'LOGOUT';

export const navigate = (path) => (dispatch, getState) => {
  console.log(path);
  path = path === '' ? 'home' : path.slice(1);
  if (path.endsWith('/'))
    path = path.substring(0, path.length - 1);
  const page = path.split("/")[0];
  const dataPath = path.split("/").slice(1);
  //console.log(page);
  //console.log(dataPath);

  let state = getState();
  //console.log(state.app.page);
  //console.log(state.app.dataPath);

  if (page === state.app.page && dataPath.length === state.app.dataPath.length && dataPath.every((el, ix) => el === state.app.dataPath[ix]))
    return;

  if (page === 'browser' && dataPath.length === 0 && state.app.dataPath.length !== 0) {
    dispatch(updateLocation(['#' + page, ...state.app.dataPath].join('/')));
    dispatch(closeDrawer());
  }
  else if (page === 'browser' && dataPath.length === 0 && state.app.dataPath.length === 0) {
    dispatch(updateLocation('#home'));
    dispatch(closeDrawer());
  }
  else {
    dispatch(closeDrawer());
    dispatch(updateDataPath(dataPath));
    dispatch(loadPage(page));
  }
};

const loadPage = (page) => (dispatch) => {
  switch (page) {
    case 'home':
      import('../components/kmap-subjects.js').then((module) => {
      });
      break;
    case 'browser':
      import('../components/kmap-browser.js').then((module) => {
      });
      break;
    case 'test':
      import('../components/kmap-test.js');
      break;
    case 'content-manager':
      import('../components/kmap-content-manager.js');
      break;
    /*
  case 'settings':
    import('../sol-settings/sol-settings.js');
    break;
  case 'map-editor':
    import('../sol-editor/sol-editor.js');
    break;
  case 'test-editor':
    import('../sol-tests/sol-tests.js');
    break;
  case 'courses':
    import('../sol-courses/sol-courses.js');
    break;
  default:
    page = 'view404';
    import('../components/kmap-view404.js');
    */
  }

  dispatch(updatePage(page));
};

const updatePage = (page) => {
  return {
    type: UPDATE_PAGE,
    page
  };
};

const updateDataPath = (dataPath) => {
  return {
    type: UPDATE_DATA_PATH,
    dataPath
  };
};

export const updateLocation = (location) => (dispatch) => {
  console.log("update location " + location);
  window.location = location;
  dispatch({
    type: UPDATE_LOCATION,
    location
  });
};

export const updateTitle = (title) => {
  return {
    type: UPDATE_TITLE,
    title
  };
};

export const showMessage = (message) => (dispatch) => {
  console.log("add " + message);
  window.setTimeout(() => dispatch(timeoutMessage(message)), 3000);
  dispatch({
    type: SHOW_MESSAGE,
    message
  });
};

const timeoutMessage = (message) => {
  console.log("remove " + message);
  return {
    type: TIMEOUT_MESSAGE,
    message
  };
};

const openDrawer = () => {
  return {
    type: OPEN_DRAWER
  };
};

const closeDrawer = () => {
  return {
    type: CLOSE_DRAWER
  };
};

export const updateOffline = (offline) => (dispatch, getState) => {
  if (offline !== getState().app.offline) {
    dispatch(showMessage(offline ? "offline" : "online"));
  }
  dispatch({
    type: UPDATE_OFFLINE,
    offline
  });
};

export const login = (credentials) => (dispatch, getState) => {
  if (credentials && credentials.userid && !credentials.roles && !getState.loginFetching) {
    dispatch(requestLogin(credentials.userid));
    return fetch(`${config.server}state?login=${credentials.userid}`, {
      method: "POST",
      mode: "cors",
      cache: "no-cache",
      credentials: "include",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
      },
      body: JSON.stringify({login: credentials.userid, password: credentials.password}),
    })
      .then(handleErrors)
      .then(res => res.json())
      .then(data => handleResponse(data))
      .then(data => dispatch(receiveLogin(credentials.userid, data.data)))
      .catch(error => dispatch(failLogin(credentials.userid, error)));
  } else {
    return Promise.resolve();
  }
};

function handleResponse(data) {
  if (data.response === "error") {
    throw Error(data.message);
  }
  return data;
}

const requestLogin = (userid) => {
  return {
    type: LOGIN,
    userid,
    status: 'pending',
  };
};

const receiveLogin = (userid, roles) => {
  return {
    type: LOGIN,
    userid,
    status: 'success',
    roles,
  };
};

const failLogin = (userid, response) => {
  return {
    type: LOGIN,
    userid,
    status: 'error',
    response: translate(response.message),
  };
};

export const logout = (credentials) => (dispatch, getState) => {
  if (credentials && credentials.userid && !getState.logoutFetching) {
    dispatch(requestLogout(credentials.userid));
    return fetch(`${config.server}state?logout=${credentials.userid}`, {
      method: "POST",
      mode: "cors",
      cache: "no-cache",
      credentials: "include",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
      },
      body: JSON.stringify({logout: credentials.userid}),
    })
      .then(handleErrors)
      .then(res => res.json())
      .then(roles => dispatch(receiveLogout(credentials.userid)))
      .catch(error => dispatch(failLogout(credentials.userid, error)));
  } else {
    return Promise.resolve();
  }
};

const requestLogout = (userid) => {
  return {
    type: LOGOUT,
    userid,
    status: 'pending'
  };
};

const receiveLogout = (userid, roles) => {
  return {
    type: LOGOUT,
    userid,
    status: 'success',
    roles
  };
};

const failLogout = (userid, response) => {
  return {
    type: LOGOUT,
    userid,
    status: 'error',
    respone: response.message
  };
};

const translations = new Map([
  ["invalid credentials" , "Benutzername oder Passwort falsch"],
  ["Failed to fetch" , "Netzwerkfehler"],
  ["Internal Server Error" , "Serverfehler"],
]);

function translate(message) {
  return translations.has(message) ? translations.get(message) : message;
}
