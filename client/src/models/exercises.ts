import {createModel, RoutingState} from '@captaincodeman/rdx';
import {Store} from '../store';
import {endpoint, fetchjson} from "../endpoint";
import {encodeParams, urls} from "../urls";
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
        if (!state.exercises.subject || !state.exercises.chapter || !state.exercises.topic || !state.exercises.key) return;

        console.log("loading test " + state.exercises.subject + " " + state.exercises.chapter + " " + state.exercises.topic + " " + state.exercises.key);
        dispatch.exercises.request();
        fetchjson(`${urls.server}tests?${encodeParams({"subject": state.exercises.subject, "chapter": state.exercises.chapter, "topic": state.exercises.topic, "key": state.exercises.key})}`, endpoint.get(state),
          (json) => {
            dispatch.exercises.received(json);
          },
          dispatch.app.handleError,
          dispatch.maps.error);
      },
      'exercises/received': async function () {
        const state = store.getState();
        const subject = state.exercises.subject || '';
        const chapter = state.exercises.chapter || '';
        const topic = state.exercises.topic || '';
        const key = state.exercises.key || '';
        dispatch.shell.updateMeta({
          title: key,
          description: "Aufgabe zum Thema " + subject + " → " + chapter + " → " + topic,
          created: state.exercises.test?.created,
          modified: state.exercises.test?.modified,
          author: state.exercises.test?.author,
          keywords: [subject, chapter, topic, key],
          breadcrumbs: ["exercises", subject, chapter, topic, key],
          about: [subject],
          type: ["Übung"]
        });
      },
      'routing/change': async function (routing: RoutingState<string>) {
        switch (routing.page) {
          case 'exercise':
            await dispatch.exercises.load();
            break;
        }
      },
      'app/chooseInstance': async function () {
        const state = store.getState();
        const routing: RoutingState<string> = state.routing;
        if (routing.page === 'exercise')
          dispatch.exercises.load();
        else
          dispatch.exercises.forget();
      },
    }
  }
})
