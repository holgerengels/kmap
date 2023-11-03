import {html, css, PropertyValues} from 'lit';
import {customElement, property, query, state} from 'lit/decorators.js';
import {Connected} from "./connected";
import {State, store} from "../store";

import '@material/mwc-button';
import '@material/mwc-icon-button';
import './kmap-test-card';
import {resetStyles, colorStyles, fontStyles} from "./kmap-styles";
import {Test} from "../models/tests";
import {KMapTestCard} from "./kmap-test-card";

@customElement('kmap-test-exercise')
export class KmapTestExercise extends Connected {
  @state()
  private _allTests?: Test[] = undefined;
  @state()
  private _expandedTests?: Test[] = undefined;
  @state()
  private _tests?: Test[] = undefined;

  @state()
  private _order: "shuffled" | "increasing difficulty" = "shuffled";

  @state()
  private _currentIndex: number = 0;
  @state()
  private _currentTest?: Test = undefined;

  @query('#test-card')
  // @ts-ignore
  private _testCard: KMapTestCard;

  @property({reflect: true, type: Boolean})
  // @ts-ignore
  private wide: boolean = false;

  mapState(state: State) {
    return {
      wide: !state.shell.narrow,
      _order: state.tests.order,
      _allTests: state.tests.tests,
    };
  }

  private static repetitions(tests: Test[]) {
    const expanded: Test[] = [];
    for (const test of tests) {
      if (!test.repetitions)
        test.repetitions = 1;
      for (let i = 0; i < test.repetitions; i++)
        expanded.push(test);
    }
    return expanded;
  }


  protected willUpdate(_changedProperties: PropertyValues) {
    if ((_changedProperties.has("_allTests") && this._allTests))
      this._expandedTests = KmapTestExercise.repetitions(this._allTests);
  }

  updated(changedProperties) {
    if ((changedProperties.has("_expandedTests") || changedProperties.has("_order")) && this._expandedTests) {
      if (this._currentIndex !== 0)
        store.dispatch.shell.showMessage("Die Aufgabenreihe startet von vorne!");
      this._start();
    }
  }

  _start() {
    if (!this._expandedTests)
      return;

    for (var test of this._expandedTests) {
      // @ts-ignore
      if (test.balance === "" || test.balance === undefined)
        test.balance = 4;
    }
    const collator = new Intl.Collator();
    this._tests = this._order === "shuffled"
      ? shuffleArray([...this._expandedTests])
      : this._expandedTests.sort((a, b) =>
        (a.level ? a.level : 4) - (b.level ? b.level : 4)
        || collator.compare(a.key, b.key));

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
      this._testCard.init();
    }
    else
      this.dispatchEvent(new CustomEvent('end', {bubbles: true, composed: true}));
  }

  static get styles() {
    // language=CSS
    return [
      resetStyles,
      fontStyles,
      colorStyles,
      css`
        :host {
          display: flex;
        }
        :host([wide]) kmap-test-card {
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
        .repetitions="${this._currentTest.repetitions}"
        .extern="${this._currentTest.extern}"
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
