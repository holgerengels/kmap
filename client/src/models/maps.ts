import {createModel, RoutingState} from '@captaincodeman/rdx-model';
import {Dispatch, State} from '../store';
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
  subject: string,
  module: string,
  chapter: string,
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

interface AllTopics {
  subject: string,
  topics: string[],
}

export interface MapState {
  subject: string,
  chapter: string,
  lines: Card[][],
  chapterCard?: Card,
  timestamp: number,
  loading: boolean,
  error: string,
  selected: string,
  selectedDependencies: string[],
  deleting: boolean,
  renaming: boolean,
  saving: boolean,
  allTopics?: AllTopics,
  loadingAllTopics: boolean,
  cardForEdit?: Card,
  cardForRename?: Card,
  cardForDelete?: Card,
}

export default createModel({
  state: <MapState>{
    subject: "",
    chapter: "",
    lines: [],
    chapterCard: undefined,
    timestamp: -1,
    loading: false,
    error: "",
    selected: "",
    selectedDependencies: [],
    deleting: false,
    renaming: false,
    saving: false,
    loadingAllTopics: false,
    cardForEdit: undefined,
    cardForRename: undefined,
    cardForDelete: undefined,
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
        chapterCard: payload.chapterCard,
        loading: false,
      };
    },
    subjectChanged(state) {
      return { ...state};
    },
    forget(state) {
      return { ...state,
        subject: '',
        chapter: '',
        lines: [],
        chapterCard: undefined,
        cardForEdit: undefined,
        cardForRename: undefined,
        cardForDelete: undefined,
      };
    },

    requestDeleteTopic(state) {
      return { ...state, deleting: true };
    },
    receivedDeleteTopic(state) {
      return { ...state, deleting: false, cardForDelete: undefined };
    },
    requestRenameTopic(state) {
      return { ...state, deleting: true };
    },
    receivedRenameTopic(state) {
      return { ...state, deleting: false, cardForRename: undefined };
    },
    requestSaveTopic(state) {
      return { ...state, deleting: true };
    },
    receivedSaveTopic(state) {
      return { ...state, deleting: false, cardForEdit: undefined };
    },

    requestAllTopics(state) {
      return { ...state, loadingAllTopics: true, error: "" };
    },
    receivedAllTopics(state, payload: AllTopics) {
      return { ...state,
        allTopics: payload,
        loadingAllTopics: false,
      };
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

    error(state, message) {
      return { ...state,
        loading: false,
        error: message,
      }
    },
  },

  // @ts-ignore
  effects: (dispatch: Dispatch, getState) => ({
    async load(path: Path) {
      const state: State = getState();
      const oldSubject: string = state.maps.subject;

      if (state.maps.subject === path.subject && state.maps.chapter === path.chapter) {
        console.warn("reloading map " + path.subject + " " + path.chapter);
      }

      dispatch.maps.request();
      const resp = await fetch(`${config.server}data?subject=${path.subject}&load=${path.chapter}`, endpoint.get(state));
      if (resp.ok) {
        const json = await resp.json();
        // @ts-ignore
        dispatch.maps.received(json);
        if (path.subject !== oldSubject) {
          dispatch.maps.subjectChanged();
        }
      }
      else {
        const message = await resp.text();
        // @ts-ignore
        dispatch.app.handleError({ code: resp.status, message: message });
        // @ts-ignore
        dispatch.maps.error(message);
      }
    },
    async deleteTopic(card: Card) {
      const state: State = getState();
      const userid = state.app.userid;

      dispatch.maps.requestDeleteTopic();
      const resp = await fetch(`${config.server}edit?userid=${userid}&subject=${card.subject}&save=${card.module}`,
        {... endpoint.post(state), body: JSON.stringify({delete: card})});

      if (resp.ok) {
        await resp.json();
        dispatch.maps.receivedDeleteTopic();
        dispatch.maps.unsetCardForDelete();
      }
      else {
        const message = await resp.text();
        // @ts-ignore
        dispatch.app.handleError({ code: resp.status, message: message });
        // @ts-ignore
        dispatch.maps.error(message);
      }
    },
    async renameTopic(card: Card) {
      const state: State = getState();
      const userid = state.app.userid;

      dispatch.maps.requestRenameTopic();
      const resp = await fetch(`${config.server}edit?userid=${userid}&subject=${card.subject}&save=${card.module}`,
        // @ts-ignore
        {... endpoint.post(state), body: JSON.stringify({rename: card, name: card.newName })});

      if (resp.ok) {
        await resp.json();
        dispatch.maps.receivedRenameTopic();
        dispatch.maps.unsetCardForRename();
      }
      else {
        const message = await resp.text();
        // @ts-ignore
        dispatch.app.handleError({ code: resp.status, message: message });
        // @ts-ignore
        dispatch.maps.error(message);
      }
    },
    async saveTopic(card: Card) {
      const state: State = getState();
      const userid = state.app.userid;

      dispatch.maps.requestSaveTopic();
      const resp = await fetch(`${config.server}edit?userid=${userid}&subject=${card.subject}&save=${card.module}`,
        // @ts-ignore
        {... endpoint.post(state), body: JSON.stringify(card.added ? {changed: card} : {old: card, changed: card})});

      if (resp.ok) {
        await resp.json();
        dispatch.maps.receivedSaveTopic();
        dispatch.maps.unsetCardForEdit();
      }
      else {
        const message = await resp.text();
        // @ts-ignore
        dispatch.app.handleError({ code: resp.status, message: message });
        // @ts-ignore
        dispatch.maps.error(message);
      }
    },

    async loadAllTopics(subject: string) {
      const state: State = getState();

      if (state.maps.allTopics && state.maps.allTopics.subject === subject) {
        console.warn("reloading all topics " + subject);
      }

      dispatch.maps.requestAllTopics();
      const resp = await fetch(`${config.server}data?subject=${subject}&topics=all`, endpoint.get(state));
      if (resp.ok) {
        const json = await resp.json();
        // @ts-ignore
        dispatch.maps.receivedAllTopics({subject: subject, topics: json});
      }
      else {
        const message = await resp.text();
        // @ts-ignore
        dispatch.app.handleError({ code: resp.status, message: message });
        // @ts-ignore
        dispatch.maps.error(message);
      }
    },

    'routing/change': async function(routing: RoutingState) {
      switch (routing.page) {
        case 'browser':
          // @ts-ignore
          dispatch.maps.load({ subject: routing.params["subject"], chapter: routing.params["chapter"]});
          document.title = "KMap - " + (routing.params["topic"] ? decodeURIComponent(routing.params["topic"]) : decodeURIComponent(routing.params["chapter"]));
          break;
          /*
        case 'home':
          dispatch.maps.unsetSubject();
          break;
           */
      }
    },
    'app/chooseInstance': async function() {
      const state: State = getState();
      const routing: RoutingState = state.routing;
      if (routing.page === 'browser')
        dispatch.maps.load({ subject: routing.params["subject"], chapter: routing.params["chapter"]});
      else
        dispatch.maps.forget();
    },
  })
})
