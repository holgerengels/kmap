/**
 @license
 Copyright (c) 2018 The Polymer Project Authors. All rights reserved.
 This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
 The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
 The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
 Code distributed by Google as part of the polymer project is also
 subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
 */

import {createStore, compose, applyMiddleware, combineReducers} from 'redux';
import thunk from 'redux-thunk';
import {lazyReducerEnhancer} from 'pwa-helpers/lazy-reducer-enhancer.js';
//import loggerMiddleware from './store-logger';

import app from './reducers/app';
import maps from './reducers/maps';
import states from './reducers/states';
import averageStates from './reducers/average-states';
import tests from './reducers/tests';
import instances from './reducers/instances';
import contentMaps from './reducers/content-maps';
import contentSets from './reducers/content-sets';
import courses from './reducers/courses';
import testEditor from './reducers/test-editor';

const devCompose = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

export const store = createStore(
    state => state,
    devCompose(
        lazyReducerEnhancer(combineReducers),
        applyMiddleware(thunk))
);

store.addReducers({
  app,
  maps,
  states,
  averageStates,
  tests,
  courses,
  instances,
  contentMaps,
  contentSets,
  testEditor,
});
