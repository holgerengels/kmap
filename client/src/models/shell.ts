import { createModel } from '@captaincodeman/rdx-model';
import { Dispatch } from '../store';
import {Card} from "./maps";
import {Test} from "./tests";

export interface ShellState {
  title: string,
  narrow: boolean,
  drawerOpen: boolean,
  messages: string[],
  layers: string[],
  cardForEdit?: Card,
  cardForRename?: Card,
  cardForDelete?: Card,
  testForEdit?: Test,
  testForDelete?: Test,
}

export default createModel({
  state: <ShellState>{
    title: "KMap",
    narrow: false,
    drawerOpen: false,
    messages: [],
    layers: ["summaries"],
    cardForEdit: undefined,
    cardForRename: undefined,
    cardForDelete: undefined,
    testForEdit: undefined,
    testForDelete: undefined,
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
    setCardForEdit(state, cardForEdit: Card) {
      return { ...state, cardForEdit: cardForEdit }
    },
    unsetCardForEdit(state) {
      return { ...state, cardForEdit: undefined }
    },
    setCardForRename(state, cardForRename: Card) {
      return { ...state, cardForRename: cardForRename }
    },
    unsetCardForRename(state) {
      return { ...state, cardForRename: undefined }
    },
    setCardForDelete(state, cardForDelete: Card) {
      return { ...state, cardForDelete: cardForDelete }
    },
    unsetCardForDelete(state) {
      return { ...state, cardForDelete: undefined }
    },
    setTestForEdit(state, testForEdit: Test) {
      return { ...state, testForEdit: testForEdit }
    },
    unsetTestForEdit(state) {
      return { ...state, testForEdit: undefined }
    },
    setTestForDelete(state, testForDelete: Test) {
      return { ...state, testForDelete: testForDelete }
    },
    unsetTestForDelete(state) {
      return { ...state, testForDelete: undefined }
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
