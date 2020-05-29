import {LitElement, html, css, customElement, property} from 'lit-element';
import { connect } from '@captaincodeman/rdx';
import {State, store} from "../store";

import {colorStyles, fontStyles, themeStyles} from "./kmap-styles";
import '@material/mwc-icon-button';
import '@material/mwc-top-app-bar';
import './kmap-login-button';
import './kmap-subject-card';
import './kmap-randomtest-card';
import {Random, Test} from "../models/tests";
import {Latest} from "../models/maps";


@customElement('kmap-subjects')
export class KMapSubjects extends connect(store, LitElement) {
  @property()
  private _subjects: string[] = [];
  @property()
  private _randomTests?: Random = undefined;
  @property()
  private _latestCards?: Latest = undefined;
  @property()
  private _currentTest?: Test;
  @property()
  private _index: number = 0;

  mapState(state: State) {
    return {
      _subjects: state.subjects.subjects,
      _randomTests: state.tests.random,
      _latestCards: state.maps.latest,
    };
  }

  updated(changedProperties) {
    if (changedProperties.has("_randomTests")) {
      this._index = 0;
      this._currentTest = this._randomTests !== undefined ? this._randomTests.tests[0] : undefined;
    }
    if (changedProperties.has("_index")) {
      this._currentTest = this._randomTests !== undefined ? this._randomTests.tests[this._index] : undefined;
    }
  }

  _next() {
    this._index++;
  }

  static get styles() {
    // language=CSS
    return [
      fontStyles,
      colorStyles,
      themeStyles,
      css`
        :host {
          display: contents;
        }
        .board {
          height: auto;
          outline: none;
          padding: 8px;
          padding-bottom: 36px;
        }
        .title {
          margin: 0px 0px 8px 6px;
          padding: 4px 0px;
          color: var(--color-darkgray);
        }
        kmap-subject-card {
          display: inline-block;
          margin-bottom: 16px;
          vertical-align: top;
        }
        kmap-randomtest-card {
          margin-left: 6px;
          display: block;
          margin-bottom: 16px;
        }
        .scrollpane {
          display: flex;
          -webkit-overflow-scrolling: touch;
          outline: none;
          overflow-x: scroll;
          margin-top: 2px;
        }
        .scrollpane:hover::-webkit-scrollbar-thumb {
          background-color: var(--color-mediumgray);
        }
        .scrollpane::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .scrollpane::-webkit-scrollbar-thumb {
          transition: background-color;
          border-radius: 10px;
        }
      `];
  }

  render() {
    // language=HTML
    return html`
      <main id="content" class="board" tabindex="0">
        <div class="title">
            <label>Wähle ein Fach!</label>
        </div>
        ${this._subjects.map((subject) => html`
            <kmap-subject-card .subject="${subject}"></kmap-subject-card>
        `)}

        ${this._currentTest ? html`
          <div class="title">
            <label style="line-height: 200%">Teste Dein Wissen!</label><br/>
            <span>.. anhand dreier zufällig ausgewählter Aufgaben ..</label>
          </div>

          <kmap-randomtest-card @next="${this._next}"
            .subject="${this._currentTest.subject}"
            .set="${this._currentTest.set}"
            .chapter="${this._currentTest.chapter}"
            .topic="${this._currentTest.topic}"
            .key="${this._currentTest.key}"
            .level="${this._currentTest.level}"
            .question="${this._currentTest.question}"
            .answer="${this._currentTest.answer}"
            .values="${this._currentTest.values}"
            .balance="${this._currentTest.balance}"
            .last="${this._index === 2}"></kmap-randomtest-card>
        ` : ''}

        ${ this._latestCards && this._latestCards.cards ? html`
        <div class="title">
            <label>Neueste Änderungen</label>
        </div>
          <div class="scrollpane">
            ${this._latestCards.cards.map((card) => html`
              <kmap-summary-card .subject="${card.subject}" .chapter="${card.chapter}" .card="${card}" key="${card.topic}"></kmap-summary-card>
            `)}
          </div>
        `: ''}
      </main>
`;}
}
