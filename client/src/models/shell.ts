import {createModel, RoutingState} from '@captaincodeman/rdx';
import {Store} from '../store';
import {urls} from "../urls";

export interface Meta {
  title?: string,
  detail?: string,
  description?: string,
  keywords?: string[],
  image?: string,
  author?: string,
  created?: number,
  modified?: number,
  breadcrumbs?: string[],
  about?: string[],
  type?: string[],
  thumb?: string,
  educationalLevel?: string[],
  educationalContext?: string[],
  typicalAgeRange?: string,
}
export interface ShellState {
  meta: Meta,
  narrow: boolean,
  drawerOpen: boolean,
  passiveEventListeners: boolean,
  messages: string[],
  layers: string[],
  compactCards: boolean,
}

export default createModel({
  state: <ShellState>{
    meta: {},
    narrow: false,
    drawerOpen: false,
    passiveEventListeners: false,
    messages: [],
    layers: ["summaries", "ratings"],
    compactCards: false,
  },
  reducers: {
    updateMeta(state, meta: Meta) {
      return { ...state, meta}
    },
    updateNarrow(state, narrow: boolean) {
      return { ...state, narrow: narrow }
    },
    updateDrawerOpen(state, drawerOpen: boolean) {
      return { ...state, drawerOpen: drawerOpen }
    },
    addMessage(state, message: string) {
      return { ...state, messages: [...state.messages, message] }
    },
    removeMessage(state, message: string) {
      return { ...state, messages: state.messages.filter(m => m !== message) }
    },
    clearMessages(state) {
      return { ...state, messages: [] }
    },
    updatePassiveEventListeners(state, passiveEventListeners: boolean) {
      return { ...state, passiveEventListeners: passiveEventListeners }
    },
    addLayer(state, layer: string) {
      return { ...state, layers: state.layers.includes(layer) ? state.layers : [...state.layers, layer] }
    },
    removeLayer(state, layer: string) {
      return { ...state, layers: state.layers.filter(m => m !== layer) }
    },
    updateCompactCards(state, compactCards: boolean) {
      return { ...state, compactCards: compactCards }
    },
  },

  effects(store: Store) {
    const dispatch = store.getDispatch();
    return {
      async init() {
        updateMetadata({
          title: "KMap",
          description: "KMap kartographiert Wissen mit Zusammenhang",
          image: window.location.origin + "/app/icons/KMap-Logo-cropped.png",
          keywords: undefined
        });
      },
      updateMeta(meta: Meta) {
        const title = meta.detail ? meta.title  + " - " + meta.detail : meta.title;
        const docTitle = title || "KMap";
        const description = meta.description || "KMap kartographiert Wissen mit Zusammenhang";
        document.title = docTitle ? docTitle + " - KMap" : "KMap";
        updateMetadata({ title: title, description: description, image: meta.image, keywords: meta.keywords });
        updateLd({
          "@context": "https://schema.org",
          "@type": "WebPage",
          "breadcrumb": meta.breadcrumbs ? breadCrumbsLd(meta.breadcrumbs) : undefined,
          "mainEntity": {
            "@type": "Article",
            "headline": title,
            "name": title,
            "description": description,
            "keywords": meta.keywords?.join(", "),
            "mainEntityOfPage": window.location.href,
            "image": meta.image ? [meta.image] : "https://kmap.eu/app/icons/KMap-Logo-cropped.png",
            "datePublished": meta.created ? new Date(meta.created) : new Date(),
            "dateModified": meta.modified ? new Date(meta.modified) : undefined,
            "author": meta.author ? {
              "@type": "Person",
              "name": meta.author
            } : {
              "@type": "Organization",
              "name": "KMap Team"
            },
            "publisher": {
              "@type": "Organization",
              "name": "KMap Team",
              "email": "hengels@gmail.com",
              "logo": {
                "@type": "ImageObject",
                "url": "https://kmap.eu/app/icons/KMap-Logo-cropped.png"
              }
            },
            "license": "https://creativecommons.org/licenses/by-sa/4.0/",
            "inLanguage": ["de"],
            "audience": ["Lerner/in"],
            "about": meta.about,
            "learningResourceType": meta.type,
            "thumbnailUrl": meta.thumb,
            "educationalLevel": meta.educationalLevel,
            "oeh:educationalContext": meta.educationalContext,
            "typicalAgeRange": meta.typicalAgeRange,
          }
        });
      },
      showMessage(payload: string) {
        window.setTimeout(() => dispatch.shell.removeMessage(payload), 3000);
        dispatch.shell.addMessage(payload);
      },
      'routing/change': async function (routing: RoutingState<string>) {
        if (routing.page !== 'browser' && routing.page !== 'test')
          dispatch.shell.updateMeta({});

        if (routing.page === 'courses') {
          console.log("loading courses")
          import('../components/kmap-courses').then(() => console.log("loaded courses"));
        }
        else if (routing.page === 'content-manager') {
          console.log("loading content-manager")
          import('../components/kmap-content-manager').then(() => console.log("loaded content-manager"));
        }
      },

      'app/receivedLogin': async function () {
        const state = store.getState();
        if (state.app.roles.includes("teacher") || state.app.roles.includes("admin")) {
          console.log("loading components")
          await import('../components/kmap-module-selector');
          await import('../components/kmap-editor-add-fabs');
          await import('../components/kmap-editor-edit-dialog');
          await import('../components/kmap-editor-rename-dialog');
          await import('../components/kmap-editor-move-dialog');
          await import('../components/kmap-editor-delete-dialog');

          await import('../components/kmap-set-selector');
          await import('../components/kmap-test-editor-add-fabs');
          await import('../components/kmap-test-editor-delete-dialog');
          await import('../components/kmap-test-editor-rename-dialog');
          await import('../components/kmap-test-editor-edit-dialog');

          await import('../components/kmap-course-selector');
        }
      },
      'app/receivedLogout': async function () {
        dispatch.shell.removeLayer("averages");
        dispatch.shell.removeLayer("editor");
        dispatch.shell.removeLayer("timeline");
      },
    }
  }
})

const updateLd = (ld) => {
  const element: HTMLScriptElement = document.getElementById("ld") as HTMLScriptElement;
  element.innerText = JSON.stringify(ld);
};

const breadCrumbsLd = function(path: string[]) {
  const page = path.shift();
  const key = page === "exercises" ? path.pop() : undefined;

  const items = path.map((v, i, a) => {
    return {
      "@type": "ListItem",
      "position": i+1,
      "name": v,
      "item": "https://kmap.eu" + urls.client + "browser/" + a.slice(0, i+1).map(p => encodeURIComponent(p)).join("/")
    }
  });

  switch (page) {
    case "tests":
      items.push({
        "@type": "ListItem",
        "position": items.length + 1,
        "name": "Test",
        "item": "https://kmap.eu" + urls.client + "test/" + path.map(p => encodeURIComponent(p)).join("/")
      });
      break;
    case "exercises":
      items.push({
        "@type": "ListItem",
        "position": items.length + 1,
        "name": "Test",
        "item": "https://kmap.eu" + urls.client + "exercises/" + path.map(p => encodeURIComponent(p)).join("/") + "/" + key,
      });
      break;
  }

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items
  };
}

const updateMetadata = ({ title, description, image, keywords }) => {
  setMetaTag('property', 'og:title', title);
  setMetaTag('name', 'description', description);
  setMetaTag('property', 'og:description', description);
  setMetaTag('property', 'og:image', image);
  setMetaTag('name', 'keywords', keywords ? keywords.join(", ") : "Schule, Wissen, Wissenskarte, Wissenslandkarte, Lernen, Lernfortschritt");
  setMetaTag('property', 'og:url', window.location.href);
};

function setMetaTag(attrName, attrValue, content) {
  let element = document.head.querySelector(`meta[${attrName}="${attrValue}"]`);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attrName, attrValue);
    document.head.appendChild(element);
  }
  element.setAttribute('content', content || '');
}
