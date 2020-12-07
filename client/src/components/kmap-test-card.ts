import {LitElement, html, css, customElement, property, query} from 'lit-element';
import {connect} from '@captaincodeman/rdx';
import {State, store} from "../store";

import {encode} from '../urls';
import {fontStyles, colorStyles} from "./kmap-styles";
import '@material/mwc-icon';
import '@material/mwc-button';
import "./kmap-card";
import "./kmap-test-card-content";
import "./kmap-test-card-hint";
import "./kmap-test-card-solution";
import "./kmap-feedback";
import {KMapFeedback} from "./kmap-feedback";
import {KMapTestCardContent} from "./kmap-test-card-content";

@customElement('kmap-test-card')
export class KMapTestCard extends connect(store, LitElement) {
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
  private num: number = 0;
  @property({type: Number})
  private of: number = 0;
  @property({type: Number})
  private level: number = 0;
  @property({type: String})
  private question: string = '';
  @property({type: String})
  private answer: string = '';
  @property({type: String})
  private hint: string = '';
  @property({type: String})
  private solution: string = '';
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

  @query('#blinky')
  // @ts-ignore
  private _blinky: HTMLElement;

  @query('#feedbackDialog')
  // @ts-ignore
  private _feedbackDialog: KMapFeedback;

  @query('kmap-test-card-content')
  private _content: KMapTestCardContent;

  @property({type: Boolean, reflect: true})
  private hintVisible: boolean = false;
  @property({type: Boolean, reflect: true})
  private solutionVisible: boolean = false;

  mapState(state: State) {
    return {
      _instance: state.app.instance,
      _userid: state.app.userid,
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

  clear() {
    this._content.clear();
    this.correct = false;
    this.sent = false;
    this.attempts = 0;
  }

  _sendAnswer() {
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

  _showAnswer() {
    this._content.showAnswer();
    this.correct = true;
    this.sent = true;
    this.attempts = -1;

    if (this.solution) {
      this.solutionVisible = true;
      this.hintVisible = false;
    }
  }

  _next() {
    this.hintVisible = false;
    this.solutionVisible = false;
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

  _showHint() {
    this.hintVisible = true;
    this.solutionVisible = false;
  }
  _hideHint() {
    this.hintVisible = false;
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
          max-width: 800px;
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
          }
        }
      `];
  }

  render() {
    // language=HTML
    return html`
      <kmap-card header="Aufgabe ${this.num + 1} von ${this.of} (${this._levelText(this.level)})">
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

        <kmap-card-divider ?hidden="${!this.hintVisible}"></kmap-card-divider>
        <kmap-test-card-hint .hint="${this.hint}" ?hidden="${!this.hintVisible}"></kmap-test-card-hint>

        <kmap-card-divider ?hidden="${!this.solutionVisible}"></kmap-card-divider>
        <kmap-test-card-solution .solution="${this.solution}" ?hidden="${!this.solutionVisible}"></kmap-test-card-solution>

        <mwc-button slot="button" @click="${this._showAnswer}">Antwort zeigen</mwc-button>
        <mwc-button slot="button" @click="${this._showHint}" ?hidden="${!this.hint}">Tipp</mwc-button>
        <mwc-button slot="button" @click="${this._sendAnswer}" ?hidden="${this.sent}">Antwort abschicken</mwc-button>
        <mwc-button slot="button" @click="${this._next}" ?hidden="${!this.correct}">Weiter</mwc-button>
        <a slot="icon" href="/app/browser/${encode(this.subject, this.chapter, this.topic)}" id="blinky"><mwc-icon title="Wissenskarte">help_outline</mwc-icon></a>&nbsp;
        <mwc-icon-button slot="icon" icon="feedback" title="Feedback" @click="${this._feedback}"></mwc-icon-button>
      </kmap-card>

      <kmap-feedback id="feedbackDialog" .subject="${this.subject}" .chapter="${this.chapter}" .topic="${this.topic}" .test="${this.key}"></kmap-feedback>
    `;
  }
}
