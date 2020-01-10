import {createModel} from '@captaincodeman/rdx-model';
import { State, Dispatch } from '../store';
import {endpoint} from "../endpoint";
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
      const resp = await fetch(`${config.server}edit?attachments=${path.subject}/${path.chapter}/${path.topic}`, endpoint.get(state));
      if (resp.ok) {
        const json = await resp.json();
        // @ts-ignore
        dispatch.cloud.receivedAttachments(json);
      }
      else {
        const message = await resp.text();
        // @ts-ignore
        dispatch.app.handleError({ code: resp.status, message: message });
        // @ts-ignore
        dispatch.cloud.error(message);
      }
    },
    async createDirectory(path: Path) {
      const state: State = getState();

      dispatch.cloud.requestCreateDirectory();
      const resp = await fetch(`${config.server}edit?directory=${path.subject}/${path.chapter}/${path.topic}`, endpoint.get(state));
      if (resp.ok) {
        const json = await resp.json();
        // @ts-ignore
        dispatch.cloud.receivedCreateDirectory(json);
      }
      else {
        const message = await resp.text();
        // @ts-ignore
        dispatch.app.handleError({ code: resp.status, message: message });
        // @ts-ignore
        dispatch.cloud.error(message);
      }
    },
    async createDirectoryForTests(path: Path) {
      const state: State = getState();

      dispatch.cloud.requestCreateDirectory();
      const resp = await fetch(`${config.server}edit?directory=${path.subject}/${path.chapter}/${path.topic}/tests`, endpoint.get(state));
      if (resp.ok) {
        const json = await resp.json();
        // @ts-ignore
        dispatch.cloud.receivedCreateDirectory(json);
      }
      else {
        const message = await resp.text();
        // @ts-ignore
        dispatch.app.handleError({ code: resp.status, message: message });
        // @ts-ignore
        dispatch.cloud.error(message);
      }
    },
  })
})
