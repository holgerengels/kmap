import {handleErrors} from "./fetchy";
import {config} from "../config";
import {UPDATE_TITLE} from "./app";

export const REQUEST_SUBJECTS = 'REQUEST_SUBJECTS';
export const RECEIVE_SUBJECTS = 'RECEIVE_SUBJECTS';
export const FAIL_SUBJECTS = 'FAIL_SUBJECTS';
export const REQUEST_CHAPTERS = 'REQUEST_CHAPTERS';
export const RECEIVE_CHAPTERS = 'RECEIVE_CHAPTERS';
export const FAIL_CHAPTERS = 'FAIL_CHAPTERS';
export const REQUEST_TOPICS = 'REQUEST_TOPICS';
export const RECEIVE_TOPICS = 'RECEIVE_TOPICS';
export const FAIL_TOPICS = 'FAIL_TOPICS';
export const REQUEST_TREE = 'REQUEST_TREE';
export const RECEIVE_TREE = 'RECEIVE_TREE';
export const FAIL_TREE = 'FAIL_TREE';
export const REQUEST_CHAPTER = 'REQUEST_CHAPTER';
export const RECEIVE_CHAPTER = 'RECEIVE_CHAPTER';
export const FAIL_CHAPTER = 'FAIL_CHAPTER';
export const REQUEST_TOPIC = 'REQUEST_TOPIC';
export const RECEIVE_TOPIC = 'RECEIVE_TOPIC';
export const FAIL_TOPIC = 'FAIL_TOPIC';
export const RESULTS_CLEAR = 'RESULTS_CLEAR';
export const RESULTS_ADD = 'RESULTS_ADD';

export const fetchSubjectsIfNeeded = () => (dispatch, getState) => {
    let state = getState();
    if (!state.tests.subjects && !state.tests.fetchingSubjects) {
        dispatch(requestSubjects());
        return fetch(`${config.server}data?subjects=all`, {
            method: "GET",
            mode: "cors",
            cache: "no-cache",
            credentials: "include",
            headers: {
              "Content-Type": "application/json; charset=utf-8",
              "X-Instance": state.app.instance,
            }
        })
          .then(handleErrors)
          .then(res => res.json())
          .then(subjects => dispatch(receiveSubjects(subjects)))
          .catch(() => dispatch(failSubjects()));
    } else {
        return Promise.resolve();
    }
};

const requestSubjects = () => {
    return {
        type: REQUEST_SUBJECTS,
    };
};

const receiveSubjects = (subjects) => {
    return {
        type: RECEIVE_SUBJECTS,
        subjects
    };
};

const failSubjects = () => {
    return {
        type: FAIL_SUBJECTS,
    };
};

/******************************************************************************/

export const fetchChaptersIfNeeded = (subject) => (dispatch, getState) => {
    let state = getState();
    if (subject && !state.tests.fetchingChapters) {
        dispatch(requestChapters(subject));
        return fetch(`${config.server}tests?chapters=all&subject=${subject}`, {
            method: "GET",
            mode: "cors",
            cache: "no-cache",
            credentials: "include",
            headers: {
              "Content-Type": "application/json; charset=utf-8",
              "X-Instance": state.app.instance,
            }
        })
          .then(handleErrors)
          .then(res => res.json())
          .then(chapters => dispatch(receiveChapters(subject, chapters)))
          .catch(() => dispatch(failChapters(subject)));
    } else {
        return Promise.resolve();
    }
};

const requestChapters = (subject) => {
    return { type: REQUEST_CHAPTERS, subject };
};

const receiveChapters = (subject, chapters) => {
    return { type: RECEIVE_CHAPTERS, subject, chapters };
};

const failChapters = (subject) => {
    return { type: FAIL_CHAPTERS, subject };
};

/******************************************************************************/

export const fetchTopicsIfNeeded = (subject) => (dispatch, getState) => {
    let state = getState();
    if (subject && !state.tests.fetchingTopics) {
        dispatch(requestTopics(subject));
        return fetch(`${config.server}tests?topics=all&subject=${subject}`, {
            method: "GET",
            mode: "cors",
            cache: "no-cache",
            credentials: "include",
            headers: {
              "Content-Type": "application/json; charset=utf-8",
              "X-Instance": state.app.instance,
            }
        })
          .then(handleErrors)
          .then(res => res.json())
          .then(topics => dispatch(receiveTopics(subject, topics)))
          .catch(() => dispatch(failTopics(subject)));
    } else {
        return Promise.resolve();
    }
};

const requestTopics = (subject) => {
    return { type: REQUEST_TOPICS, subject };
};

const receiveTopics = (subject, topics) => {
    return { type: RECEIVE_TOPICS, subject, topics };
};

const failTopics = (subject) => {
    return { type: FAIL_TOPICS, subject };
};

/******************************************************************************/

export const fetchTreeIfNeeded = (subject) => (dispatch, getState) => {
    let state = getState();
    if (subject && !state.tests.fetchingTree) {
        dispatch(requestTree(subject));
        return fetch(`${config.server}data?tree=all&subject=${subject}`, {
            method: "GET",
            mode: "cors",
            cache: "no-cache",
            credentials: "include",
            headers: {
              "Content-Type": "application/json; charset=utf-8",
              "X-Instance": state.app.instance,
            }
        })
          .then(handleErrors)
          .then(res => res.json())
          .then(tree => dispatch(receiveTree(subject, tree)))
          .catch(() => dispatch(failTree(subject)));
    } else {
        return Promise.resolve();
    }
};

const requestTree = (subject) => {
    return {
        type: REQUEST_TREE,
        subject
    };
};

const receiveTree = (subject, tree) => {
    return {
        type: RECEIVE_TREE,
        subject,
        tree
    };
};

const failTree = (subject) => {
    return {
        type: FAIL_TREE,
        subject
    };
};

/******************************************************************************/

export const fetchChapterIfNeeded = (subject, chapter) => (dispatch, getState) => {
    let state = getState();
    if (subject && chapter && !state.tests.fetchingChapter) {
        dispatch(requestChapter(subject, chapter));
        return fetch(`${config.server}tests?chapter=${chapter}&subject=${subject}`, {
            method: "GET",
            mode: "cors",
            cache: "no-cache",
            credentials: "include",
            headers: {
              "Content-Type": "application/json; charset=utf-8",
              "X-Instance": state.app.instance,
            }
        })
          .then(handleErrors)
          .then(res => res.json())
          .then(data => dispatch(receiveChapter(subject, chapter, data.data)))
          .catch(() => dispatch(failChapter(subject, chapter)));
    } else {
        return Promise.resolve();
    }
};

const requestChapter = (subject, chapter) => {
    return { type: REQUEST_CHAPTER, subject, chapter };
};

const receiveChapter = (subject, chapter, tests) => {
    return { type: RECEIVE_CHAPTER, subject, chapter, tests };
};

const failChapter = (subject, chapter) => {
    return { type: FAIL_CHAPTER, subject, chapter };
};

/******************************************************************************/

export const fetchTopicIfNeeded = (subject, chapter, topic) => (dispatch, getState) => {
    let state = getState();
    if (subject && chapter && topic && !state.tests.fetchingTopic) {
        dispatch(requestTopic(subject, chapter, topic));
        return fetch(`${config.server}tests?chapter=${chapter}&topic=${topic}&subject=${subject}`, {
            method: "GET",
            mode: "cors",
            cache: "no-cache",
            credentials: "include",
            headers: {
              "Content-Type": "application/json; charset=utf-8",
              "X-Instance": state.app.instance,
            }
        })
          .then(handleErrors)
          .then(res => res.json())
          .then(data => dispatch(receiveTopic(subject, chapter, topic, data.data)))
          .catch(() => dispatch(failTopic(subject, chapter, topic)));
    } else {
        return Promise.resolve();
    }
};

const requestTopic = (subject, chapter, topic) => {
    return { type: REQUEST_TOPIC, subject, chapter, topic };
};

const receiveTopic = (subject, chapter, topic, tests) => {
    return { type: RECEIVE_TOPIC, subject, chapter, topic, tests };
};

const failTopic = (subject, chapter, topic) => {
    return { type: FAIL_TOPIC, subject, topic };
};

/******************************************************************************/

export const clearResults = () => {
  return {
    type: RESULTS_CLEAR
  };
};

export const addResult = (result) => {
  return {
    type: RESULTS_ADD,
    result
  };
};
