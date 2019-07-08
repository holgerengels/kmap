import {handleErrors} from "./fetchy";
import {config} from "../config";

export const REQUEST_SUBJECTS = 'REQUEST_SUBJECTS';
export const RECEIVE_SUBJECTS = 'RECEIVE_SUBJECTS';
export const FAIL_SUBJECTS = 'FAIL_SUBJECTS';
export const REQUEST_CHAPTERS = 'REQUEST_CHAPTERS';
export const RECEIVE_CHAPTERS = 'RECEIVE_CHAPTERS';
export const FAIL_CHAPTERS = 'FAIL_CHAPTERS';
export const REQUEST_TREE = 'REQUEST_TREE';
export const RECEIVE_TREE = 'RECEIVE_TREE';
export const FAIL_TREE = 'FAIL_TREE';
export const REQUEST_TESTS = 'REQUEST_TESTS';
export const RECEIVE_TESTS = 'RECEIVE_TESTS';
export const FAIL_TESTS = 'FAIL_TESTS';

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
    if (subject && !state.tests.subject !== subject && !state.tests.fetchingChapters) {
        dispatch(requestChapters(subject));
        return fetch(`${config.server}tests?chapters=all&subject=${subject}`, {
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
          .then(chapters => dispatch(receiveChapters(subject, chapters)))
          .catch(() => dispatch(failChapters(subject)));
    } else {
        return Promise.resolve();
    }
};

const requestChapters = (subject) => {
    return {
        type: REQUEST_CHAPTERS,
        subject
    };
};

const receiveChapters = (subject, chapters) => {
    return {
        type: RECEIVE_CHAPTERS,
        subject,
        chapters
    };
};

const failChapters = (subject) => {
    return {
        type: FAIL_CHAPTERS,
        subject
    };
};

/******************************************************************************/

export const fetchTreeIfNeeded = (subject) => (dispatch, getState) => {
    let state = getState();
    if (subject && !state.tests.subject !== subject && !state.tests.fetchingTree) {
        dispatch(requestTree(subject));
        return fetch(`${config.server}data?tree=all&subject=${subject}`, {
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

export const fetchTestsIfNeeded = (subject, chapter) => (dispatch, getState) => {
    let state = getState();
    if (subject && chapter && !state.tests.chapter !== chapter && !state.tests.fetchingTests) {
        dispatch(requestTests(subject, chapter));
        return fetch(`${config.server}tests?load=${chapter}&subject=${subject}`, {
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
          .then(data => dispatch(receiveTests(subject, chapter, data.data)))
          .catch(() => dispatch(failTests(subject, chapter)));
    } else {
        return Promise.resolve();
    }
};

const requestTests = (subject, chapter) => {
    return {
        type: REQUEST_TESTS,
        subject,
        chapter
    };
};

const receiveTests = (subject, chapter, tests) => {
    return {
        type: RECEIVE_TESTS,
        subject,
        chapter,
        tests
    };
};

const failTests = (subject, chapter) => {
    return {
        type: FAIL_TESTS,
        subject,
        chapter
    };
};
