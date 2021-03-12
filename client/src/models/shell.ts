import {createModel, RoutingState} from '@captaincodeman/rdx';
import {Store} from '../store';

export interface Meta {
  title?: string,
  detail?: string,
  description?: string,
  keywords?: string[],
  image?: string,
  author?: string,
  created?: number,
  modified?: number,
  breadcrumbs?: string[],
  about?: string[],
  type?: string[],
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
    layers: ["summaries", "ratings"],
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
      return { ...state, layers: state.layers.includes(layer) ? state.layers : [...state.layers, layer] }
    },
    removeLayer(state, layer: string) {
      return { ...state, layers: state.layers.filter(m => m !== layer) }
    },
  },

  effects(store: Store) {
    const dispatch = store.getDispatch();
    return {
      showMessage(payload: string) {
        window.setTimeout(() => dispatch.shell.removeMessage(payload), 3000);
        dispatch.shell.addMessage(payload);
      },
      'routing/change': async function (routing: RoutingState<string>) {
        if (routing.page !== 'browser' && routing.page !== 'test')
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

      'app/receivedLogin': async function () {
        const state = store.getState();
        if (state.app.roles.includes("teacher") || state.app.roles.includes("admin")) {
          console.log("loading components")
          await import('../components/kmap-module-selector');
          await import('../components/kmap-editor-add-fabs');
          await import('../components/kmap-editor-delete-dialog');
          await import('../components/kmap-editor-edit-dialog');
          await import('../components/kmap-editor-rename-dialog');

          await import('../components/kmap-set-selector');
          await import('../components/kmap-test-editor-add-fabs');
          await import('../components/kmap-test-editor-delete-dialog');
          await import('../components/kmap-test-editor-edit-dialog');

          await import('../components/kmap-course-selector');
        }
      },
      'app/receivedLogout': async function () {
        dispatch.shell.removeLayer("averages");
        dispatch.shell.removeLayer("editor");
        dispatch.shell.removeLayer("timeline");
      },
    }
  }
})
