import {html, css} from 'lit';
import {customElement, property, query} from 'lit/decorators.js';
import {Connected, store} from "./connected";
import {State} from "../store";

import {encodePath} from '../urls';
import {fontStyles, colorStyles} from "./kmap-styles";
import '@material/mwc-icon';
import '@material/mwc-button';
import "./kmap-card";
import "./kmap-test-card-content";
import "./kmap-test-card-hint";
import "./kmap-test-card-solution";
import "./kmap-feedback";
import {KMapTestCardContent} from "./kmap-test-card-content";
import {KMapFeedback} from "./kmap-feedback";

@customElement('kmap-exercise-card')
export class KMapRandomTestCard extends Connected {
  @property({type: String})
  private _instance: string = '';
  @property({type: String})
  private _userid: string = '';

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
  private repetitions: number = 1;
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

  @query('kmap-test-card-content')
  private _content: KMapTestCardContent;

  @query('#blinky')
  // @ts-ignore
  private _blinky: HTMLElement;

  @query('#feedbackDialog')
  // @ts-ignore
  private _feedbackDialog: KMapFeedback;

  mapState(state: State) {
    return {
      _instance: state.app.instance,
    };
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

  init() {
    this._content.init();
  }

  _sendAnswer() {
    var everythingCorrect = this._content.checkValues();
    if (!everythingCorrect) {
      this._blinky.addEventListener("animationend", () => {
        this._blinky.className = '';
      });
      this._blinky.className = "blink";
    }
  }

  _showAnswer() {
    this._content.showAnswer();
  }

  _card() {
    store.dispatch.routing.push("/app/" + encodePath("browser", this.subject, this.chapter, this.topic));
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
          display: flex;
        }
        kmap-card {
          background-color: white;
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
            transform: scale(1.1);
            color: var(--color-secondary-dark)
          }
        }
      `];
  }

  render() {
    // language=HTML
    return html`
      <kmap-card header="${this.chapter} → ${this.topic} (${this._levelText(this.level)})">
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

        <mwc-button slot="button" ?hidden="${this.repetitions === 1}" @click="${this.init}">Neue Aufgabe</mwc-button>
        <mwc-button slot="button" @click="${this._showAnswer}">Antwort zeigen</mwc-button>
        <mwc-button slot="button" @click="${this._sendAnswer}">Antwort Abschicken</mwc-button>

        <mwc-icon-button slot="icon" icon="info" title="Wissenskarte" @click="${this._card}" id="blinky"></mwc-icon-button>
        <mwc-icon-button slot="icon" icon="feedback" title="Feedback" @click="${this._feedback}"></mwc-icon-button>
      </kmap-card>

      <kmap-feedback id="feedbackDialog" .subject="${this.subject}" .chapter="${this.chapter}" .topic="${this.topic}" .test="${this.key}"></kmap-feedback>
    `;
  }
}
