import {LitElement, html, css, customElement, property, query} from 'lit-element';
import { connect } from '@captaincodeman/rdx';
import {State, store} from "../store";

import '@material/mwc-button';
import '@material/mwc-icon-button';
import './kmap-test-card';
import {colorStyles, fontStyles} from "./kmap-styles";
import {Test} from "../models/tests";
import {KMapTestCard} from "./kmap-test-card";

@customElement('kmap-test-exercise')
export class KmapTestExercise extends connect(store, LitElement) {
  @property()
  private _allTests?: Test[] = undefined;
  @property()
  private _tests?: Test[] = undefined;

  @property()
  private _currentIndex: number = 0;
  @property()
  private _currentTest?: Test = undefined;

  @query('#test-card')
  // @ts-ignore
  private _testCard: KMapTestCard;

  mapState(state: State) {
    return {
      _allTests: state.tests.tests,
    };
  }

  updated(changedProperties) {
    if (changedProperties.has("_allTests") && this._allTests) {
        this._start();
    }
  }

  _start() {
    if (!this._allTests)
      return;

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

    map = new Map(
      [...map]
        .map(([k, v]) => [k, shuffleArray(v)])
        .map(([k, v]) => [k, v.slice(0, v.length - v.length % 3)])
    );
    map = new Map(
      [...map]
        .filter(([, v]) => v.length >= 3)
    );

    let number = 0;
    for (const list of map.values()) {
      number += list.length;
    }
    var topics: string[] = [...map.keys()];

    if (topics.length === 0)
      return;

    shuffleArray(topics);

    var tests: Test[] = [];
    for (var i = 0; i < number / 3 && topics.length > 0; i++) {
      var r = Math.floor(Math.random() * Math.floor(map.size));
      var key = topics[r];
      var list = map.get(key);
      shuffleArray(list);
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
    if (this._tests === undefined) return;

    let detail = e.detail;
    console.log(detail);
    store.dispatch.tests.addResult(detail);

    this._currentIndex++;
    if (this._currentIndex < this._tests.length) {
      this._currentTest = this._tests[this._currentIndex];
      this._testCard.clear();
    }
    else
      this.dispatchEvent(new CustomEvent('end', {bubbles: true, composed: true}));
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
        .subject="${this._currentTest.subject}"
        .set="${this._currentTest.set}"
        .chapter="${this._currentTest.chapter}"
        .topic="${this._currentTest.topic}"
        .key="${this._currentTest.key}"
        .num="${this._currentIndex}" of="${this._tests ? this._tests.length : 0}"
        .level="${this._currentTest.level}"
        .question="${this._currentTest.question}"
        .answer="${this._currentTest.answer}"
        .hint="${this._currentTest.hint}"
        .solution="${this._currentTest.solution}"
        .values="${this._currentTest.values}"
        .balance="${this._currentTest.balance}"></kmap-test-card>`
      : ''}
  </div>
    `;
  }
}

function shuffleArray(array): [] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}
