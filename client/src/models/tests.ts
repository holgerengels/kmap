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
  attachments: Attachment[];
}

export interface TopicCount {
  chapter: string,
  topic: string,
  count: number,
}
export interface Topics {
  subject: string,
  topics: TopicCount[],
}
interface Chapters {
  subject: string,
  chapters: string[],
}
export interface Random {
  subject?: string,
  tests: Test[],
}

export interface TestsState {
  topics?: Topics,
  chapters?: Chapters,
  subject?: string,
  chapter?: string,
  topic?: string,
  loaded?: string,
  tree?: string[],
  tests?: object[],
  results: object[],
  loadingTopics: boolean,
  loadingChapters: boolean,
  loadingTree: boolean,
  timestamp: number,
  loading: boolean,
  deleting: boolean,
  renaming: boolean,
  saving: boolean,
  error: string,
  testForEdit?: Test,
  testForRename?: Partial<Test>,
  testForDelete?: Partial<Test>,
  random?: Random,
  randomTimestamp: number,
}

export default createModel({
  state: <TestsState>{
    results: [],
    timestamp: -1,
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

    request(state) {
      return { ...state, loading: true,
        timestamp: Date.now(),
        error: "",
      };
    },
    received(state, tests: object[]) {
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
    receivedRandomTests(state, payload: Random) {
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
      async loadTopics() {
        const state = store.getState();
        const subject = state.maps.subject;
        if (!subject)
          return;

        // @ts-ignore
        if (!state.tests.topics || state.tests.topics.subject !== subject) {
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
            (json) => {
              dispatch.tests.received(json);
            },
            dispatch.app.handleError,
            dispatch.tests.error);
        }
      },

      async loadRandomTests(subject: string) {
        const state = store.getState();

        if (Date.now() - state.tests.randomTimestamp > 60 * 1000) {
          dispatch.tests.requestRandomTests();

          fetchjson(`${urls.server}tests?random=${subject}`, endpoint.get(state),
            (json) => {
              dispatch.tests.receivedRandomTests({subject: subject, tests: json});
            },
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

            let title = document.title;
            let description: string | undefined = undefined;
            let breadcrumbs: string[] | undefined = undefined;
            if (state.tests.subject && state.tests.chapter) {
              if (state.tests.topic) {
                title = "Aufgaben zum Thema " + state.tests.subject + " → " + state.tests.chapter + " → " + state.tests.topic;
                breadcrumbs = ["tests", state.tests.subject, state.tests.chapter, state.tests.topic];
              }
              else {
                title = "Aufgaben zum Thema " + state.tests.chapter;
                breadcrumbs = [state.tests.subject, state.tests.chapter, "tests"];
              }
              description = "Ermittle Deinen Wissensstand mit Hilfe von interaktiven Aufgaben!";
            }
            dispatch.shell.updateMeta({title: title, description: description, breadcrumbs: breadcrumbs, about: state.tests.subject ? [state.tests.subject] : undefined, type: ["Lernkontrolle"] });

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

export const includes = (topics: Topics, chapter: string, topic?: string): boolean => {
  for (const count of topics.topics) {
    if (count.chapter === chapter && (topic === undefined || count.topic === topic))
      return true;
  }
  return false;
};

export const count = (topics: Topics, chapter: string, topic?: string): number | undefined => {
  return topics.topics.filter(t => t.chapter === chapter && (topic === undefined || t.topic === topic)).map(t => t.count).reduce((sum, c) => sum + c, 0)
};
