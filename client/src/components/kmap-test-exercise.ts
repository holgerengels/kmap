import {html, css, customElement, property, query} from 'lit-element';
import {Connected} from "./connected";
import {State, store} from "../store";

import '@material/mwc-button';
import '@material/mwc-icon-button';
import './kmap-test-card';
import {colorStyles, fontStyles} from "./kmap-styles";
import {Test} from "../models/tests";
import {KMapTestCard} from "./kmap-test-card";

@customElement('kmap-test-exercise')
export class KmapTestExercise extends Connected {
  @property()
  private _allTests?: Test[] = undefined;
  @property()
  private _tests?: Test[] = undefined;

  @property()
  private _order: "shuffled" | "increasing difficulty" = "shuffled";

  @property()
  private _currentIndex: number = 0;
  @property()
  private _currentTest?: Test = undefined;

  @query('#test-card')
  // @ts-ignore
  private _testCard: KMapTestCard;

  mapState(state: State) {
    return {
      _order: state.tests.order,
      _allTests: state.tests.tests,
    };
  }

  updated(changedProperties) {
    if ((changedProperties.has("_allTests") || changedProperties.has("_order")) && this._allTests) {
      if (this._currentIndex !== 0)
        store.dispatch.shell.showMessage("Die Aufgabenreihe startet von vorne!");
      this._start();
    }
  }

  _start() {
    if (!this._allTests)
      return;

    for (var test of this._allTests) {
      // @ts-ignore
      if (test.balance === "" || test.balance === undefined)
        test.balance = 4;
    }

    this._tests = this._order
      ? shuffleArray([...this._allTests])
      : this._allTests.sort((a, b) => (a.level ? a.level : 4) - (b.level ? b.level : 4));

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
          display: flex;
        }
        kmap-test-card {
          margin: 16px;
        }
      `];
  }

  render() {
    // language=HTML
    return html`
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
