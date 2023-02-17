import {createModel, RoutingState} from '@captaincodeman/rdx';
import {Store} from '../store';
import {endpoint, fetchjson} from "../endpoint";
import {urls} from "../urls";
import {Card} from "./types";

export interface Line {
  cards: Card[],
}

export type EditActionType = "edit" | "rename" | "move" | "delete";
export interface EditAction {
  action: EditActionType,
  card: Partial<Card>,
}

export interface MapState {
  subject?: string,
  chapter?: string,
  topic?: string,
  loaded?: string,
  lines: Line[],
  chapterCard?: Card,
  loading: boolean,
  deleting: boolean,
  renaming: boolean,
  saving: boolean,
  error: string,
  selected: string,
  selectedDependencies: string[],
  targeted: string[],
  allTopics?: string[],
  loadingAllTopics: boolean,
  editAction?: EditAction,
  latest?: Card[],
  latestTimestamp: number,
}

export default createModel({
  state: <MapState>{
    subject: undefined,
    chapter: undefined,
    topic: undefined,
    loaded: undefined,
    lines: [],
    loading: false,
    deleting: false,
    renaming: false,
    saving: false,
    error: "",
    selected: "",
    selectedDependencies: [],
    targeted: [],
    loadingAllTopics: false,
    loadingLatest: false,
    latestTimestamp: -1,
  },
  reducers: {
    applyRoute(state, routing: RoutingState<string>) {
      return routing.page === 'browser' ? {
        ...state,
        subject: routing.params["subject"] ? decodeURIComponent(routing.params["subject"]) : undefined,
        chapter: routing.params["chapter"] ? decodeURIComponent(routing.params["chapter"]) : undefined,
        topic: routing.params["topic"] ? decodeURIComponent(routing.params["topic"]) : undefined,
      }
      : state;
    },
    selectCard(state, card: Card) {
      return { ...state, selected: card.topic, selectedDependencies: card.dependencies || [] }
    },
    unselectCard(state) {
      return { ...state, selected: "", selectedDependencies: [] }
    },
    setTargeted(state, targeted) {
      return { ...state, targeted: targeted }
    },
    request(state) {
      return { ...state, loading: true,
        lines: [],
        chapterCard: undefined,
        error: "",
      };
    },
    received(state, payload: MapState) {
      return { ...state,
        lines: payload.lines,
        chapterCard: payload.chapterCard,
        loaded: "" + state.subject + state.chapter,
        loading: false,
      };
    },
    forget(state) {
      return { ...state,
        subject: undefined,
        chapter: undefined,
        topic: undefined,
        loaded: undefined,
        lines: [],
        chapterCard: undefined,
        editAction: undefined,
      };
    },

    requestDeleteTopic(state) {
      return { ...state, deleting: true };
    },
    receivedDeleteTopic(state) {
      return { ...state, deleting: false, editAction: undefined, loaded: undefined };
    },
    requestRenameCard(state) {
      return { ...state, renaiming: true };
    },
    receivedRenameCard(state) {
      return { ...state, renaiming: false, editAction: undefined, loaded: undefined };
    },
    requestMoveTopic(state) {
      return { ...state, moving: true };
    },
    receivedMoveTopic(state) {
      return { ...state, moving: false, editAction: undefined, loaded: undefined };
    },
    requestSaveTopic(state) {
      return { ...state, saving: true };
    },
    receivedSaveTopic(state) {
      return { ...state, saving: false, editAction: undefined, loaded: undefined };
    },

    requestAllTopics(state) {
      return { ...state, loadingAllTopics: true, error: "" };
    },
    receivedAllTopics(state, payload: string[]) {
      return { ...state,
        allTopics: payload,
        loadingAllTopics: false,
      };
    },

    requestLatest(state) {
      return { ...state, loadingLatest: true,
        latestTimestamp: Date.now(),
        latest: undefined,
        error: "",
      };
    },
    receivedLatest(state, payload: Card[]) {
      return { ...state,
        latest: payload,
        loadingLatest: false,
      };
    },

    edit(state, card: Card) {
      return {
        ...state, editAction: { card: card, action: 'edit' },
      }
    },
    setEditAction(state, action: EditAction) {
      return {
        ...state, editAction: action,
      }
    },
    unsetEditAction(state) {
      return { ...state, editAction: undefined }
    },

    error(state, message) {
      return { ...state,
        loading: false,
        loadingCard: false,
        deleting: false,
        renaming: false,
        saving: false,
        error: message,
      }
    },
  },

  effects(store: Store) {
    const dispatch = store.getDispatch();
    return {
      async init() {
        navigator.serviceWorker.addEventListener('message', dispatch.maps.cacheUpdate);
      },
      async cacheUpdate(event: MessageEvent) {
        if (event.data.meta === 'workbox-broadcast-update') {
          const {cacheName, updatedURL}: { cacheName: string; updatedURL: string } = event.data.payload;
          const cache = await caches.open(cacheName);
          console.log(updatedURL);
          if (updatedURL.includes("data?load")) {
            const updatedResponse = await cache.match(updatedURL);
            const json = await updatedResponse?.json();
            console.log("CACHE UPDATE MAPS LOAD MAP");
            dispatch.maps.loadedMap(json);
          } else if (updatedURL.includes("data?latest")) {
            const updatedResponse = await cache.match(updatedURL);
            const json = await updatedResponse?.json();
            console.log("CACHE UPDATE MAPS LATEST");
            dispatch.maps.receivedLatest(json);
          } else if (updatedURL.includes("data?topics=all")) {
            const updatedResponse = await cache.match(updatedURL);
            const json = await updatedResponse?.json();
            console.log("CACHE UPDATE MAPS ALL TOPICS");
            dispatch.maps.receivedAllTopics(json);
          }
        }
      },
      async load() {
        const state = store.getState();

        if (state.maps.topic)
          return;
        //const load = "" + state.maps.subject + state.maps.chapter;
        if (!state.maps.subject || !state.maps.chapter) return;

        console.log("LOADING MAP " + state.maps.subject + " " + state.maps.chapter);
        dispatch.maps.unselectCard();
        dispatch.maps.request();
        fetchjson(`${urls.server}data?load=${encodeURIComponent(state.maps.chapter)}&subject=${encodeURIComponent(state.maps.subject)}`, endpoint.get(state),
          dispatch.maps.loadedMap,
          dispatch.app.handleError,
          dispatch.maps.error);
      },
      loadedMap(json) {
        const state = store.getState();
        const mapState = json;
        mapState.topic = state.maps.topic;
        complete(mapState);
        dispatch.maps.received(mapState);
      },
      async loadLatest(subject: string) {
        const state = store.getState();

        if (Date.now() - state.maps.latestTimestamp > 60 * 1000) {
          dispatch.maps.requestLatest();

          fetchjson(`${urls.server}data?latest=${subject}`, endpoint.get(state),
            dispatch.maps.receivedLatest,
            dispatch.app.handleError,
            dispatch.maps.error);
        }
      },

      async loadToEdit(card: Card) {
        const state = store.getState();

        fetchjson(`${urls.server}data?subject=${encodeURIComponent(card.subject)}&chapter=${encodeURIComponent(card.chapter)}&topic=${encodeURIComponent(card.topic)}`, endpoint.get(state),
          dispatch.maps.edit,
          dispatch.app.handleError,
          dispatch.maps.error);
      },

      async deleteTopic(card: Card) {
        const state = store.getState();
        const userid = state.app.userid;

        dispatch.maps.requestDeleteTopic();
        fetchjson(`${urls.server}edit?userid=${userid}&subject=${card.subject}&save=${card.module}`,
          {...endpoint.post(state), body: JSON.stringify({delete: card})},
          () => {
            dispatch.maps.receivedDeleteTopic();
            dispatch.maps.unsetEditAction();
          },
          dispatch.app.handleError,
          dispatch.maps.error);
      },
      async renameCard(card: Card) {
        const state = store.getState();
        const userid = state.app.userid;

        dispatch.maps.requestRenameCard();
        fetchjson(`${urls.server}edit?userid=${userid}&subject=${card.subject}&save=${card.module}`,
          // @ts-ignore
          {...endpoint.post(state), body: JSON.stringify({rename: card, newChapter: card.newChapter, newTopic: card.newTopic})},
          () => {
            dispatch.maps.receivedRenameCard();
            dispatch.maps.unsetEditAction();
          },
          dispatch.app.handleError,
          dispatch.maps.error);
      },
      async moveTopic(card: Card) {
        const state = store.getState();
        const userid = state.app.userid;

        dispatch.maps.requestMoveTopic();
        fetchjson(`${urls.server}edit?userid=${userid}&subject=${card.subject}&save=${card.module}`,
          // @ts-ignore
          {...endpoint.post(state), body: JSON.stringify({move: card, module: card.newModule})},
          () => {
            dispatch.maps.receivedMoveTopic();
            dispatch.maps.unsetEditAction();
          },
          dispatch.app.handleError,
          dispatch.maps.error);
      },
      async saveTopic(card: Card) {
        const state = store.getState();
        const userid = state.app.userid;

        dispatch.maps.requestSaveTopic();
        fetchjson(`${urls.server}edit?userid=${userid}&subject=${card.subject}&save=${card.module}`,
          // @ts-ignore
          {...endpoint.post(state), body: JSON.stringify(card.added ? {changed: card} : {old: card, changed: card})},
          () => {
            dispatch.maps.receivedSaveTopic();
            dispatch.maps.unsetEditAction();
          },
          dispatch.app.handleError,
          dispatch.maps.error);
      },

      async loadAllTopics(subject: string) {
        const state = store.getState();

        dispatch.maps.requestAllTopics();
        fetchjson(`${urls.server}data?topics=all&subject=${subject}`, endpoint.get(state),
          dispatch.maps.receivedAllTopics,
          dispatch.app.handleError,
          dispatch.maps.error);
      },

      'routing/change': function (routing: RoutingState<string>) {
        switch (routing.page) {
          case 'browser':
            dispatch.maps.applyRoute(routing);
            dispatch.maps.load();
            break;
          case 'home':
            dispatch.maps.loadLatest("Mathematik");
            break;
        }
      },

      'maps/received': async function () {
        const state = store.getState();

          var topics: string[] = [];
          for (let line of state.maps.lines) {
            for (let card of line.cards) {
              topics.push(card.topic);
            }
          }

          const subject = state.maps.subject || '';
          const chapter = state.maps.chapter || '';
          dispatch.shell.updateMeta({
            type: "Article",
            title: chapter,
            description: state.maps.chapterCard !== undefined && state.maps.chapterCard.summary ? state.maps.chapterCard.summary : "Wissenslandkarte zum Kapitel " + chapter,
            keywords: [subject, chapter, ...topics],
            breadcrumbs: ["browser", subject, chapter],
            about: [subject],
            learningResourceType: ["Unterrichtsplanung"]
          });
      },
      'app/chooseInstance': async function () {
        const state = store.getState();
        const routing: RoutingState<string> = state.routing;
        if (routing.page === 'browser')
          dispatch.maps.load();
        else
          dispatch.maps.forget();
      },
      'shell/removeLayer': async function () {
        const state = store.getState();
        if (!state.shell.layers.includes("editor")) {
          dispatch.maps.unsetEditAction();
        }
        if (!state.shell.layers.includes("timeline")) {
          dispatch.maps.setTargeted(undefined);
        }
      },
    }
  }
})

function complete(state: MapState) {
  if (!state.subject)
    throw new Error("subject not given");
  if (!state.chapter)
    throw new Error("chapter not given");

  for (let line of state.lines) {
    for (let card of line.cards) {
      card.subject = state.subject;
      card.chapter = state.chapter;
    }
  }
  if (state.chapterCard) {
    state.chapterCard.subject = state.subject;
    state.chapterCard.chapter = state.chapter;
  }
}
