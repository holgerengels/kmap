import {createModel, RoutingState} from '@captaincodeman/rdx';
import {Store} from '../store';
import {endpoint, fetchjson} from "../endpoint";
import {encode, urls} from "../urls";
import {Card} from "./types";

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
export interface Latest {
  subject?: string,
  cards: Card[],
}

export interface MapState {
  subject?: string,
  chapter?: string,
  topic?: string,
  loaded?: string,
  lines: Line[],
  chapterCard?: Card,
  topicCard?: Card,
  timestamp: number,
  loading: boolean,
  error: string,
  selected: string,
  selectedDependencies: string[],
  targeted: string[],
  deleting: boolean,
  renaming: boolean,
  saving: boolean,
  allTopics?: AllTopics,
  loadingAllTopics: boolean,
  cardForEdit?: Card,
  cardForRename?: Partial<Card>,
  cardForDelete?: Partial<Card>,
  latest?: Latest,
  latestTimestamp: number,
}

export default createModel({
  state: <MapState>{
    lines: [],
    chapterCard: undefined,
    topicCard: undefined,
    timestamp: -1,
    loading: false,
    error: "",
    selected: "",
    selectedDependencies: [],
    targeted: [],
    deleting: false,
    renaming: false,
    saving: false,
    loadingAllTopics: false,
    cardForEdit: undefined,
    cardForRename: undefined,
    cardForDelete: undefined,
    latest: undefined,
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
        timestamp: Date.now(),
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
    subjectChanged(state) {
      return { ...state};
    },
    forget(state) {
      return { ...state,
        subject: '',
        chapter: '',
        lines: [],
        loaded: undefined,
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
      return { ...state, deleting: false, cardForDelete: undefined, loaded: undefined };
    },
    requestRenameTopic(state) {
      return { ...state, deleting: true };
    },
    receivedRenameTopic(state) {
      return { ...state, deleting: false, cardForRename: undefined, loaded: undefined };
    },
    requestSaveTopic(state) {
      return { ...state, deleting: true };
    },
    receivedSaveTopic(state) {
      return { ...state, deleting: false, cardForEdit: undefined, loaded: undefined };
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

    requestLatest(state) {
      return { ...state, loadingLatest: true,
        latestTimestamp: Date.now(),
        latest: undefined,
        error: "",
      };
    },
    receivedLatest(state, payload: Latest) {
      return { ...state,
        latest: payload,
        loadingLatest: false,
      };
    },

    setCardForEdit(state, cardForEdit: Card) {
      return {
        ...state, cardForEdit: {
          ...defaults,
          ...cardForEdit,
          subject: state.subject || '',
          chapter: state.chapter || '',
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

  effects(store: Store) {
    const dispatch = store.getDispatch();
    return {
      async load() {
        const state = store.getState();
        const load = "" + state.maps.subject + state.maps.chapter;
        if (!state.maps.subject || !state.maps.chapter) return;

        if (state.maps.loaded !== load) {
          console.log("reloading map " + state.maps.subject + " " + state.maps.chapter);
          dispatch.maps.unselectCard();
          dispatch.maps.request();
          fetchjson(`${urls.server}data?subject=${encodeURIComponent(state.maps.subject)}&load=${encodeURIComponent(state.maps.chapter)}`, endpoint.get(state),
            (json) => {
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

      async loadLatest(subject: string) {
        const state = store.getState();

        if (Date.now() - state.maps.latestTimestamp > 60 * 1000) {
          dispatch.maps.requestLatest();

          fetchjson(`${urls.server}data?latest=${subject}`, endpoint.get(state),
            (json) => {
              dispatch.maps.receivedLatest({subject: subject, cards: json});
            },
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
            dispatch.maps.unsetCardForDelete();
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
            dispatch.maps.unsetCardForRename();
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
            dispatch.maps.unsetCardForEdit();
          },
          dispatch.app.handleError,
          dispatch.maps.error);
      },

      async loadAllTopics(subject: string) {
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

        if (state.maps.topicCard) {
          const subject = state.maps.subject || '';
          const chapter = state.maps.chapter || '';
          const topic = state.maps.topic || '';
          dispatch.shell.updateMeta({
            title: chapter, detail: state.maps.topicCard.topic, description: state.maps.topicCard.summary,
            image: state.maps.topicCard.thumb ?
              `${urls.server}${encode("data", subject, chapter, topic, state.maps.topicCard.thumb)}?instance=${state.app.instance}`
              : undefined,
            created: state.maps.topicCard.created,
            modified: state.maps.topicCard.modified,
            author: state.maps.topicCard.author,
            keywords: [subject, chapter, topic, ...(state.maps.topicCard.keywords ? state.maps.topicCard.keywords.split(",").map(k => k.trim()) : [])],
            breadcrumbs: [subject, chapter, topic],
            about: [subject],
            type: ["Text"],
            thumb: `${urls.snappy}${encode(subject, chapter, topic)}`
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
            breadcrumbs: [subject, chapter],
            about: [subject],
            type: ["Karte"]
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
          dispatch.maps.unsetCardForDelete();
          dispatch.maps.unsetCardForEdit();
          dispatch.maps.unsetCardForRename();
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
