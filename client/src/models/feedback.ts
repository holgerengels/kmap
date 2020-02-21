import {createModel, RoutingState} from '@captaincodeman/rdx-model';
import { Store } from '../store';
import {endpoint, fetchjson} from "../endpoint";
import {urls} from "../urls";

export interface Feedback {
  subject: string,
  chapter: string,
  topic?: string,
  type: string,
  title: string,
  text: string,
  state?: 'open' | 'closed',
}

export interface FeedbackState {
  issues?: Feedback[],
  timestamp: number,
  submitting: boolean,
  error: string,
}

export default createModel({
  state: <FeedbackState>{
    timestamp: -1,
    submitting: false,
    error: "",
  },
  reducers: {
    requestLoad(state) {
      return { ...state, loading: true,
        timestamp: Date.now(),
        error: "",
      };
    },
    receivedLoad(state, payload: Feedback[]) {
      return { ...state,
        issues: payload,
        loading: false,
      };
    },
    forget(state) {
      return { ...state, issues: []}
    },

    requestSubmit(state) {
      return { ...state, submiting: true, error: "" };
    },
    receivedSubmit(state) {
      return { ...state, submiting: false };
    },

    error(state, message) {
      return { ...state,
        loading: false,
        error: message,
      }
    },
  },

  // @ts-ignore
  effects: (store: Store) => ({
    async load() {
      const dispatch = store.dispatch();
      const state = store.getState();
      // @ts-ignore
      if (Date.now() - state.feedback.timestamp > 3000) {
        dispatch.feedback.requestLoad();
        fetchjson(`${urls.server}feedback?load=all`, endpoint.get(state),
          (json) => {
            dispatch.feedback.receivedLoad(json);
          },
          dispatch.app.handleError,
          dispatch.feedback.error);
      }
    },
    async submit(feedback: Feedback) {
      const dispatch = store.dispatch();
      const state = store.getState();
      feedback.state = 'open';
      dispatch.feedback.requestSubmit();
      fetchjson(`${urls.server}feedback?submit=${feedback.type}`, {... endpoint.post(state), body: JSON.stringify(feedback)},
        () => {
          dispatch.feedback.receivedSubmit();
        },
        dispatch.app.handleError,
        dispatch.feedback.error);
    },

    'routing/change': async function(routing: RoutingState) {
      const dispatch = store.dispatch();
      const state = store.getState();
      if (state.app.roles.includes("teacher") && (routing.page === 'content-manager'))
        dispatch.feedback.load();
    },
    'app/receivedLogin': async function() {
      const dispatch = store.dispatch();
      const state = store.getState();
      const routing: RoutingState = state.routing;
      if (state.app.roles.includes("teacher") && (routing.page === 'content-manager'))
        dispatch.feedback.load();
    },

    'app/receivedLogout': async function() {
      const dispatch = store.dispatch();
      dispatch.feedback.forget();
    },
    'app/chooseInstance': async function() {
      const dispatch = store.dispatch();
      dispatch.feedback.forget();
    },
  })
})
