import {createModel, RoutingState} from '@captaincodeman/rdx-model';
import {Dispatch, State} from '../store';

export interface Meta {
  title?: string,
  description?: string,
}
export interface ShellState {
  title: string,
  description: string,
  narrow: boolean,
  drawerOpen: boolean,
  messages: string[],
  layers: string[],
}

export default createModel({
  state: <ShellState>{
    title: "KMap",
    description: "KMap kartographiert Wissen mit Zusammenhang",
    narrow: false,
    drawerOpen: false,
    messages: [],
    layers: ["summaries"],
  },
  reducers: {
    updateMeta(state, meta: Meta) {
      return { ...state, title: meta.title || "KMap", description: meta.description || "KMap kartographiert Wissen mit Zusammenhang"}
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
    addLayer(state, layer: string) {
      return { ...state, layers: [...state.layers, layer] }
    },
    removeLayer(state, layer: string) {
      return { ...state, layers: state.layers.filter(m => m !== layer) }
    },
  },

  // @ts-ignore
  effects: (dispatch: Dispatch, getState) => ({
    showMessage(payload: string) {
      window.setTimeout(() => dispatch.shell.removeMessage(payload), 3000);
      dispatch.shell.addMessage(payload);
    },

    'routing/change': async function(routing: RoutingState) {
      if (routing.page !== 'browser')
        dispatch.shell.updateMeta({});
    },
  })
})
