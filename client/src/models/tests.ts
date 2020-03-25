import {createModel, RoutingState} from '@captaincodeman/rdx-model';
import { Store } from '../store';
import {endpoint, fetchjson} from "../endpoint";
import {urls} from "../urls";
import {Attachment, Path} from "./types";

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
  attachments: Attachment[];
}

export interface Topics {
  subject: string,
  topics: string[],
}
interface Chapters {
  subject: string,
  chapters: string[],
}
interface Tests {
  subject: string,
  chapter: string,
  topic?: string,
  tests: object[],
}

export interface TestsState {
  topics?: Topics,
  chapters?: Chapters,
  subject: string,
  chapter?: string,
  topic?: string,
  tree?: string[],
  tests?: object[],
  results: object[],
  timestamp: number,
  loadingTopics: boolean,
  loadingChapters: boolean,
  loadingTree: boolean,
  deleting: boolean;
  saving: boolean,
  error: string,
  testForEdit?: Test,
  testForDelete?: Test,
}

export default createModel({
  state: <TestsState>{
    subject: "",
    chapters: undefined,
    tree: undefined,
    tests: undefined,
    results: [],
    timestamp: -1,
    loadingTopics: false,
    loadingChapters: false,
    loadingTree: false,
    deleting: false,
    saving: false,
    error: "",
    testForEdit: undefined,
    testForDelete: undefined,
  },
  reducers: {
    requestTopics(state) {
      return { ...state, loadingTopics: true,
        timestamp: Date.now(),
        error: "",
      };
    },
    receivedTopics(state, payload: Topics) {
      return { ...state,
        topics: payload,
        loadingTopics: false,
      };
    },
    requestChapters(state) {
      return { ...state, loadingChapters: true,
        timestamp: Date.now(),
        error: "",
      };
    },
    receivedChapters(state, payload: Chapters) {
      return { ...state,
        chapters: payload,
        loadingChapters: false,
      };
    },
    requestTree(state) {
      return { ...state, loadingTree: true,
        timestamp: Date.now(),
        error: "",
      };
    },
    receivedTree(state, payload: Chapters) {
      return { ...state,
        subject: payload.subject,
        tree: payload.chapters,
        loadingTree: false,
      };
    },

    requestTests(state) {
      return { ...state, loadingTests: true,
        timestamp: Date.now(),
        error: "",
      };
    },
    receivedTests(state, payload: Tests) {
      return { ...state,
        subject: payload.subject,
        chapter: payload.chapter,
        topic: payload.topic,
        tests: payload.tests,
        loadingTests: false,
      };
    },
    forget(state) {
      return { ...state,
        deleting: true,
        subject: "",
        chapters: undefined,
        tree: undefined,
        tests: undefined,
        results: [],
        testForDelete: undefined,
        testForEdit: undefined,
        topics: undefined,
      };
    },

    requestDeleteTest(state) {
      return { ...state, deleting: true };
    },
    receivedDeleteTest(state) {
      return { ...state, deleting: false };
    },
    requestSaveTest(state) {
      return { ...state, deleting: true };
    },
    receivedSaveTest(state) {
      return { ...state, deleting: false };
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
    setTestForDelete(state, testForDelete: Test) {
      return { ...state, testForDelete: testForDelete }
    },
    unsetTestForDelete(state) {
      return { ...state, testForDelete: undefined }
    },

    error(state, message) {
      return { ...state,
        loading: false,
        storing: false,
        error: message,
      }
    },
  },

  // @ts-ignore
  effects: (store: Store) => ({
    async loadTopics() {
      const dispatch = store.dispatch();
      const state = store.getState();
      const subject = state.maps.subject;
      if (!subject)
        return;

      // @ts-ignore
      if (!state.topics || state.topics.subject !== subject) {
        dispatch.tests.requestTopics();
        fetchjson(`${urls.server}tests?topics=all&subject=${subject}`, endpoint.get(state),
          (json) => {
            dispatch.tests.receivedTopics({subject: subject, topics: json});
          },
          dispatch.app.handleError,
          dispatch.tests.error);
      }
    },
    async loadChapters(subject: string) {
      const dispatch = store.dispatch();
      const state = store.getState();

      // @ts-ignore
      if (state.tests.subject !== subject || !state.tests.chapters) {
        dispatch.tests.requestChapters();
        fetchjson(`${urls.server}tests?chapters=all&subject=${subject}`, endpoint.get(state),
          (json) => {
            dispatch.tests.receivedChapters({subject: subject, chapters: json});
          },
          dispatch.app.handleError,
          dispatch.tests.error);
      }
    },
    async loadTree(subject: string) {
      const dispatch = store.dispatch();
      const state = store.getState();

      // @ts-ignore
      if (state.tests.subject !== subject || !state.tests.tree) {
        dispatch.tests.requestTree();
        fetchjson(`${urls.server}data?tree=all&subject=${subject}`, endpoint.get(state),
          (json) => {
            dispatch.tests.receivedTree({subject: subject, chapters: json});
          },
          dispatch.app.handleError,
          dispatch.tests.error);
      }
    },
    async loadTests(payload: Path) {
      const dispatch = store.dispatch();
      const state = store.getState();
      if (!payload.subject || !payload.chapter)
        return;

      // @ts-ignore
      if (!state.tests || state.tests.subject !== payload.subject || state.tests.chapter !== payload.chapter || state.tests.topic !== payload.topic || !state.tests.tests) {
        dispatch.tests.requestTests();
        const url = payload.topic
          ? `${urls.server}tests?subject=${payload.subject}&chapter=${payload.chapter}&topic=${payload.topic}`
          : `${urls.server}tests?subject=${payload.subject}&chapter=${payload.chapter}`;

        fetchjson(url, endpoint.get(state),
          (json) => {
            dispatch.tests.receivedTests({subject: payload.subject, chapter: payload.chapter, topic: payload.topic, tests: json});
          },
          dispatch.app.handleError,
          dispatch.tests.error);
      }
    },

    async deleteTest(test: Test) {
      const dispatch = store.dispatch();
      const state = store.getState();
      const userid = state.app.userid;

      dispatch.tests.requestDeleteTest();
      fetchjson(`${urls.server}tests?userid=${userid}&subject=${test.subject}&save=${test.set}`, {... endpoint.post(state), body: JSON.stringify({delete: test})},
        () => {
          dispatch.tests.receivedDeleteTest();
          dispatch.tests.unsetTestForDelete();
          dispatch.contentSets.maybeObsoleteSet({subject: test.subject, set: test.set});
        },
        dispatch.app.handleError,
        dispatch.tests.error);
    },
    async saveTest(test: Test) {
      const dispatch = store.dispatch();
      const state = store.getState();
      const userid = state.app.userid;

      dispatch.tests.requestSaveTest();
      fetchjson(`${urls.server}tests?userid=${userid}&subject=${test.subject}&save=${test.set}`,
        // @ts-ignore
        {... endpoint.post(state), body: JSON.stringify(test.added ? {changed: test} : {old: test, changed: test})},
        () => {
          dispatch.tests.receivedSaveTest();
          dispatch.tests.unsetTestForEdit();
          dispatch.contentSets.maybeNewSet({subject: test.subject, set: test.set});
        },
        dispatch.app.handleError,
        dispatch.tests.error);
    },

    'maps/subjectChanged': async function() {
      const dispatch = store.dispatch();
      dispatch.tests.loadTopics();
    },
    'routing/change': async function(routing: RoutingState) {
      const dispatch = store.dispatch();
      switch (routing.page) {
        case 'test':
          dispatch.tests.loadTests({ subject: routing.params["subject"], chapter: routing.params["chapter"], topic: routing.params["topic"]});

          if (routing.params["chapter"])
            document.title = "KMap - Aufgaben bearbeiten";
          else if (routing.params["results"])
            document.title = "KMap - Aufgaben auswerten";
          else
            document.title = "KMap - Aufgaben wählen";
          break;
        case 'browser':
          dispatch.tests.loadTopics();
          break;
      }
    },
    'app/chooseInstance': async function() {
      const dispatch = store.dispatch();
      const state = store.getState();
      const routing: RoutingState = state.routing;
      if (routing.page === 'test')
        dispatch.tests.loadTests({ subject: routing.params["subject"], chapter: routing.params["chapter"], topic: routing.params["topic"]});
      else if (routing.page === 'browser')
        dispatch.tests.loadTopics();
      else
        dispatch.tests.forget();
    },
    'shell/removeLayer': async function() {
      const dispatch = store.dispatch();
      const state = store.getState();
      if (!state.shell.layers.includes("editor")) {
        dispatch.tests.unsetTestForDelete();
        dispatch.tests.unsetTestForEdit();
      }
    },
  })
})

