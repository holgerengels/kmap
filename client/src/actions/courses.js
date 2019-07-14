import {handleErrors} from "./fetchy";
import {config} from "../config";
import {logout, showMessage} from "./app";

export const LOAD_COURSES = 'LOAD_COURSES';
export const STORE_COURSES = 'STORE_COURSES';
export const FORGET_COURSES = 'FORGET_COURSES';
export const LOAD_COURSE = 'LOAD_COURSE';
export const STORE_COURSE = 'STORE_COURSE';

export const loadCourses = () => (dispatch, getState) => {
  let userid = getState().app.userid;
  dispatch(requestLoadCourses(userid));

  return fetch(`${config.server}state?courses=${userid}`, {
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
    .then(response => dispatch(receiveLoadCourses(userid, response.data)))
    .catch(error => {
        dispatch(failLoadCourses(userid, error));
        dispatch(showMessage({ message: error.message }));
      }
    );
};

const requestLoadCourses = (userid) => {
  return {
    type: LOAD_COURSES,
    userid,
    status: 'pending',
  };
};

const receiveLoadCourses = (userid, courses) => {
  return {
    type: LOAD_COURSES,
    userid,
    status: 'success',
    courses,
  };
};

const failLoadCourses = (userid, response) => {
  return {
    type: LOAD_COURSES,
    userid,
    status: 'error',
    response: response.message,
  };
};

export const forgetCourses = (userid) => {
  return {
    type: FORGET_COURSES,
    userid,
  };
};

export const storeCourses = (courses) => (dispatch, getState) => {
  let userid = getState().app.userid;

  if (userid && courses) {
    dispatch(requestStoreCourses(userid, courses));
    return fetch(`${config.server}state?userid=${userid}&storeCourses=${userid}`, {
      method: "POST",
      mode: "cors",
      cache: "no-cache",
      credentials: "include",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
      },
      body: JSON.stringify({courses: courses})
    })
      .then(handleErrors)
      .then(res => res.json())
      .then(response => dispatch(receiveStoreCourses(userid, courses)))
      .catch(error => {
          dispatch(failStoreCourses(userid, courses, error));
          dispatch(showMessage({ message: error.message }));
        }
      );
  } else {
    return Promise.resolve();
  }
};

const requestStoreCourses = (userid, courses) => {
  return {
    type: STORE_COURSES,
    userid,
    status: 'pending',
    courses,
  };
};

const receiveStoreCourses = (userid, courses) => {
  return {
    type: STORE_COURSES,
    userid,
    status: 'success',
    courses,
  };
};

const failStoreCourses = (userid, response) => {
  return {
    type: STORE_COURSES,
    userid,
    status: 'error',
    response: response.message,
  };
};

export const storeCourse = (course) => (dispatch, getState) => {
  let userid = getState().app.userid;

  if (userid && course) {
    dispatch(requestStoreCourse(userid, course));
    return fetch(`${config.server}state?userid=${userid}&storeCourse=${course.name}`, {
      method: "POST",
      mode: "cors",
      cache: "no-cache",
      credentials: "include",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
      },
      body: JSON.stringify({students: course.students})
    })
      .then(handleErrors)
      .then(res => res.json())
      .then(response => dispatch(receiveStoreCourse(userid, course)))
      .catch(error => {
          dispatch(failStoreCourse(userid, course.name, error));
          dispatch(showMessage({ message: error.message }));
        }
      );
  } else {
    return Promise.resolve();
  }
};

const requestStoreCourse = (userid, course) => {
  return {
    type: STORE_COURSE,
    userid,
    status: 'pending',
    course,
  };
};

const receiveStoreCourse = (userid, course) => {
  return {
    type: STORE_COURSE,
    userid,
    status: 'success',
    course,
  };
};

const failStoreCourse = (userid, response) => {
  return {
    type: STORE_COURSE,
    userid,
    status: 'error',
    response: response.message,
  };
};
