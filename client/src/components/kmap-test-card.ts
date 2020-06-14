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
import {KMapFeedback} from "./kmap-feedback";
import {KMapTestCardContent} from "./kmap-test-card-content";

@customElement('kmap-test-card')
export class KMapTestCard extends connect(store, LitElement) {
  @property({type: String})
  private _instance: string = '';
  @property({type: String})
  private _userid: string = '';
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
  private num: number = 0;
  @property({type: Number})
  private of: number = 0;
  @property({type: Number})
  private level: number = 0;
  @property({type: String})
  private question: string = '';
  @property({type: String})
  private answer: string = '';
  @property({type: Number})
  private balance: number = 4;

  @property({type: String})
  private values: string[] = [];
  @property({type: Boolean})
  private sent: boolean = false;
  @property({type: Boolean})
  private correct: boolean = false;
  @property({type: Number})
  private attempts: number = 0;

  @property({type: Boolean})
  private hideHeader: boolean = false;
  @property({type: Boolean})
  private hideActions: boolean = false;

  @query('#blinky')
  // @ts-ignore
  private _blinky: HTMLElement;

  @query('#feedbackDialog')
  // @ts-ignore
  private _feedbackDialog: KMapFeedback;

  @query('kmap-test-card-content')
  private _content: KMapTestCardContent;

  constructor() {
    super();
    this._colorize("0");
  }

  mapState(state: State) {
    return {
      _instance: state.app.instance,
      _userid: state.app.userid,
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

  clear() {
    this._content.clear();
    this.correct = false;
    this.sent = false;
    this.attempts = 0;
  }

  sendAnswer() {
    var everythingCorrect = this._content.checkValues();
    this.correct = everythingCorrect;
    this.sent = this.sent || this.correct;
    this.attempts++;
    if (!everythingCorrect) {
      this._blinky.addEventListener("animationend", () => {
        this._blinky.className = '';
      });
      this._blinky.className = "blink";
    }
  }

  showAnswer() {
    this._content.showAnswer();
    this.correct = true;
    this.sent = true;
    this.attempts = -1;
  }

  next() {
    this.dispatchEvent(new CustomEvent('next', {
      bubbles: true, composed: true, detail: {
        "subject": this.subject,
        "chapter": this.chapter,
        "topic": this.topic,
        "key": this.key,
        "attempts": this.attempts,
      }
    }));
  }

  _feedback() {
    if (this._userid)
      this._feedbackDialog.show();
    else
      store.dispatch.shell.showMessage("Bitte melde Dich an, um die Feedbackfunktion zu nutzen!")
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
          color: white;
        }
        .card-header mwc-icon-button {
          color: white;
          vertical-align: middle;
          --mdc-icon-button-size: 20px;
          --mdc-icon-size: 20px;
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
        .card-footer a {
          color: black;
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
  <div class="card-header" ?hidden="${this.hideHeader}">
      <span>Aufgabe ${this.num + 1} von ${this.of} (${this._levelText(this.level)})</span>
      <div style="flex: 1 0 auto"></div>
      <a href="/app/browser/${encode(this.subject, this.chapter, this.topic)}" id="blinky">Wissenskarte ansehen <mwc-icon>open_in_new</mwc-icon></a>&nbsp;
      <mwc-icon-button icon="feedback" title="Feedback" @click="${this._feedback}"></mwc-icon-button>
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

  ${!this.hideActions ? html`
    <div class="card-footer" ?stacked="${this._narrow}">
        <mwc-button @click="${this.showAnswer}">Richtige Antwort zeigen</mwc-button>
        <div style="flex: 1 0 auto"></div>
        <mwc-button @click="${this.sendAnswer}" ?hidden="${this.sent}">Antwort abschicken</mwc-button>
        <mwc-button @click="${this.next}" ?hidden="${!this.correct}">Weiter</mwc-button>
    </div>`
      : ''}
  <kmap-feedback id="feedbackDialog" .subject="${this.subject}" .chapter="${this.chapter}" .topic="${this.topic}" .test="${this.key}"></kmap-feedback>
    `;
  }
}
