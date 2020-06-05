import {createModel, RoutingState} from '@captaincodeman/rdx-model';
import { Store } from '../store';

export interface Meta {
  title?: string,
  detail?: string,
  description?: string,
  image?: string,
  author?: string;
  created?: number
  modified?: number
}
export interface ShellState {
  meta: Meta,
  narrow: boolean,
  drawerOpen: boolean,
  messages: string[],
  layers: string[],
}

export default createModel({
  state: <ShellState>{
    meta: {},
    narrow: false,
    drawerOpen: false,
    messages: [],
    layers: ["summaries"],
  },
  reducers: {
    updateMeta(state, meta: Meta) {
      return { ...state, meta}
    },
    updateNarrow(state, narrow: boolean) {
      return { ...state, narrow: narrow }
    },
    updateDrawerOpen(state, drawerOpen: boolean) {
      return { ...state, drawerOpen: drawerOpen }
    },
    addMessage(state, message: string) {
      return { ...state, messages: [...state.messages, message] }
    },
    removeMessage(state, message: string) {
      return { ...state, messages: state.messages.filter(m => m !== message) }
    },
    clearMessages(state) {
      return { ...state, messages: [] }
    },
    addLayer(state, layer: string) {
      return { ...state, layers: [...state.layers, layer] }
    },
    removeLayer(state, layer: string) {
      return { ...state, layers: state.layers.filter(m => m !== layer) }
    },
  },

  // @ts-ignore
  effects: (store: Store) => ({
    showMessage(payload: string) {
      const dispatch = store.dispatch();
      window.setTimeout(() => dispatch.shell.removeMessage(payload), 3000);
      dispatch.shell.addMessage(payload);
    },

    'routing/change': async function(routing: RoutingState) {
      const dispatch = store.dispatch();
      if (routing.page !== 'browser')
        dispatch.shell.updateMeta({});
    },

    'app/receivedLogout': async function() {
      const dispatch = store.dispatch();
      dispatch.shell.removeLayer("averages");
      dispatch.shell.removeLayer("editor");
    },
  })
})
