import {LitElement, html, css, customElement, property} from 'lit-element';
import { connect } from '@captaincodeman/rdx';
import {State, store} from "../store";

import '@material/mwc-button';
import '@material/mwc-icon-button';
import './kmap-test-card';
import {colorStyles, fontStyles} from "./kmap-styles";

@customElement('kmap-test-exercise')
class KmapTestExercise extends connect(store, LitElement) {
  @property()
  private _subject: string = '';

  @property()
  private _allTests?: object[] = undefined;
  @property()
  private _tests?: object[] = undefined;

  @property()
  private _currentIndex: number = 0;
  @property()
  private _currentTest?: object = undefined;

  mapState(state: State) {
    return {
      _subject: state.tests.subject,
      _allTests: state.tests.tests,
    };
  }

  updated(changedProperties) {
    if (changedProperties.has("_allTests") && this._allTests) {
        this._start();
    }
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
    store.dispatch.tests.clearResults();
  }

  _restart() {
    this._start();
  }

  _next(e) {
    let detail = e.detail;
    console.log(detail);
    store.dispatch.tests.addResult(detail);

    this._currentIndex++;
    if (this._currentIndex < this._tests.length) {
      this._currentTest = this._tests[this._currentIndex];
      let testCard = this.shadowRoot.getElementById('test-card');
      testCard.clear();
    }
  }

  static get styles() {
    // language=CSS
    return [
      fontStyles,
      colorStyles,
      css`
        :host {
          display: contents;
        }
      `];
  }

  render() {
    // language=HTML
    return html`
  <div>
    ${this._currentTest ? html`
      <kmap-test-card id="test-card" @next="${this._next}"
        .subject="${this._subject}"
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
}
