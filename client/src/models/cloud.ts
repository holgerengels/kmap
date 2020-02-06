import {createModel} from '@captaincodeman/rdx-model';
import { State, Dispatch } from '../store';
import {endpoint, fetchjson} from "../endpoint";
import {config} from "../config";
import {Path} from "./types";
import {Attachment} from "./maps";

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
  effects: (dispatch: Dispatch, getState) => ({
    async fetchAttachments(path: Path) {
      const state: State = getState();

      dispatch.cloud.requestAttachments();
      fetchjson(`${config.server}edit?attachments=${path.subject}/${path.chapter}/${path.topic}`, endpoint.get(state),
        (json) => {
          // @ts-ignore
          dispatch.cloud.receivedAttachments(json);
        },
        dispatch.app.handleError,
        dispatch.cloud.error);
    },
    async createDirectory(path: Path) {
      const state: State = getState();

      dispatch.cloud.requestCreateDirectory();
      fetchjson(`${config.server}edit?directory=${path.subject}/${path.chapter}/${path.topic}`, endpoint.get(state),
        (json) => {
          // @ts-ignore
          dispatch.cloud.receivedCreateDirectory(json);
        },
        dispatch.app.handleError,
        dispatch.cloud.error);
    },
    async createDirectoryForTests(path: Path) {
      const state: State = getState();

      dispatch.cloud.requestCreateDirectory();
      fetchjson(`${config.server}edit?directory=${path.subject}/${path.chapter}/${path.topic}/tests`, endpoint.get(state),
        (json) => {
          // @ts-ignore
          dispatch.cloud.receivedCreateDirectory(json);
        },
        dispatch.app.handleError,
        dispatch.cloud.error);
    },

    'app/chooseInstance': async function() {
      dispatch.cloud.forgetPath();
    },
  })
})
