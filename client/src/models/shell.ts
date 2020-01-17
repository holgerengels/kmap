import { createModel } from '@captaincodeman/rdx-model';
import { Dispatch } from '../store';

export interface ShellState {
  title: string,
  narrow: boolean,
  drawerOpen: boolean,
  messages: string[],
  layers: string[],
}

export default createModel({
  state: <ShellState>{
    title: "KMap",
    narrow: false,
    drawerOpen: false,
    messages: [],
    layers: ["summaries"],
  },
  reducers: {
    setTitle(state, title: string) {
      return { ...state, title: title }
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
/*
    'routing/change': async function(payload: RoutingState) {
      switch (payload.page) {
        case 'browser':
          // @ts-ignore
          dispatch.maps.load(payload.page["subject"], payload.page["chapter"]);
          break;
      }
    }
 */
  })
})
