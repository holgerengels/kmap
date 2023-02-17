import {createModel, RoutingState} from '@captaincodeman/rdx';
import {Store} from '../store';
import {endpoint, fetchjson} from "../endpoint";
import {urls} from "../urls";
import {Attachment} from "./types";

export interface TestResult {
  subject: string;
  chapter: string;
  topic: string;
  attempts: number;
  num: number;
  wrong?: number;
  correct?: number;
  state?: number;
}
export interface Test {
  subject: string,
  chapter: string,
  topic: string,
  set: string,
  key: string,
  level?: number;
  balance: number,
  values: string[],
  question: string,
  answer: string,
  hint: string,
  solution: string,
  repetitions: number,
  attachments: Attachment[];
  created?: number,
  modified?: number,
  author?: string,
}

export interface TopicCount {
  chapter: string,
  topic: string,
  count: number,
}

export interface TestsState {
  order: "shuffled" | "increasing difficulty";
  topics?: TopicCount[],
  topicCounts: object,
  chapterCounts: object,
  chapters?: string[],
  subject?: string,
  chapter?: string,
  topic?: string,
  loaded?: string,
  loadedTopics?: string,
  tree?: string[],
  tests?: Test[],
  results: object[],
  loadingTopics: boolean,
  loadingChapters: boolean,
  loadingTree: boolean,
  loading: boolean,
  deleting: boolean,
  renaming: boolean,
  saving: boolean,
  error: string,
  testForEdit?: Test,
  testForRename?: Partial<Test>,
  testForDelete?: Partial<Test>,
  random?: Test[],
  randomTimestamp: number,
}

export default createModel({
  state: <TestsState>{
    order: "increasing difficulty",
    topicCounts: {},
    chapterCounts: {},
    results: [],
    loadingTopics: false,
    loadingChapters: false,
    loadingTree: false,
    loading: false,
    deleting: false,
    renaming: false,
    saving: false,
    error: "",
    loadingRandomTests: false,
    randomTimestamp: -1,
  },
  reducers: {
    'routing/change'(state, routing: RoutingState<string>) {
      return routing.page === 'test' ? {
        ...state,
        subject: routing.params["subject"] ? decodeURIComponent(routing.params["subject"]) : undefined,
        chapter: routing.params["chapter"] ? decodeURIComponent(routing.params["chapter"]) : undefined,
        topic: routing.params["topic"] ? decodeURIComponent(routing.params["topic"]) : undefined,
      }
      : state;
    },
    setOrder(state, order) {
      return { ...state, order: order };
    },
    requestTopics(state) {
      return { ...state, loadingTopics: true,
        error: "",
      };
    },
    receivedTopics(state, payload: TopicCount[]) {
      return { ...state,
        topics: payload,
        topicCounts: Object.fromEntries(payload.map(tc => [tc.topic ? tc.chapter + "/" + tc.topic : tc.chapter, tc.count])),
        chapterCounts: payload.reduce((o, tc) => {
          const name = tc.chapter;
          if (!o.hasOwnProperty(name))
            o[name] = 0;
          o[name] += tc.count;
          return o;
        }, {}),
        loadingTopics: false,
      };
    },
    loadedTopics(state, payload: string) {
      return { ...state,
        loadedTopics: payload,
      };
    },
    requestChapters(state) {
      return { ...state, loadingChapters: true,
        error: "",
      };
    },
    receivedChapters(state, payload: string[]) {
      return { ...state,
        chapters: payload,
        loadingChapters: false,
      };
    },
    requestTree(state) {
      return { ...state, loadingTree: true,
        error: "",
      };
    },
    receivedTree(state, payload: string[]) {
      return { ...state,
        tree: payload,
        loadingTree: false,
      };
    },

    request(state) {
      return { ...state, loading: true,
        error: "",
      };
    },
    received(state, tests: Test[]) {
      return { ...state,
        tests: tests,
        loaded: "" + state.subject + state.chapter + state.topic,
        loading: false,
      };
    },
    forget(state) {
      return { ...state,
        subject: undefined,
        chapter: undefined,
        topic: undefined,
        chapters: undefined,
        tree: undefined,
        tests: undefined,
        loaded: undefined,
        results: [],
        testForDelete: undefined,
        testForRename: undefined,
        testForEdit: undefined,
        topics: undefined,
        topicCounts: {},
        chapterCounts: {},
      };
    },

    requestDeleteTest(state) {
      return { ...state, deleting: true };
    },
    receivedDeleteTest(state) {
      return { ...state, deleting: false };
    },
    requestRenameTest(state) {
      return { ...state, renaiming: true };
    },
    receivedRenameTest(state) {
      return { ...state, renaiming: false, testForRename: undefined };
    },
    requestSaveTest(state) {
      return { ...state, saving: true };
    },
    receivedSaveTest(state) {
      return { ...state, saving: false };
    },

    requestRandomTests(state) {
      return { ...state, loadingRandomTests: true,
        randomTimestamp: Date.now(),
        random: undefined,
        error: "",
      };
    },
    receivedRandomTests(state, payload: Test[]) {
      return { ...state,
        random: payload,
        loadingRandomTests: false,
      };
    },

    clearResults(state) {
      return { ...state, results: [] };
    },
    addResult(state, result: object) {
      return { ...state,
        results: [ ...state.results, result],
      };
    },

    setTestForEdit(state, testForEdit: Test) {
      return { ...state, testForEdit: testForEdit }
    },
    unsetTestForEdit(state) {
      return { ...state, testForEdit: undefined }
    },
    setTestForRename(state, testForRename: Partial<Test>) {
      return { ...state, testForRename: testForRename }
    },
    unsetTestForRename(state) {
      return { ...state, testForRename: undefined }
    },
    setTestForDelete(state, testForDelete: Partial<Test>) {
      return { ...state, testForDelete: testForDelete }
    },
    unsetTestForDelete(state) {
      return { ...state, testForDelete: undefined }
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
            if (updatedURL.includes("tests?topics=all")) {
              const updatedResponse = await cache.match(updatedURL);
              const json = await updatedResponse?.json();
              console.log("CACHE UPDATE TESTS TOPICS");
              dispatch.tests.receivedTopics(json);
            }
            else if (updatedURL.includes("tests?chapters=all")) {
              const updatedResponse = await cache.match(updatedURL);
              const json = await updatedResponse?.json();
              console.log("CACHE UPDATE TESTS CHAPTERS");
              dispatch.tests.receivedChapters(json);
            }
            else if (updatedURL.includes("data?tree=all")) {
              const updatedResponse = await cache.match(updatedURL);
              const json = await updatedResponse?.json();
              console.log("CACHE UPDATE TESTS TREE");
              dispatch.tests.receivedTree(json);
            }
            else if (updatedURL.includes("tests?random")) {
              const updatedResponse = await cache.match(updatedURL);
              const json = await updatedResponse?.json();
              console.log("CACHE UPDATE TESTS RANDOM");
              dispatch.tests.receivedRandomTests(json);
            }
            else if (updatedURL.includes("tests?subject")) {
              const updatedResponse = await cache.match(updatedURL);
              const json = await updatedResponse?.json();
              console.log("CACHE UPDATE TESTS LOAD TESTS");
              dispatch.tests.received(json);
            }
          }
        });
      },
      async loadTopics() {
        const state = store.getState();
        const subject = state.maps.subject;
        if (!subject)
          return;

        dispatch.tests.requestTopics();
        await fetchjson(`${urls.server}tests?topics=all&subject=${subject}`, endpoint.get(state),
          dispatch.tests.receivedTopics,
          dispatch.app.handleError,
          dispatch.tests.error);
        dispatch.tests.loadedTopics(subject);
      },
      async loadChapters(subject: string) {
        const state = store.getState();

        // @ts-ignore
        if (state.tests.subject !== subject || !state.tests.chapters) {
          dispatch.tests.requestChapters();
          fetchjson(`${urls.server}tests?chapters=all&subject=${subject}`, endpoint.get(state),
            dispatch.tests.receivedChapters,
            dispatch.app.handleError,
            dispatch.tests.error);
        }
      },
      async loadTree(subject: string) {
        const state = store.getState();

        // @ts-ignore
        if (state.tests.subject !== subject || !state.tests.tree) {
          dispatch.tests.requestTree();
          fetchjson(`${urls.server}data?tree=all&subject=${subject}`, endpoint.get(state),
            dispatch.tests.receivedTree,
            dispatch.app.handleError,
            dispatch.tests.error);
        }
      },
      async load() {
        const state = store.getState();
        const load = "" + state.tests.subject + state.tests.chapter + state.tests.topic;
        if (!state.tests.subject || !state.tests.chapter) return;

        if (state.tests.loaded !== load) {
          dispatch.tests.request();
          const url = state.tests.topic
            ? `${urls.server}tests?subject=${state.tests.subject}&chapter=${state.tests.chapter}&topic=${state.tests.topic}`
            : `${urls.server}tests?subject=${state.tests.subject}&chapter=${state.tests.chapter}`;

          fetchjson(url, endpoint.get(state),
            dispatch.tests.received,
            dispatch.app.handleError,
            dispatch.tests.error);
        }
      },

      async loadRandomTests(subject: string) {
        const state = store.getState();

        if (Date.now() - state.tests.randomTimestamp > 60 * 1000) {
          dispatch.tests.requestRandomTests();

          fetchjson(`${urls.server}tests?random=${subject}`, endpoint.get(state),
            dispatch.tests.receivedRandomTests,
            dispatch.app.handleError,
            dispatch.tests.error);
        }
      },

      async deleteTest(test: Test) {
        const state = store.getState();
        const userid = state.app.userid;

        dispatch.tests.requestDeleteTest();
        fetchjson(`${urls.server}tests?userid=${userid}&subject=${test.subject}&save=${test.set}`,
          {...endpoint.post(state), body: JSON.stringify({delete: test})},
          () => {
            dispatch.tests.receivedDeleteTest();
            dispatch.tests.unsetTestForDelete();
            dispatch.contentSets.maybeObsoleteSet({subject: test.subject, set: test.set});
          },
          dispatch.app.handleError,
          dispatch.tests.error);
      },
      async renameTest(test: Test) {
        const state = store.getState();
        const userid = state.app.userid;

        dispatch.tests.requestRenameTest();
        fetchjson(`${urls.server}tests?userid=${userid}&subject=${test.subject}&save=${test.set}`,
          // @ts-ignore
          {...endpoint.post(state), body: JSON.stringify({rename: test, name: test.newName})},
          () => {
            dispatch.tests.receivedRenameTest();
            dispatch.tests.unsetTestForRename();
          },
          dispatch.app.handleError,
          dispatch.tests.error);
      },
      async saveTest(test: Test) {
        const state = store.getState();
        const userid = state.app.userid;

        dispatch.tests.requestSaveTest();
        fetchjson(`${urls.server}tests?userid=${userid}&subject=${test.subject}&save=${test.set}`,
          // @ts-ignore
          {...endpoint.post(state), body: JSON.stringify(test.added ? {changed: test} : {old: test, changed: test})},
          () => {
            dispatch.tests.receivedSaveTest();
            dispatch.tests.unsetTestForEdit();
            dispatch.contentSets.maybeNewSet({subject: test.subject, set: test.set});
          },
          dispatch.app.handleError,
          dispatch.tests.error);
      },

      'routing/change': async function (routing: RoutingState<string>) {
        switch (routing.page) {
          case 'test':
            const state = store.getState();
            dispatch.tests.load();

            if (state.tests.chapter)
              document.title = "KMap - Aufgaben bearbeiten";
            else if (routing.params["results"])
              document.title = "KMap - Aufgaben auswerten";
            else
              document.title = "KMap - Aufgaben wählen";

            const subject = state.tests.subject || '';
            const chapter = state.tests.chapter || '';
            const topic = state.tests.topic || '';
            let title = document.title;
            let description: string | undefined = undefined;
            let breadcrumbs: string[] | undefined = undefined;
            if (subject && chapter) {
              if (topic) {
                title = "Aufgaben zum Thema " + subject + " → " + chapter + " → " + topic;
                breadcrumbs = ["test", subject, chapter, topic];
              }
              else {
                title = "Aufgaben zum Thema " + subject + " → " + chapter;
                breadcrumbs = ["test", subject, chapter];
              }
              description = "Ermittle Deinen Wissensstand mit Hilfe von interaktiven Aufgaben!";
            }
            dispatch.shell.updateMeta({
              title: title,
              description: description,
              keywords: subject != undefined ? [subject, chapter, topic] : undefined,
              breadcrumbs: breadcrumbs,
              about: subject !== undefined ? [subject] : undefined,
              learningResourceType: ["Lernkontrolle"]
            });

            if (Object.keys(routing.params).length === 0)
              dispatch.tests.loadTopics();
            break;
          case 'browser':
            dispatch.tests.loadTopics();
            break;
          case 'home':
            dispatch.tests.loadRandomTests("Mathematik");
            break;
        }
      },
      'app/chooseInstance': async function () {
        const state = store.getState();
        const routing: RoutingState<string> = state.routing;
        if (routing.page === 'test') {
          dispatch.tests.loadTopics();
          dispatch.tests.load();
        }
        else if (routing.page === 'browser')
          dispatch.tests.loadTopics();
        else
          dispatch.tests.forget();
      },
      'shell/removeLayer': async function () {
        const state = store.getState();
        if (!state.shell.layers.includes("editor")) {
          dispatch.tests.unsetTestForDelete();
          dispatch.tests.unsetTestForEdit();
        }
      },
      'tests/setTestForEdit': async function () {
        const state = store.getState();
        if (state.tests.testForEdit === undefined)
          return;
        if (state.contentSets.selected == undefined || state.tests.testForEdit.subject !== state.contentSets.selected.subject)
          dispatch.maps.loadAllTopics(state.tests.testForEdit.subject);
      },
    }
  }
})
