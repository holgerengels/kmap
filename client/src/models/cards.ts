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
  embedded?: Card,
  loading: boolean,
  error: string,
}

function same(card: Card, cards: CardState) {
  return card.subject === cards.subject
  && card.chapter === cards.chapter
  && card.topic === cards.topic
}

export default createModel({
  state: <CardState>{
    subject: undefined,
    chapter: undefined,
    topic: undefined,
    loaded: undefined,
    card: undefined,
    embedded: undefined,
    loading: false,
    error: "",
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
    request(state) {
      return { ...state, loading: true,
        card: undefined,
        error: "",
      };
    },
    received(state, payload: Card) {
      return { ...state,
        card: payload,
        embedded: undefined,
        loaded: "" + state.subject + state.chapter + state.topic,
        loading: false,
      };
    },
    embedded(state, payload: Card) {
      return { ...state,
        embedded: payload,
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
        let element = document.getElementById("embedded-topic");
        if (element) {
          dispatch.cards.embedded(JSON.parse(element.innerText));
          element.remove();
        }
      },
      async cacheUpdate(event: MessageEvent) {
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

        //const load = "" + state.cards.subject + state.cards.chapter + state.cards.topic;
        if (!state.cards.subject || !state.cards.chapter || !state.cards.topic)
          return;

        if (state.cards.embedded && same(state.cards.embedded, state.cards)) {
          console.log("EMBEDDED CARD");
          dispatch.cards.received(state.cards.embedded);
        }
        else {
          console.log("LOADING CARD " + state.cards.subject + " " + state.cards.chapter + " " + state.cards.topic);
          dispatch.cards.request();
          fetchjson(`${urls.server}data?topic=${encodeURIComponent(state.cards.topic)}&chapter=${encodeURIComponent(state.cards.chapter)}&subject=${encodeURIComponent(state.cards.subject)}`, endpoint.get(state),
            dispatch.cards.received,
            dispatch.app.handleError,
            dispatch.cards.error);
        }
      },

      'app/chooseInstance': async function () {
        const state = store.getState();
        const routing: RoutingState<string> = state.routing;
        dispatch.cards.forget();
        if (routing.page === 'browser')
          dispatch.cards.load();
      },

      'routing/change': function (routing: RoutingState<string>) {
        switch (routing.page) {
          case 'browser':
            dispatch.cards.applyRoute(routing);
            dispatch.cards.load();
            break;
        }
      },

      'cards/received': async function() {
        const state = store.getState();

        const card = state.cards.card;
        if (card && same(card, state.cards)) {
          const subject = state.cards.subject || '';
          const chapter = state.cards.chapter || '';
          const topic = state.cards.topic || '';
          dispatch.shell.updateMeta({
            type: "Article",
            title: chapter,
            detail: card.topic,
            description: card.meta ? card.meta : textOnly(card.summary),
            created: card.created,
            modified: card.modified,
            author: card.author,
            image: card.thumb ?
              `${urls.server}${encodePath("data", subject, chapter, topic, card.thumb)}?instance=${state.app.instance}`
              : `${urls.snappy}${encodePath(subject, chapter, topic)}.png`,
            keywords: [subject, chapter, topic, ...(card.keywords ? card.keywords.split(",").map(k => k.trim()) : []), ...(card.skills ? ["Kompetenzcheck"] : [])],
            breadcrumbs: ["browser", subject, chapter, topic],
            about: [subject],
            learningResourceType: ["Text"],
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

function textOnly(html: string) {
  var tempDivElement = document.createElement("div");
  tempDivElement.innerHTML = html;
  return tempDivElement.textContent || "";
}
