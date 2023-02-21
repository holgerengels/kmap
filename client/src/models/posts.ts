import {createModel, RoutingState} from '@captaincodeman/rdx';
import {Store} from '../store';
import {endpoint, fetchjson} from "../endpoint";
import {urls} from "../urls";
import {Card} from "./types";
import {Meta} from "./shell";

export interface PostState {
  posts?: Card[],
  current?: string;
  loading: boolean,
  error: string,
}

export default createModel({
  state: <PostState>{
    posts: undefined,
    current: undefined,
    loading: false,
    error: "",
  },
  reducers: {
    applyRoute(state, routing: RoutingState<string>) {
      return routing.page === 'blog' ? {
          ...state,
          current: routing.params["post"] ? decodeURIComponent(routing.params["post"]) : undefined,
        }
        : state;
    },
    request(state) {
      return { ...state, loading: true,
        posts: [],
        error: "",
      };
    },
    received(state, payload: Card[]) {
      return { ...state,
        posts: payload.sort((a, b) => (b.created || b.modified || Date.now()) - (a.created || a.modified || Date.now())),
        loading: false,
      };
    },
    forget(state) {
      return { ...state,
        posts: [],
        current: undefined,
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
        navigator.serviceWorker.addEventListener('message', dispatch.posts.cacheUpdate);
      },
      async cacheUpdate(event: MessageEvent) {
        if (event.data.meta === 'workbox-broadcast-update') {
          const {cacheName, updatedURL}: { cacheName: string; updatedURL: string } = event.data.payload;
          const cache = await caches.open(cacheName);
          console.log(updatedURL);
          if (updatedURL.includes("data?latest")) {
            const updatedResponse = await cache.match(updatedURL);
            const json = await updatedResponse?.json();
            console.log("CACHE UPDATE MAPS LATEST");
            dispatch.posts.received(json);
          }
        }
      },
      async load() {
        const state = store.getState();

        dispatch.posts.request();
        fetchjson(`${urls.server}data?latest=Blog&number=10000`, endpoint.get(state),
          dispatch.posts.received,
          dispatch.app.handleError,
          dispatch.posts.error);
      },
      received(): any {
        const state = store.getState();
        if (!state.posts.posts) return;
        dispatch.shell.updateMeta(generateMeta(state.posts.posts, state.posts.current));
      },
      'routing/change': function (routing: RoutingState<string>) {
        switch (routing.page) {
          case 'blog':
            dispatch.posts.applyRoute(routing);
            dispatch.posts.load();
            break;
        }
      },
    }
  }
})

function textOnly(html: string) {
  var tempDivElement = document.createElement("div");
  tempDivElement.innerHTML = html;
  return tempDivElement.textContent || "";
}

function generateMeta(posts: Card[], current?: string): Meta {
  var keywords: string[] = [];
  var crumbs: string[] = [];
  var type: string = "Blog";
  var title: string = "KMap News Blog";
  var description: string = "Was gibt es neues bei KMap";
  var created: number = Date.now();
  var modified: number = created;
  var author: string = "KMap Team";
  var thumb: string = "/app/icons/KMap.svg";

  if (current) {
    crumbs[0] = current;
    const card = posts.find(c => c.topic === current);
    if (card) {
      type = "BlogPosting";
      title = card.topic;
      description = textOnly(card.summary);
      keywords = card.keywords?.split(",").map(w => w.trim()) || [];
      created = card.created || Date.now();
      modified = card.modified || Date.now();
      author = card.author || "KMap Team";
      thumb = card.thumb
        ? `${urls.server}data/Blog/Blog/${card.topic}/${card.thumb}?instance=root`
        : "/app/icons/KMap.svg";
    }
    else
      console.warn("current " + current + " not found in " + posts.join(", "));
  }
  else {
    for (let card of posts) {
      keywords.push(card.topic);
    }
  }
  return {
    type: type,
    title: title,
    description: description,
    keywords: keywords.length ? keywords : undefined,
    breadcrumbs: ["blog", ...crumbs],
    created: created,
    modified: modified,
    author: author,
    image: thumb,
  };
}
