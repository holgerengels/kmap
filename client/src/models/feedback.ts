import {createModel, RoutingState} from '@captaincodeman/rdx';
import { Store } from '../store';
import {endpoint, fetchjson} from "../endpoint";
import {urls} from "../urls";

export interface PurgeRequest {until: string, types: string[]}

export interface ErrorReport {
  message: string,
  detail: string,
}
export interface Feedback {
  subject?: string,
  chapter?: string,
  topic?: string,
  test?: string,
  type: 'bug' | 'error' | 'proposal',
  title: string,
  text: string,
  state?: 'open' | 'closed',
  userid?: string,
}

export interface FeedbackState {
  issues?: Feedback[],
  timestamp: number,
  submitting: boolean,
  resolving: boolean,
  purging: boolean,
  error: string,
}

export default createModel({
  state: <FeedbackState>{
    timestamp: -1,
    submitting: false,
    resolving: false,
    purging: false,
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
    requestSubmitError(state) {
      return { ...state, submiting: true, error: "" };
    },
    receivedSubmitError(state) {
      return { ...state, submiting: false };
    },
    requestResolve(state) {
      return { ...state, resolving: true, error: "" };
    },
    receivedResolve(state, feedback: Feedback) {
      return { ...state, resolving: false,
        issues: state.issues ? state.issues.filter(i => i !== feedback) : undefined
      };
    },
    requestPurge(state) {
      return { ...state, purging: true, error: "" };
    },
    receivedPurge(state, payload: Feedback[]) {
      return { ...state, purging: false,
        issues: payload,
      };
    },

    error(state, message) {
      return { ...state,
        loading: false,
        error: message,
      }
    },
  },

  effects(store: Store) {
    const dispatch = store.getDispatch();
    return {
      async load() {
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
        const state = store.getState();
        const userid = state.app.userid;
        if (!userid)
          return;

        feedback.state = 'open';
        feedback.userid = userid;
        dispatch.feedback.requestSubmit();
        fetchjson(`${urls.server}feedback?submit=${feedback.type}`, {
            ...endpoint.post(state),
            body: JSON.stringify(feedback)
          },
          () => {
            dispatch.feedback.receivedSubmit();
          },
          dispatch.app.handleError,
          dispatch.feedback.error);
      },
      async bug(error: ErrorReport) {
        const state = store.getState();
        const userid = state.app.userid;

        dispatch.feedback.requestSubmitError();

        if (error.detail.startsWith(error.message))
          error.detail = error.detail.substr((error.message).length + 1);

        const feedback: Feedback = {type: 'bug', title: error.message, text: error.detail, userid: userid};
        fetchjson(`${urls.server}feedback?bug=${error.message}`, {
            ...endpoint.post(state),
            body: JSON.stringify(feedback)
          },
          () => {
            dispatch.feedback.receivedSubmitError();
          },
          dispatch.app.handleError,
          dispatch.feedback.error);
      },
      async resolve(feedback: Feedback) {
        const state = store.getState();

        dispatch.feedback.requestResolve();
        fetchjson(`${urls.server}feedback?resolve=${feedback.type}`, {
            ...endpoint.post(state),
            body: JSON.stringify(feedback)
          },
          () => {
            dispatch.feedback.receivedResolve(feedback);
          },
          dispatch.app.handleError,
          dispatch.feedback.error);
      },
      async purge(purge: PurgeRequest) {
        const state = store.getState();

        dispatch.feedback.requestPurge();
        fetchjson(`${urls.server}feedback?purge=${purge.until}`, {
            ...endpoint.post(state),
            body: JSON.stringify(purge)
          },
          (json) => {
            dispatch.feedback.receivedLoad(json);
          },
          dispatch.app.handleError,
          dispatch.feedback.error);
      },

      'routing/change': async function (routing: RoutingState<string>) {
        const state = store.getState();
        if (state.app.roles.includes("teacher") && (routing.page === 'content-manager'))
          dispatch.feedback.load();
      },
      'app/receivedLogin': async function () {
        const state = store.getState();
        const routing: RoutingState<string> = state.routing;
        if (state.app.roles.includes("teacher") && (routing.page === 'content-manager'))
          dispatch.feedback.load();
      },

      'app/receivedLogout': async function () {
        dispatch.feedback.forget();
      },
      'app/chooseInstance': async function () {
        dispatch.feedback.forget();
      },
    }
  }
})
