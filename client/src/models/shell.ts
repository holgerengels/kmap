import {createModel, RoutingState} from '@captaincodeman/rdx-model';
import { Store } from '../store';

export interface Meta {
  title?: string,
  detail?: string,
  description?: string,
  keywords?: string[],
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
    async addLayer(layer: string) {
      if (layer === 'editor') {
        await import('../components/kmap-module-selector');
        await import('../components/kmap-editor-add-fabs');
        await import('../components/kmap-editor-delete-dialog');
        await import('../components/kmap-editor-edit-dialog');
        await import('../components/kmap-editor-rename-dialog');

        await import('../components/kmap-set-selector');
        await import('../components/kmap-test-editor-add-fabs');
        await import('../components/kmap-test-editor-delete-dialog');
        await import('../components/kmap-test-editor-edit-dialog');
      }
      else if (layer === 'averages') {
        await import('../components/kmap-course-selector');
      }
    },

    'routing/change': async function(routing: RoutingState) {
      const dispatch = store.dispatch();
      if (routing.page !== 'browser')
        dispatch.shell.updateMeta({});
      if (routing.page === 'courses') {
        console.log("loading courses")
        import('../components/kmap-courses').then(() => console.log("loaded courses"));
      }
      else if (routing.page === 'content-manager') {
        console.log("loading content-manager")
        import('../components/kmap-content-manager').then(() => console.log("loaded content-manager"));
      }
    },

    'app/receivedLogout': async function() {
      const dispatch = store.dispatch();
      dispatch.shell.removeLayer("averages");
      dispatch.shell.removeLayer("editor");
    },
  })
})
