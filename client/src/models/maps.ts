import {createModel, RoutingState} from '@captaincodeman/rdx-model';
import {Store} from '../store';
import {endpoint, fetchjson} from "../endpoint";
import {urls} from "../urls";
import {Card, Path} from "./types";

const defaults: object = {
  summary: '',
  description: '',
  thumb: '',
  links: '',
  depends: [],
  attachments: []
};

export interface Line {
  cards: Card[],
}
interface AllTopics {
  subject: string,
  topics: string[],
}

export interface MapState {
  subject: string,
  chapter: string,
  lines: Line[],
  chapterCard?: Card,
  latest: Card[],
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
  cardForRename?: Partial<Card>,
  cardForDelete?: Partial<Card>,
}

export default createModel({
  state: <MapState>{
    subject: "",
    chapter: "",
    lines: [],
    chapterCard: undefined,
    latest: [],
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
      return { ...state, selected: card.topic, selectedDependencies: card.depends || [] }
    },
    unselectCard(state) {
      return { ...state, selected: "", selectedDependencies: [] }
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
      return {
        ...state, cardForEdit: {
          ...defaults,
          subject: state.subject,
          chapter: state.chapter,
          ...cardForEdit
        }
      }
    },
    unsetCardForEdit(state) {
      return { ...state, cardForEdit: undefined }
    },
    setCardForRename(state, cardForRename: Partial<Card>) {
      return { ...state, cardForRename: cardForRename }
    },
    unsetCardForRename(state) {
      return { ...state, cardForRename: undefined }
    },
    setCardForDelete(state, cardForDelete: Partial<Card>) {
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
  effects: (store: Store) => ({
    async load(path: Path) {
      const dispatch = store.dispatch();
      const state = store.getState();
      const oldSubject: string = state.maps.subject;

      if (state.maps.subject === path.subject && state.maps.chapter === path.chapter) {
        console.warn("reloading map " + path.subject + " " + path.chapter);
      }

      dispatch.maps.request();
      fetchjson(`${urls.server}data?subject=${path.subject}&load=${path.chapter}`, endpoint.get(state),
        (json) => {
          dispatch.maps.received(json);
          dispatch.maps.unselectCard();
          if (path.subject !== oldSubject) {
            dispatch.maps.subjectChanged();
          }
        },
        dispatch.app.handleError,
        dispatch.maps.error);
    },
    async deleteTopic(card: Card) {
      const dispatch = store.dispatch();
      const state = store.getState();
      const userid = state.app.userid;

      dispatch.maps.requestDeleteTopic();
      fetchjson(`${urls.server}edit?userid=${userid}&subject=${card.subject}&save=${card.module}`,
        {... endpoint.post(state), body: JSON.stringify({delete: card})},
        () => {
          dispatch.maps.receivedDeleteTopic();
          dispatch.maps.unsetCardForDelete();
        },
        dispatch.app.handleError,
        dispatch.maps.error);
    },
    async renameTopic(card: Card) {
      const dispatch = store.dispatch();
      const state = store.getState();
      const userid = state.app.userid;

      dispatch.maps.requestRenameTopic();
      fetchjson(`${urls.server}edit?userid=${userid}&subject=${card.subject}&save=${card.module}`,
        // @ts-ignore
        {... endpoint.post(state), body: JSON.stringify({rename: card, name: card.newName })},
        () => {
          dispatch.maps.receivedRenameTopic();
          dispatch.maps.unsetCardForRename();
        },
        dispatch.app.handleError,
        dispatch.maps.error);
    },
    async saveTopic(card: Card) {
      const dispatch = store.dispatch();
      const state = store.getState();
      const userid = state.app.userid;

      dispatch.maps.requestSaveTopic();
      fetchjson(`${urls.server}edit?userid=${userid}&subject=${card.subject}&save=${card.module}`,
        // @ts-ignore
        {... endpoint.post(state), body: JSON.stringify(card.added ? {changed: card} : {old: card, changed: card})},
        () => {
          dispatch.maps.receivedSaveTopic();
          dispatch.maps.unsetCardForEdit();
        },
        dispatch.app.handleError,
        dispatch.maps.error);
    },

    async loadAllTopics(subject: string) {
      const dispatch = store.dispatch();
      const state = store.getState();

      if (state.maps.allTopics && state.maps.allTopics.subject === subject) {
        console.warn("reloading all topics " + subject);
      }

      dispatch.maps.requestAllTopics();
      fetchjson(`${urls.server}data?subject=${subject}&topics=all`, endpoint.get(state),
        (json) => {
          dispatch.maps.receivedAllTopics({subject: subject, topics: json});
        },
        dispatch.app.handleError,
        dispatch.maps.error);
    },

    'routing/change': async function(routing: RoutingState) {
      const dispatch = store.dispatch();
      switch (routing.page) {
        case 'browser':
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
      const dispatch = store.dispatch();
      const state = store.getState();
      const routing: RoutingState = state.routing;
      if (routing.page === 'browser')
        dispatch.maps.load({ subject: routing.params["subject"], chapter: routing.params["chapter"]});
      else
        dispatch.maps.forget();
    },
    'shell/removeLayer': async function() {
      const dispatch = store.dispatch();
      const state = store.getState();
      if (!state.shell.layers.includes("editor")) {
        dispatch.maps.unsetCardForDelete();
        dispatch.maps.unsetCardForEdit();
        dispatch.maps.unsetCardForRename();
      }
    },
  })
})
