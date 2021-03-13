import {createModel, RoutingState} from '@captaincodeman/rdx';
import {Store} from '../store';
import {endpoint, fetchjson} from "../endpoint";
import {encode, urls} from "../urls";
import {Card} from "./types";
import {Test} from "./tests";

export interface ExerciseState {
  subject?: string,
  chapter?: string,
  topic?: string,
  key?: string,
  test?: Test,
  loading: boolean,
  error: string,
}

export default createModel({
  state: <ExerciseState>{
    loading: false,
    error: "",
  },
  reducers: {
    'routing/change'(state, routing: RoutingState<string>) {
      return routing.page === 'exercise' ? {
        ...state,
        subject: routing.params["subject"] ? decodeURIComponent(routing.params["subject"]) : undefined,
        chapter: routing.params["chapter"] ? decodeURIComponent(routing.params["chapter"]) : undefined,
        topic: routing.params["topic"] ? decodeURIComponent(routing.params["topic"]) : undefined,
        key: routing.params["key"] ? decodeURIComponent(routing.params["key"]) : undefined,
      }
      : state;
    },
    request(state) {
      return { ...state, loading: true,
        test: undefined,
        error: "",
      };
    },
    received(state, test: Test) {
      return { ...state,
        test: test,
        loading: false,
      };
    },
    forget(state) {
      return { ...state,
        subject: undefined,
        chapter: undefined,
        topic: undefined,
        key: undefined,
        test: undefined,
        loading: false,
        error: '',
      };
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
            type: ["Text"]
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
