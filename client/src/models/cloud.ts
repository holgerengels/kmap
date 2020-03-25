import {createModel} from '@captaincodeman/rdx-model';
import { Store } from '../store';
import {endpoint, fetchjson} from "../endpoint";
import {urls} from "../urls";
import {Attachment, Path} from "./types";

export interface CloudState {
  attachments?: Attachment[],
  loading: boolean,
  path?: string,
  creating: boolean,
  error: string,
}

export default createModel({
  state: <CloudState>{
    loading: false,
    creating: false,
    error: "",
  },
  reducers: {
    requestAttachments(state) {
      return { ...state,
        loading: true,
        error: "",
      };
    },
    receivedAttachments(state, payload: Attachment[]) {
      return { ...state,
        attachments: payload,
        loading: false,
      };
    },
    requestCreateDirectory(state) {
      return { ...state,
        creating: true,
        error: "",
      };
    },
    receivedCreateDirectory(state, payload: string) {
      return { ...state,
        path: payload,
        creating: false,
      };
    },
    forgetPath(state) {
      return { ...state,
        path: undefined,
      };
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
    async fetchAttachments(path: Path) {
      const dispatch = store.dispatch();
      const state = store.getState();

      dispatch.cloud.requestAttachments();
      fetchjson(`${urls.server}edit?attachments=${path.subject}/${path.chapter}/${path.topic}`, endpoint.get(state),
        (json) => {
          // @ts-ignore
          dispatch.cloud.receivedAttachments(json);
        },
        dispatch.app.handleError,
        dispatch.cloud.error);
    },
    async createDirectory(path: Path) {
      const dispatch = store.dispatch();
      const state = store.getState();

      dispatch.cloud.requestCreateDirectory();
      fetchjson(`${urls.server}edit?directory=${path.subject}/${path.chapter}/${path.topic}`, endpoint.get(state),
        (json) => {
          // @ts-ignore
          dispatch.cloud.receivedCreateDirectory(json);
        },
        dispatch.app.handleError,
        dispatch.cloud.error);
    },
    async createDirectoryForTests(path: Path) {
      const dispatch = store.dispatch();
      const state = store.getState();

      dispatch.cloud.requestCreateDirectory();
      fetchjson(`${urls.server}edit?directory=${path.subject}/${path.chapter}/${path.topic}/tests`, endpoint.get(state),
        (json) => {
          // @ts-ignore
          dispatch.cloud.receivedCreateDirectory(json);
        },
        dispatch.app.handleError,
        dispatch.cloud.error);
    },

    'app/chooseInstance': async function() {
      const dispatch = store.dispatch();
      dispatch.cloud.forgetPath();
    },
  })
})
