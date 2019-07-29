import {
    LOAD_MAP,
    SELECT_SUMMARY_CARD
} from '../actions/maps.js';

const INITIAL_STATE = {
  loadFailure: false,
  loadFetching: false,
  loadResponse: null,
  map: {},
  invalidated: true,
};

const map = (state = INITIAL_STATE, action) => {
    switch (action.type) {
      case LOAD_MAP:
        switch (action.status) {
          case 'pending':
            return {
              ...state,
              loadFetching: true,
              loadFailure: false,
              loadResponse: null,
            };
          case 'success':
            return {
              ...state,
              loadFetching: false,
              loadFailure: false,
              loadResponse: null,
              invalidated: false,
              map: action.map
            };
          case 'error':
            return {
              ...state,
              loadFetching: false,
              loadFailure: true,
              loadResponse: action.response,
            };
          case 'invalidate':
            return {
              ...state,
              loadFetching: false,
              loadFailure: false,
              loadResponse: null,
              invalidated: true,
            };
        }
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
