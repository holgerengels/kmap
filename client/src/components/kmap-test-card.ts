import {html, css} from 'lit';
import {customElement, property, query} from 'lit/decorators.js';
import {Connected} from "./connected";
import {State, store} from "../store";

import {encodePath} from '../urls';
import {resetStyles, fontStyles, colorStyles} from "./kmap-styles";
import '@material/mwc-icon';
import '@material/mwc-button';
import "./kmap-card";
import "./kmap-test-card-content";
import "./kmap-test-card-hint";
import "./kmap-test-card-solution";
import "./kmap-feedback";
import {KMapTestCardContent} from "./kmap-test-card-content";
import {KMapFeedback} from "./kmap-feedback";
import {by} from "./icons";
import {ifDefined} from "lit/directives/if-defined.js";

@customElement('kmap-test-card')
export class KMapTestCard extends Connected {
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
  @property({type: String})
  private author: string = '';
  @property({type: Number})
  private num: number = 0;
  @property({type: Number})
  private of: number = 0;
  @property({type: Number})
  private repetitions: number = 1;
  @property({type: Boolean})
  private extern: boolean = false;
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
  private _content!: KMapTestCardContent;

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

  init() {
    this._content.init();
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

  _compareAnswer() {
    this._content.showAnswer();
    this.correct = true;
    this.sent = true;
    this.attempts = 0;

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

  _card() {
    store.dispatch.routing.push("/app/" + encodePath("browser", this.subject, this.chapter, this.topic));
  }

  _feedback() {
    if (this._userid)
      this._feedbackDialog.show();
    else
      store.dispatch.shell.showMessage("Bitte melde Dich an, um die Feedbackfunktion zu nutzen!")
  }

  _permalink() {
    navigator.clipboard.writeText(window.location.origin + "/app/" + encodePath("exercise", this.subject, this.chapter, this.topic, this.key))
      .then(
        () => store.dispatch.shell.showMessage("Link wurde kopiert"),
        () => store.dispatch.shell.showMessage("Link konnte nicht kopiert werden")
      );
  }

  _share() {
    // @ts-ignore
    navigator.share({
      title: "KMap Aufgabe",
      text: this.chapter + " - " + this.topic,
      url: window.location.origin + "/app/" + encodePath("exercise", this.subject, this.chapter, this.topic, this.key),
    })
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
      resetStyles,
      fontStyles,
      colorStyles,
      css`
        :host {
          width: 100%;
          display: flex;
        }
        kmap-card {
          width: 100%;
          max-width: 800px;
          background-color: white;
        }
        [hidden] {
          display: none !important;
        }

        .blink {
          animation: blinker .25s ease-in-out 2;
        }
        @keyframes blinker {
          70% {
            text-shadow: 1px 1px 4px var(--color-darkgray);
            transform: scale(1.1);
            color: var(--color-secondary-dark)
          }
        }
        a[slot=teaser] { text-decoration: none }
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
        <kmap-test-card-hint
          .instance="${this._instance}"
          .subject="${this.subject}"
          .set="${this.set}"
          .key="${this.key}"
          .hint="${this.hint}"
           ?hidden="${!this.hintVisible}">
        </kmap-test-card-hint>

        <kmap-card-divider ?hidden="${!this.solutionVisible}"></kmap-card-divider>
        <kmap-test-card-solution
          .instance="${this._instance}"
          .subject="${this.subject}"
          .set="${this.set}"
          .key="${this.key}"
          .solution="${this.solution}"
           ?hidden="${!this.solutionVisible}">
        </kmap-test-card-solution>

        ${this.author ? html`
          <a slot="teaser" rel="author" href="https://kmap.eu/app/browser/Hilfe/Autoren/${this.author}" title="${ifDefined(this.author ? 'CC BY-SA - ' + this.author : undefined)}">${by}<span style="font-size: 0">${this.author}</span></a>
        ` : ''}

        <mwc-button slot="button" ?hidden="${this.repetitions === 1}" @click="${this.init}">Neue Aufgabe</mwc-button>
        <mwc-button slot="button" @click="${this._showAnswer}" ?hidden="${this.extern}">Antwort zeigen</mwc-button>
        <mwc-button slot="button" @click="${this._compareAnswer}" ?hidden="${!this.extern}">Antwort vergleichen</mwc-button>
        <mwc-button slot="button" @click="${this._showHint}" ?hidden="${!this.hint}">Tipp</mwc-button>
        <mwc-button slot="button" @click="${this._sendAnswer}" ?hidden="${this.sent || this.extern}">Antwort abschicken</mwc-button>
        <mwc-button slot="button" @click="${this._next}" ?hidden="${!this.correct}">Weiter</mwc-button>
        <mwc-icon-button slot="icon" icon="info" title="Wissenskarte" @click="${this._card}" id="blinky"></mwc-icon-button>
        <mwc-icon-button slot="icon" icon="feedback" title="Feedback" aria-haspopup="dialog" @click="${this._feedback}"></mwc-icon-button>
        <mwc-icon-button slot="icon" icon="share" title="Teilen..." ?hidden="${typeof navigator['share'] !== 'function'}" @click="${this._share}"></mwc-icon-button>
        <mwc-icon-button slot="icon" icon="link" title="Permalink" ?hidden="${typeof navigator['share'] === 'function'}" @click="${this._permalink}"></mwc-icon-button>
      </kmap-card>

      ${this._userid ? html`<kmap-feedback id="feedbackDialog" .subject="${this.subject}" .chapter="${this.chapter}" .topic="${this.topic}" .test="${this.key}"></kmap-feedback>` : ''}
    `;
  }
}
