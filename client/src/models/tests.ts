import {createModel, RoutingState} from '@captaincodeman/rdx-model';
import {State, Dispatch} from '../store';
import {endpoint} from "../endpoint";
import {config} from "../config";
import {Path} from "./types";

export interface Test {
  subject: string,
  chapter: string,
  topic: string,
  set: string,
  key: string,
  level: number;
  balance: number,
  values: string[],
  question: string,
  answer: string,
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
  subject: string,
  chapter?: string,
  topic?: string,
  chapters?: string[],
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
        subject: payload.subject,
        chapters: payload.chapters,
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
  effects: (dispatch: Dispatch, getState) => ({
    async loadTopics() {
      const state: State = getState();
      const subject = state.maps.subject;
      if (!subject)
        return;

      // @ts-ignore
      if (state.tests.subject !== subject || !state.tests.tests) {
        dispatch.tests.requestTopics();
        const resp = await fetch(`${config.server}tests?topics=all&subject=${subject}`, endpoint.get(state));
        if (resp.ok) {
          const json = await resp.json();
          // @ts-ignore
          dispatch.tests.receivedTopics({subject: subject, topics: json});
        }
        else {
          const message = await resp.text();
          // @ts-ignore
          dispatch.app.handleError({ code: resp.status, message: message });
          // @ts-ignore
          dispatch.tests.error(message);
        }
      }
    },
    async loadChapters(subject: string) {
      const state: State = getState();

      // @ts-ignore
      if (state.tests.subject !== subject || !state.tests.chapters) {
        dispatch.tests.requestChapters();
        const resp = await fetch(`${config.server}tests?chapters=all&subject=${subject}`, endpoint.get(state));
        if (resp.ok) {
          const json = await resp.json();
          // @ts-ignore
          dispatch.tests.receivedChapters({subject: subject, chapters: json});
        }
        else {
          const message = await resp.text();
          // @ts-ignore
          dispatch.app.handleError({ code: resp.status, message: message });
          // @ts-ignore
          dispatch.tests.error(message);
        }
      }
    },
    async loadTree(subject: string) {
      const state: State = getState();

      // @ts-ignore
      if (state.tests.subject !== subject || !state.tests.tree) {
        dispatch.tests.requestTree();
        const resp = await fetch(`${config.server}data?tree=all&subject=${subject}`, endpoint.get(state));
        if (resp.ok) {
          const json = await resp.json();
          // @ts-ignore
          dispatch.tests.receivedTree({subject: subject, chapters: json});
        }
        else {
          const message = await resp.text();
          // @ts-ignore
          dispatch.app.handleError({ code: resp.status, message: message });
          // @ts-ignore
          dispatch.tests.error(message);
        }
      }
    },
    async loadTests(payload: Path) {
      const state: State = getState();
      if (!payload.subject || !payload.chapter)
        return;

      // @ts-ignore
      if (state.tests.subject !== payload.subject || state.tests.chapter !== payload.chapter || state.tests.topic !== payload.topic || !state.tests.tests) {
        dispatch.tests.requestTests();
        const url = payload.topic
          ? `${config.server}tests?subject=${payload.subject}&chapter=${payload.chapter}&topic=${payload.topic}`
          : `${config.server}tests?subject=${payload.subject}&chapter=${payload.chapter}`;
        const resp = await fetch(url, endpoint.get(state));
        if (resp.ok) {
          const json = await resp.json();
          // @ts-ignore
          dispatch.tests.receivedTests({subject: payload.subject, chapter: payload.chapters, topic: payload.topic, tests: json});
        }
        else {
          const message = await resp.text();
          // @ts-ignore
          dispatch.app.handleError({ code: resp.status, message: message });
          // @ts-ignore
          dispatch.tests.error(message);
        }
      }
    },

    async deleteTest(test: Test) {
      const state: State = getState();
      const userid = state.app.userid;

      dispatch.tests.requestDeleteTest();
      const resp = await fetch(`${config.server}edit?userid=${userid}&subject=${test.subject}&save=${test.set}`,
        {... endpoint.post(state), body: JSON.stringify({delete: test})});

      if (resp.ok) {
        await resp.json();
        dispatch.tests.receivedDeleteTest();
        dispatch.tests.unsetTestForDelete();
      }
      else {
        const message = await resp.text();
        // @ts-ignore
        dispatch.app.handleError({ code: resp.status, message: message });
        // @ts-ignore
        dispatch.tests.error(message);
      }
    },
    async saveTest(test: Test) {
      const state: State = getState();
      const userid = state.app.userid;

      dispatch.tests.requestSaveTest();
      const resp = await fetch(`${config.server}tests?userid=${userid}&subject=${test.subject}&save=${test.set}`,
        // @ts-ignore
        {... endpoint.post(state), body: JSON.stringify(test.added ? {changed: test} : {old: test, changed: test})});

      if (resp.ok) {
        await resp.json();
        dispatch.tests.receivedSaveTest();
        dispatch.tests.unsetTestForEdit();
      }
      else {
        const message = await resp.text();
        // @ts-ignore
        dispatch.app.handleError({ code: resp.status, message: message });
        // @ts-ignore
        dispatch.tests.error(message);
      }
    },

    'maps/received': async function() {
        dispatch.tests.loadTopics();
    },
    'routing/change': async function(routing: RoutingState) {
      switch (routing.page) {
        case 'test':
          // @ts-ignore
          dispatch.tests.loadTests({ subject: routing.params["subject"], chapter: routing.params["chapter"], topic: routing.params["topic"]});
          break;
      }
    },
    'app/chooseInstance': async function() {
      const state: State = getState();
      const routing: RoutingState = state.routing;
      if (routing.page === 'test')
        dispatch.tests.loadTests({ subject: routing.params["subject"], chapter: routing.params["chapter"], topic: routing.params["topic"]});
    },
  })
})
