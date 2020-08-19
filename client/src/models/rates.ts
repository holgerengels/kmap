import {createModel} from '@captaincodeman/rdx-model';
import { Store } from '../store';
import {endpoint, fetchjson} from "../endpoint";
import {urls} from "../urls";

export interface Rate {
  subject: string,
  id: string
  rate: number,
}

export interface RateState {
  subject: string,
  rates: {},
  timestamp: number,
  loading: boolean,
  storing: boolean,
  error: string,
}

export default createModel({
  state: <RateState>{
    subject: "",
    rates: {},
    timestamp: -1,
    loading: false,
    storing: false,
    error: "",
  },
  reducers: {
    requestLoad(state) {
      return { ...state, loading: true,
        rates: {},
        timestamp: Date.now(),
        error: "",
      };
    },
    receivedLoad(state, payload: RateState) {
      return { ...state,
        subject: payload.subject,
        rates: payload.rates,
        loading: false,
      };
    },
    forget(state) {
      return { ...state,
        rates: {},
        timestamp: Date.now(),
        error: "",
      };
    },

    requestStore(state) {
      return { ...state, deleting: true,
        rates: {},
        timestamp: Date.now(),
        error: "",
      };
    },

    receivedStore(state, payload: RateState) {
      return { ...state,
        subject: payload.subject,
        rates: payload.rates,
        deleting: false,
      };
    },
    error(state, message) {
      return { ...state,
        loading: false,
        deleting: false,
        error: message,
      }
    },
  },

  // @ts-ignore
  effects: (store: Store) => ({
    async load() {
      const dispatch = store.dispatch();
      const state = store.getState();
      const userid = state.app.userid;
      const subject = state.maps.subject;
      if (!userid || !subject)
        return;

      // @ts-ignore
      if (state.rates.subject !== subject || !state.rates.rates) {
        dispatch.rates.requestLoad();
        fetchjson(`${urls.server}state?load=${userid}&subject=${subject}`, endpoint.get(state),
          (json) => {
            // @ts-ignore
            dispatch.rates.receivedLoad({subject: subject, rates: json});
          },
          dispatch.app.handleError,
          dispatch.rates.error);
      }
    },
    async store(payload: Rate) {
      const dispatch = store.dispatch();
      const state = store.getState();
      dispatch.rates.requestStore();
      let body = {... payload, save: state.app.userid};
      fetchjson(`${urls.server}state?save=${state.app.userid}&subject=${payload.subject}`, {... endpoint.post(state), body: JSON.stringify(body)},
        (json) => {
          // @ts-ignore
          dispatch.rates.receivedStore({subject: payload.subject, rates: json});
        },
        dispatch.app.handleError,
        dispatch.rates.error);
    },

    'maps/received': async function() {
      const dispatch = store.dispatch();
        dispatch.rates.load();
    },
    'app/receivedLogin': async function() {
      const dispatch = store.dispatch();
        dispatch.rates.load();
    },
    'app/receivedLogout': async function() {
      const dispatch = store.dispatch();
      dispatch.rates.forget();
    },
    'app/chooseInstance': async function() {
      const dispatch = store.dispatch();
      dispatch.rates.forget();
    },
  })
})
