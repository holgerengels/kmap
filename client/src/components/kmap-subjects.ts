import {html, css, customElement, property} from 'lit-element';
import {Connected} from "./connected";
import {State} from "../store";

import {colorStyles, fontStyles} from "./kmap-styles";
import '@material/mwc-icon-button';
import '@material/mwc-icon-button-toggle';
import '@material/mwc-top-app-bar';
import './kmap-login-button';
import './kmap-subject-card';
import './kmap-randomtest-card';
import {Test} from "../models/tests";
import {Subject} from "../models/subjects";
import {Card} from "../models/types";

@customElement('kmap-subjects')
export class KMapSubjects extends Connected {
  @property()
  private _subjects: Subject[] = [];
  @property()
  private _randomTests?: Test[] = undefined;
  @property()
  private _latestCards?: Card[] = undefined;
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
      this._currentTest = this._randomTests ? this._randomTests[0] : undefined;
    }
    if (changedProperties.has("_index")) {
      this._currentTest = this._randomTests ? this._randomTests[this._index] : undefined;
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
      css`
        :host {
          display: flex;
          flex-direction: column;
          padding: 8px 8px;
        }
        :host > * {
          margin-top: 8px;
          margin-bottom: 8px;
        }
        .title {
          color: var(--color-darkgray);
          margin: 0px 8px;
        }
        .cards {
          display: flex;
          flex-flow: row wrap;
        }
        .cards > * {
          margin: 8px;
        }
      `];
  }

  render() {
    // language=HTML
    return html`
        <div class="title font-body">
          <p style="color: var(--color-mediumgray)">
            KMap kartographiert Wissen auf übersichtlichen Wissenslandkarten. So kann man sofort erkennen, wie alles
            zusammenhängt und wo welches Wissen vorausgesetzt wird. Durch Einfärben der Wissenskarten kann man seinen
            Lernfortschritt sichtbar machen. So weiß man immer, wo man steht.
          </p>
        </div>
        <div class="title">
            <label>Wähle ein Fach!</label>
        </div>

        <div class="cards">
          ${this._subjects.map((subject) => html`
              <kmap-subject-card .subject="${subject}"></kmap-subject-card>
          `)}
        </div>

        ${this._latestCards ? html`
          <div class="title">
            <label style="line-height: 200%">Neueste Änderungen</label><br/>
            <label secondary>.. von Wissenskarten aus allen Bereichen ..</label>
          </div>
          <div class="cards">
            ${this._latestCards.map((card) => html`
              <kmap-summary-card .subject="${card.subject}" .chapter="${card.chapter}" .card="${card}" key="${card.topic}"></kmap-summary-card>
            `)}
          </div>
        `: ''}

        ${this._currentTest ? html`
          <div class="title">
            <label style="line-height: 200%">Teste Dein Wissen!</label><br/>
            <label secondary>.. anhand dreier zufällig ausgewählter Aufgaben ..</label>
          </div>

          <div class="cards">
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
          </div>
        ` : '' }
`;}
}
