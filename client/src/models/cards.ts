import {createModel, RoutingState} from '@captaincodeman/rdx';
import {Store} from '../store';
import {endpoint, fetchjson} from "../endpoint";
import {encodePath, urls} from "../urls";
import {Card} from "./types";

export interface CardState {
  subject?: string,
  chapter?: string,
  topic?: string,
  loaded?: string,
  card?: Card,
  loading: boolean,
  error: string,
}

export default createModel({
  state: <CardState>{
    subject: undefined,
    chapter: undefined,
    topic: undefined,
    loaded: undefined,
    card: undefined,
    loading: false,
    error: "",
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
    request(state) {
      return { ...state, loading: true,
        card: undefined,
        error: "",
      };
    },
    received(state, payload: Card) {
      return { ...state,
        card: payload,
        loaded: "" + state.subject + state.chapter + state.topic,
        loading: false,
      };
    },
    forget(state) {
      return { ...state,
        subject: undefined,
        chapter: undefined,
        topic: undefined,
        loaded: undefined,
        card: undefined,
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
      async init() {
        navigator.serviceWorker.addEventListener('message', dispatch.cards.cacheUpdate);
      },
      async cacheUpdate(event: MessageEvent) {
        console.log(event);
        if (event.data.meta === 'workbox-broadcast-update') {
          const {cacheName, updatedURL}: { cacheName: string; updatedURL: string } = event.data.payload;
          const cache = await caches.open(cacheName);
          console.log(updatedURL);
          if (updatedURL.includes("data?topic")) {
            const updatedResponse = await cache.match(updatedURL);
            const json = await updatedResponse?.json();
            console.log("CACHE UPDATE CARDS LOAD CARD");
            dispatch.cards.received(json);
          }
        }
      },
      async load() {
        const state = store.getState();

        if (!state.cards.topic)
          return;
        //const load = "" + state.cards.subject + state.cards.chapter + state.cards.topic;
        if (!state.cards.subject || !state.cards.chapter || !state.cards.topic) return;

        //if (state.cards.loaded !== load) {
          console.log("reloading card " + state.cards.subject + " " + state.cards.chapter + " "+ state.cards.topic);
          dispatch.cards.request();
          fetchjson(`${urls.server}data?subject=${encodeURIComponent(state.cards.subject)}&chapter=${encodeURIComponent(state.cards.chapter)}&topic=${encodeURIComponent(state.cards.topic)}`, endpoint.get(state),
            dispatch.cards.received,
            dispatch.app.handleError,
            dispatch.cards.error);
          // dispatch.shell.showMessage("Die Wissenskarte " + state.maps.subject + " → " + state.maps.chapter + " → " + state.maps.topic + " existiert nicht!");
        //}
      },

      'routing/change': async function (routing: RoutingState<string>) {
        switch (routing.page) {
          case 'browser':
            await dispatch.cards.load();
            break;
        }
      },
      'app/chooseInstance': async function () {
        const state = store.getState();
        const routing: RoutingState<string> = state.routing;
        dispatch.cards.forget();
        if (routing.page === 'browser')
          dispatch.cards.load();
      },

      'cards/received': async function() {
        const state = store.getState();
        const card = state.cards.card;
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
            thumb: `${urls.snappy}${encodePath(subject, chapter, topic)}.png`,
            educationalLevel: card.educationalLevel?.split(",").map(l => l.trim()),
            educationalContext: card.educationalContext?.split(",").map(l => l.trim()),
            typicalAgeRange: card.typicalAgeRange,
          });
        }
      }
    }
  }
})
