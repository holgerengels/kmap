import {LitElement, html, css, customElement, property, query} from 'lit-element';
import {connect} from '@captaincodeman/rdx';
import {State, store} from "../store";

import {encode} from '../urls';
import {STATE_COLORS} from './state-colors';
import {fontStyles, colorStyles} from "./kmap-styles";
import '@material/mwc-icon';
import '@material/mwc-button';
import "./kmap-test-card-content";
import "./kmap-feedback";
import {KMapTestCardContent} from "./kmap-test-card-content";

@customElement('kmap-randomtest-card')
export class KMapRandomTestCard extends connect(store, LitElement) {
  @property({type: String})
  private _instance: string = '';
  @property()
  private _narrow: boolean = false;

  @property({type: String})
  private key: string = '';
  @property({type: String})
  private subject: string = '';
  @property({type: String})
  private set: string = '';
  @property({type: String})
  private chapter: string = '';
  @property({type: String})
  private topic: string = '';
  @property({type: Number})
  private level: number = 0;
  @property({type: String})
  private question: string = '';
  @property({type: String})
  private answer: string = '';
  @property({type: Number})
  private balance: number = 4;
  @property()
  private last: boolean = false;

  @property({type: String})
  private values: string[] = [];

  @query('kmap-test-card-content')
  private _content: KMapTestCardContent;

  @query('#tests')
  private _tests: HTMLAnchorElement;


  constructor() {
    super();
    this._colorize("0");
  }

  mapState(state: State) {
    return {
      _instance: state.app.instance,
      _narrow: state.shell.narrow,
    };
  }

  _colorize(rate) {
    let _opaque = STATE_COLORS[rate][0];
    let _light = STATE_COLORS[rate][1];
    let _lightest = STATE_COLORS[rate][2];
    this.style.setProperty('--color-opaque', _opaque);
    this.style.setProperty('--color-light', _light);
    this.style.setProperty('--color-lightest', _lightest);
  }

  _levelText(level: number) {
    switch (level) {
      case 1:
        return "leicht";
      case 2:
        return "mittel";
      case 3:
        return "schwer";
      default:
        return "...";
    }
  }

  sendAnswer() {
    this._content.checkValues();
  }

  showAnswer() {
    this._content.showAnswer();
  }

  _next() {
    this.dispatchEvent(new CustomEvent('next', {bubbles: true, composed: true}));
  }

  _more() {
    this._tests.click();
  }

  static get styles() {
    // language=CSS
    return [
      fontStyles,
      colorStyles,
      css`
        :host {
          --color-opaque: #f5f5f5;
          --color-light: #e0e0e0;
          --color-lightest: #9e9e9e;

          display: block;
          box-sizing: border-box;
          max-width: 800px;
          border-radius: 4px;
          box-shadow: 0 2px 2px 0 rgba(0, 0, 0, 0.14),
          0 1px 5px 0 rgba(0, 0, 0, 0.12),
          0 3px 1px -2px rgba(0, 0, 0, 0.2);
          color: var(--color-darkgray);
        }

        .card-header {
          padding: 8px 12px;
          color: black;
          background-color: var(--color-opaque);
          display: flex;
          flex-direction: row;
          justify-content: space-between;
          border-top-left-radius: 4px;
          border-top-right-radius: 4px;
        }
        .card-header a {
          color: black;
        }
        .card-header mwc-icon {
          vertical-align: middle;
          --mdc-icon-size: 1.2em;
        }
        .card-footer {
          color: var(--color-darkgray);
          background-color: var(--color-light);
          transition: background-color .5s ease-in-out;
          padding: 8px 12px;
          font-size: 0px;
          line-height: 0px;
          display: flex;
          flex-direction: row;
          justify-content: space-between;
          border-bottom-left-radius: 4px;
          border-bottom-right-radius: 4px;
        }
        .card-footer[stacked] {
          flex-wrap: wrap;
        }

        [hidden] {
          display: none !important;
        }

        .blink {
          animation: blinker .2s ease-in-out 2;
        }
        @keyframes blinker {
          70% {
            text-shadow: 1px 1px 4px var(--color-darkgray);
          }
        }
      `];
  }

  render() {
    return html`
  <div class="card-header">
      <span>${this.chapter} → ${this.topic} (${this._levelText(this.level)})
      <a id="link" href="/app/browser/${encode(this.subject, this.chapter, this.topic)}"><mwc-icon>open_in_new</mwc-icon></a></span>
  </div>

  <kmap-test-card-content
    .instance="${this._instance}"
    .subject="${this.subject}"
    .set="${this.set}"
    .key="${this.key}"
    .question="${this.question}"
    .answer="${this.answer}"
    .balance="${this.balance}"
    .values="${this.values}">
  </kmap-test-card-content>

  <div class="card-footer" ?stacked="${this._narrow}">
      <mwc-button @click="${this.showAnswer}">Richtige Antwort zeigen</mwc-button>
      <div style="flex: 1 0 auto"></div>
      <mwc-button @click="${this.sendAnswer}">Antwort Abschicken</mwc-button>
      <div style="flex: 1 0 auto"></div>
      <mwc-button @click="${this._next}" ?hidden="${this.last}">Nächste Aufgabe</mwc-button>
      <mwc-button @click="${this._more}" ?hidden="${!this.last}">Mehr Aufgaben</mwc-button>
  </div>

  <a hidden id="tests" href="/app/test/${encode(this.subject, this.chapter, this.topic)}"></a>
    `;
  }
}
