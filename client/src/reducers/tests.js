/**
 * @license
 * Copyright (c) 2018 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
 */

import {
    RECEIVE_SUBJECTS,
    FAIL_SUBJECTS,
    REQUEST_SUBJECTS,
    RECEIVE_CHAPTERS,
    FAIL_CHAPTERS,
    REQUEST_CHAPTERS,
    RECEIVE_TREE,
    FAIL_TREE,
    REQUEST_TREE,
    RECEIVE_TESTS,
    FAIL_TESTS,
    REQUEST_TESTS,
} from '../actions/tests.js';

const tests = (state = {}, action) => {
    switch (action.type) {
        case REQUEST_SUBJECTS:
            return {
                ...state,
                failureSubjects: false,
                fetchingSubjects: true
            };
        case RECEIVE_SUBJECTS:
            return {
                ...state,
                failureSubjects: false,
                fetchingSubjects: false,
                subjects: action.subjects
            };
        case FAIL_SUBJECTS:
            return {
                ...state,
                failureSubjects: true,
                fetchingSubjects: false
            };
        case REQUEST_CHAPTERS:
            return {
                ...state,
                failureChapters: false,
                fetchingChapters: true,
                subject: action.subject,
            };
        case RECEIVE_CHAPTERS:
            return {
                ...state,
                failureChapters: false,
                fetchingChapters: false,
                subject: action.subject,
                chapters: action.chapters
            };
        case FAIL_CHAPTERS:
            return {
                ...state,
                failureChapters: true,
                fetchingChapters: false
            };
        case REQUEST_TREE:
            return {
                ...state,
                failureTree: false,
                fetchingTree: true,
                subject: action.subject,
            };
        case RECEIVE_TREE:
            return {
                ...state,
                failureTree: false,
                fetchingTree: false,
                subject: action.subject,
                tree: action.tree
            };
        case FAIL_TREE:
            return {
                ...state,
                failureTree: true,
                fetchingTree: false
            };
        case REQUEST_TESTS:
            return {
                ...state,
                failureTests: false,
                fetchingTests: true,
                subject: action.subject,
                chapter: action.chapter,
            };
        case RECEIVE_TESTS:
            return {
                ...state,
                failureTests: false,
                fetchingTests: false,
                subject: action.subject,
                chapter: action.chapter,
                tests: action.tests
            };
        case FAIL_TESTS:
            return {
                ...state,
                failureTests: true,
                fetchingTests: false
            };
        default:
            return state;
    }
};

export default tests;
