import {createModel, RoutingState} from '@captaincodeman/rdx';
import {Store} from '../store';
import {endpoint, fetchjson} from "../endpoint";
import {encodePath, urls} from "../urls";
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
  topicCard?: Card,
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
    'routing/change'(state, routing: RoutingState<string>) {
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
        topicCard: undefined,
        error: "",
      };
    },
    received(state, payload: MapState) {
      return { ...state,
        lines: payload.lines,
        loaded: "" + state.subject + state.chapter,
        chapterCard: payload.chapterCard,
        loading: false,
      };
    },
    setTopicCard(state, topicCard: Card | undefined) {
      return {
        ...state,
        topicCard: topicCard
      };
    },
    forget(state) {
      return { ...state,
        subject: undefined,
        chapter: undefined,
        topic: undefined,
        lines: [],
        loaded: undefined,
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
    requestRenameTopic(state) {
      return { ...state, renaiming: true };
    },
    receivedRenameTopic(state) {
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
        navigator.serviceWorker.addEventListener('message', async (event: MessageEvent) => {
          console.log(event);
          if (event.data.meta === 'workbox-broadcast-update') {
            const {cacheName, updatedURL}: { cacheName: string; updatedURL: string } = event.data.payload;
            const cache = await caches.open(cacheName);
            console.log(updatedURL);
            if (updatedURL.includes("data?load")) {
              const updatedResponse = await cache.match(updatedURL);
              const json = await updatedResponse?.json();
              console.log("CACHE UPDATE MAPS LOAD MAP");
              dispatch.maps.loadedMap(json);
            }
            else if (updatedURL.includes("data?latest")) {
              const updatedResponse = await cache.match(updatedURL);
              const json = await updatedResponse?.json();
              console.log("CACHE UPDATE MAPS LATEST");
              dispatch.maps.receivedLatest(json);
            }
            else if (updatedURL.includes("data?topics=all")) {
              const updatedResponse = await cache.match(updatedURL);
              const json = await updatedResponse?.json();
              console.log("CACHE UPDATE MAPS ALL TOPICS");
              dispatch.maps.receivedAllTopics(json);
            }
          }
        });
      },
      async load() {
        const state = store.getState();
        const load = "" + state.maps.subject + state.maps.chapter;
        if (!state.maps.subject || !state.maps.chapter) return;

        if (state.maps.loaded !== load) {
          console.log("reloading map " + state.maps.subject + " " + state.maps.chapter);
          dispatch.maps.unselectCard();
          dispatch.maps.request();
          fetchjson(`${urls.server}data?load=${encodeURIComponent(state.maps.chapter)}&subject=${encodeURIComponent(state.maps.subject)}`, endpoint.get(state),
            dispatch.maps.loadedMap,
            dispatch.app.handleError,
            dispatch.maps.error);
        }
        else {
          try {
            dispatch.maps.setTopicCard(topicCard(state.maps));
          }
          catch (e) {
            dispatch.maps.setTopicCard(undefined);
            dispatch.shell.showMessage("Die Wissenskarte " + state.maps.subject + " → " + state.maps.chapter + " → " + state.maps.topic + " existiert nicht!");
          }
        }
      },
      loadedMap(json) {
        const state = store.getState();
        const mapState = json;
        mapState.topic = state.maps.topic;
        complete(mapState);
        dispatch.maps.received(mapState);
        if (mapState.lines.length === 0) {
          dispatch.shell.showMessage("Die Wissenslandkarte " + mapState.subject + " → " + mapState.chapter + " existiert nicht!");
          dispatch.maps.setTopicCard(undefined);
        }
        else {
          try {
            dispatch.maps.setTopicCard(topicCard(mapState));
          }
          catch (e) {
            dispatch.maps.setTopicCard(undefined);
            dispatch.shell.showMessage("Die Wissenskarte " + mapState.subject + " → " + mapState.chapter + " → " + mapState.topic + " existiert nicht!");
          }
        }
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
      async renameTopic(card: Card) {
        const state = store.getState();
        const userid = state.app.userid;

        dispatch.maps.requestRenameTopic();
        fetchjson(`${urls.server}edit?userid=${userid}&subject=${card.subject}&save=${card.module}`,
          // @ts-ignore
          {...endpoint.post(state), body: JSON.stringify({rename: card, name: card.newName})},
          () => {
            dispatch.maps.receivedRenameTopic();
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

      'routing/change': async function (routing: RoutingState<string>) {
        switch (routing.page) {
          case 'browser':
            await dispatch.maps.load();
            break;
          case 'home':
            dispatch.maps.loadLatest("Mathematik");
            break;
        }
      },
      'maps/setTopicCard': async function () {
        const state = store.getState();

        const card = state.maps.topicCard;
        if (card) {
          const subject = state.maps.subject || '';
          const chapter = state.maps.chapter || '';
          const topic = state.maps.topic || '';
          dispatch.shell.updateMeta({
            title: chapter,
            detail: card.topic,
            description: card.summary,
            created: card.created,
            modified: card.modified,
            author: card.author,
            image: card.thumb ?
              `${urls.server}${encodePath("data", subject, chapter, topic, card.thumb)}?instance=${state.app.instance}`
              : undefined,
            keywords: [subject, chapter, topic, ...(card.keywords ? card.keywords.split(",").map(k => k.trim()) : [])],
            breadcrumbs: ["browser", subject, chapter, topic],
            about: [subject],
            type: ["Text"],
            thumb: `${urls.snappy}${encodePath(subject, chapter, topic)}`,
            educationalLevel: card.educationalLevel?.split(",").map(l => l.trim()),
            educationalContext: card.educationalContext?.split(",").map(l => l.trim()),
            typicalAgeRange: card.typicalAgeRange,
          });
        }
        else {
          var topics: string[] = [];
          for (let line of state.maps.lines) {
            for (let card of line.cards) {
              topics.push(card.topic);
            }
          }

          const subject = state.maps.subject || '';
          const chapter = state.maps.chapter || '';
          dispatch.shell.updateMeta({
            title: chapter,
            description: state.maps.chapterCard !== undefined && state.maps.chapterCard.summary ? state.maps.chapterCard.summary : "Wissenslandkarte zum Kapitel " + chapter,
            keywords: [subject, chapter, ...topics],
            breadcrumbs: ["browser", subject, chapter],
            about: [subject],
            type: ["Unterrichtsplanung"]
          });
        }

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

function topicCard(state: MapState): Card | undefined
{
  if (!state.topic) {
    return undefined;
  } else if (state.topic === "_") {
    return state.chapterCard;
  } else {
    for (let line of state.lines) {
      for (let card of line.cards) {
        if (card.topic === state.topic)
          return card;
      }
    }
    throw new Error("unknown topic " + state.topic);
  }
}

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
