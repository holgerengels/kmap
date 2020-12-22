import {createModel, RoutingState} from '@captaincodeman/rdx';
import {Store} from '../store';
import {endpoint, fetchjson} from "../endpoint";
import {encode, urls} from "../urls";
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
export interface Latest {
  subject?: string,
  cards: Card[],
}

export interface MapState {
  subject?: string,
  chapter?: string,
  topic?: string,
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
    setTopic(state, topic: string | undefined) {
      return {
        ...state,
        topic: topic
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
      async load(path: Path) {
        const state = store.getState();
        const oldSubject: string | undefined = state.maps.subject;

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
            await dispatch.maps.load({subject: routing.params["subject"], chapter: routing.params["chapter"]});
            document.title = "KMap - " + (routing.params["topic"] ? decodeURIComponent(routing.params["topic"]) : decodeURIComponent(routing.params["chapter"]));
            let topic = routing.params["topic"];
            topic = topic ? decodeURIComponent(topic) : undefined;
            dispatch.maps.setTopic(topic);
            break;
          case 'home':
            dispatch.maps.loadLatest("Mathematik");
            break;
        }
      },
      'maps/received': async function () {
        const state = store.getState();

        var topics: string[] = [];
        if (!state.maps.topic) {
          dispatch.maps.setTopicCard(undefined);
        }
        else if (state.maps.topic === "_") {
          dispatch.maps.setTopicCard(state.maps.chapterCard);
        }
        else {
          let lala: Card | undefined = undefined;
          for (let line of state.maps.lines) {
            for (let card of line.cards) {
              topics.push(card.topic);
              if (card.topic === state.maps.topic)
                lala = card;
            }
          }
          dispatch.maps.setTopicCard(lala);
        }
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
            breadcrumbs: [subject, chapter, topic]
          });
        }
        else {
          const subject = state.maps.subject || '';
          const chapter = state.maps.chapter || '';
          dispatch.shell.updateMeta({
            title: chapter,
            description: state.maps.chapterCard !== undefined && state.maps.chapterCard.summary ? state.maps.chapterCard.summary : "Wissenslandkarte zum Kapitel " + chapter,
            keywords: [subject, chapter, ...topics],
            breadcrumbs: [subject, chapter]
          });
        }

      },
      'app/chooseInstance': async function () {
        const state = store.getState();
        const routing: RoutingState<string> = state.routing;
        if (routing.page === 'browser')
          dispatch.maps.load({subject: routing.params["subject"], chapter: routing.params["chapter"]});
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
