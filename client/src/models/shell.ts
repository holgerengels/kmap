import { createModel } from '@captaincodeman/rdx-model';
import { Dispatch } from '../store';

export interface ShellState {
  title: string,
  narrow: boolean,
  drawerOpen: boolean,
  messages: string[],
  layers: string[],
  cardForEdit: string,
  cardForRename: string,
  cardForDelete: string,
  testForEdit: string,
  testForDelete: string,
}

export default createModel({
  state: <ShellState>{
    title: "KMap",
    narrow: false,
    drawerOpen: false,
    messages: [],
    layers: [],
    cardForEdit: "",
    cardForRename: "",
    cardForDelete: "",
    testForEdit: "",
    testForDelete: "",
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
    setCardForEdit(state, cardForEdit: string) {
      return { ...state, cardForEdit: cardForEdit }
    },
    unsetCardForEdit(state) {
      return { ...state, cardForEdit: "" }
    },
    setCardForRename(state, cardForRename: string) {
      return { ...state, cardForRename: cardForRename }
    },
    unsetCardForRename(state) {
      return { ...state, cardForRename: "" }
    },
    setCardForDelete(state, cardForDelete: string) {
      return { ...state, cardForDelete: cardForDelete }
    },
    unsetCardForDelete(state) {
      return { ...state, cardForDelete: "" }
    },
    setTestForEdit(state, testForEdit: string) {
      return { ...state, testForEdit: testForEdit }
    },
    unsetTestForEdit(state) {
      return { ...state, testForEdit: "" }
    },
    setTestForDelete(state, testForDelete: string) {
      return { ...state, testForDelete: testForDelete }
    },
    unsetTestForDelete(state) {
      return { ...state, testForDelete: "" }
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
