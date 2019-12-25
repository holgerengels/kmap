import {createModel, RoutingState} from '@captaincodeman/rdx-model';
import { State, Dispatch } from '../store';
import {endpoint} from "../endpoint";
import {config} from "../config";
import {Path} from "./types";

export interface Attachment {
  name: string,
  tag: string,
  type: string,
  href: string,
}

export interface Card {
  module: string,
  topic: string,
  row: number,
  col: number,
  summary: string,
  description: string,
  links: string,
  depends: string[],
  attachments: Attachment[];
  annotation: string,
}

export interface MapState {
  subject: string,
  chapter: string,
  lines: Card[][],
  timestamp: number,
  loading: boolean,
  error: string,
  selected: string,
  selectedDependencies: string[],
}

export default createModel({
  state: <MapState>{
    subject: "",
    chapter: "",
    lines: [],
    timestamp: -1,
    loading: false,
    error: "",
    selected: "",
    selectedDependencies: [],
  },
  reducers: {
    selectCard(state, card: Card) {
      return { ...state, selected: card.topic, selectedDependencies: card.depends }
    },

    unselectCard(state) {
      return { ...state, selected: "" }
    },

    request(state) {
      return { ...state, loading: true,
        timestamp: Date.now(),
        error: "",
      };
    },

    received(state, payload: MapState) {
      return { ...state,
        subject: payload.subject,
        chapter: payload.chapter,
        lines: payload.lines,
        loading: false,
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
    async load(payload: Path) {
      const state: State = getState();
      // @ts-ignore
      if (state.maps.subject !== payload.subject || state.maps.chapter != payload.chapter) {
        dispatch.maps.request();
        const resp = await fetch(`${config.server}data?subject=${payload.subject}&load=${payload.chapter}`, endpoint.get(state));
        if (resp.ok) {
          const json = await resp.json();
          // @ts-ignore
          dispatch.maps.received(json);
        }
        else {
          const message = await resp.text();
          // @ts-ignore
          dispatch.maps.error(message);
        }
      }
    },
    'routing/change': async function(payload: RoutingState) {
      switch (payload.page) {
        case 'browser':
          // @ts-ignore
          dispatch.maps.load({ subject: payload.params["subject"], chapter: payload.params["chapter"]});
          break;
      }
    }
  })
})
