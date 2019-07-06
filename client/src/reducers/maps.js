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
    RECEIVE_MAP,
    FAIL_MAP,
    REQUEST_MAP,
    SELECT_SUMMARY_CARD
} from '../actions/maps.js';

const map = (state = {}, action) => {
    switch (action.type) {
        case REQUEST_MAP:
            return {
                ...state,
                failure: false,
                isFetching: true
            };
        case RECEIVE_MAP:
            return {
                ...state,
                failure: false,
                isFetching: false,
                map: action.map
            };
        case FAIL_MAP:
            return {
                ...state,
                failure: true,
                isFetching: false
            };
        case SELECT_SUMMARY_CARD:
            return {
                ...state,
                selectedCardName: action.card.name,
                selectedCardDependencies: action.card.depends,
            };
        default:
            return state;
    }
};

export default map;
