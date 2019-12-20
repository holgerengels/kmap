import {LitElement, html, css} from 'lit-element';
import {addResult, clearResults} from "../actions/tests";
import {store} from "../store";
import {fetchChapterIfNeeded, fetchTopicIfNeeded} from "../actions/tests";
import {connect} from "pwa-helpers/connect-mixin";

import {colorStyles, fontStyles} from "./kmap-styles";
import '@material/mwc-button';
import '@material/mwc-icon-button';
import './kmap-test-card';

class KmapTestExercise extends connect(store)(LitElement) {
  static get styles() {
    // language=CSS
    return [
      fontStyles,
      colorStyles,
      css`
:host {
  display: contents;
}
kmap-test-card {
  margin: auto;
}
      `
    ];
  }

  render() {
    // language=HTML
    return html`
  <div>
    ${this._currentTest ? html`
      <kmap-test-card id="test-card" @next="${this._next}"
        .subject="${this.subject}"
        .chapter="${this._currentTest.chapter}"
        .topic="${this._currentTest.topic}"
        .num="${this._currentIndex}" of="${this._tests.length}"
        .level="${this._currentTest.level}"
        .question="${this._currentTest.question}"
        .answer="${this._currentTest.answer}"
        .values="${this._currentTest.values}"
        .balance="${this._currentTest.balance}"
        showActions></kmap-test-card>`
      : ''}
  </div>
    `;
  }

  static get properties() {
    return {
      subject: {type: String},
      chapter: {type: String },
      _tests: {type: Array},
      _allTests: {type: Array},
      _currentIndex: {type: Number},
      _currentTest: {type: Object},
    };
  }

  constructor() {
    super();
    this._tests = [];
  }

  firstUpdated(changedProperties) {
  }

  updated(changedProperties) {
    if (changedProperties.has("subject") || changedProperties.has("chapter") || changedProperties.has("topic")) {
      if (this.subject && this.chapter && this.topic)
        store.dispatch(fetchTopicIfNeeded(this.subject, this.chapter, this.topic));
      else if (this.subject && this.chapter)
        store.dispatch(fetchChapterIfNeeded(this.subject, this.chapter));
      else
        this._allTests = undefined;
    }
    if (changedProperties.has("_allTests") && this._allTests) {
        this._start();
    }
  }

  stateChanged(state) {
    this._allTests = state.tests.tests;

    this.subject  = state.app.dataPath.length > 0 ? state.app.dataPath[0] : null;
    this.chapter = state.app.dataPath.length > 1 ? state.app.dataPath[1] : null;
    this.topic = state.app.dataPath.length > 2 ? state.app.dataPath[2] : null;
  }

  _start() {
    var topics = [];
    for (var test of this._allTests) {
      if (!topics.includes(test.chapter + "." + test.topic))
        topics.push(test.chapter + "." + test.topic);
    }
    let number = this._allTests.length - this._allTests.length % 3;

    if (topics.length === 0)
      return;

    topics.sort(function () {
      return 0.5 - Math.random()
    });
    //topics = topics.slice(0, number / 3);

    var map = new Map();
    for (var test of this._allTests) {
      var key = test.chapter + "." + test.topic;
      var list = map.get(key);
      if (!list) {
        list = [];
        map.set(key, list);
      }
      list.push(test);
    }

    var tests = [];
    for (var i = 0; i < number / 3 && topics.length > 0; i++) {
      var r = Math.floor(Math.random() * Math.floor(map.size));
      var key = topics[r];
      var list = map.get(key);
      list.sort(function () {
        return 0.5 - Math.random()
      });
      tests.push(list.pop());
      tests.push(list.pop());
      tests.push(list.pop());
      if (list.length < 3) {
        map.delete(key);
        topics.splice(topics.indexOf(key), 1);
      }
    }
    for (var test of tests) {
      if (!test.balance)
        test.balance = 4;
    }
    this._tests = tests;

    this._currentIndex = 0;
    this._currentTest = this._tests[0];
    store.dispatch(clearResults());
  }

  _restart(e) {
    this._start();
  }

  _next(e) {
    let detail = e.detail;
    console.log(detail);
    store.dispatch(addResult(detail));

    this._currentIndex++;
    if (this._currentIndex < this._tests.length) {
      this._currentTest = this._tests[this._currentIndex];
      let testCard = this.shadowRoot.getElementById('test-card');
      testCard.clear();
    }
  }
}
customElements.define('kmap-test-exercise', KmapTestExercise);
