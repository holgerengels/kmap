import {LitElement, html, css, customElement, property, query} from 'lit-element';
import {connect} from '@captaincodeman/rdx';
import {State, store} from "../store";

import {encode, urls} from '../urls';
import {STATE_COLORS} from './state-colors';
import {fontStyles, colorStyles, themeStyles} from "./kmap-styles";
import './star-rating';
import '@material/mwc-icon';
import '@material/mwc-button';
import "./kmap-feedback";
import {KMapFeedback} from "./kmap-feedback";

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

  @property({type: String})
  private _questionFlex: string = '';
  @property({type: String})
  private _answerFlex: string = '';

  @query('#question')
  // @ts-ignore
  private _question: HTMLElement;
  @query('#answer')
  // @ts-ignore
  private _answer: HTMLElement;
  @query('#blinky')
  // @ts-ignore
  private _blinky: HTMLElement;

  @query('#feedbackDialog')
  // @ts-ignore
  private _feedbackDialog: KMapFeedback;

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

  updated(changedProperties) {
    if (changedProperties.has("question"))
      this._mathQuestion(this.question);
    if (changedProperties.has("answer"))
      this._mathAnswer(this.answer);
    if (changedProperties.has("balance"))
      this._flexes(this.balance);
  }

  _flexes(balance) {
    if (balance === undefined)
      balance = 4;
    this._questionFlex = "flex: " + balance;
    this._answerFlex = "flex: " + (6 - balance);
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

  math(text, element) {
    if (text) {
      let replace = text.replace(/inline:([^"]*)/g, urls.server + "tests/" + this.subject + "/" + this.set + "/" + this.key + "/$1?instance=" + this._instance);
      replace = replace.replace(/<check\/>/g, "<input type='checkbox'/>");
      replace = replace.replace(/<text\/>/g, "<input type='text' inputmode='text'/>");
      replace = replace.replace(/<text ([0-9]+)\/>/g, "<input type='text' inputmode='text' maxlength='$1' style='width: $1em'/>");
      replace = replace.replace(/<integer\/>/g, "<input type='text' inputmode='numeric'/>");
      replace = replace.replace(/<integer ([0-9]+)\/>/g, "<input type='text' inputmode='numeric' maxlength='$1' style='width: $1em'/>");
      replace = replace.replace(/<decimal\/>/g, "<input type='text' inputmode='decimal'/>");
      replace = replace.replace(/<decimal ([0-9]+)\/>/g, "<input type='text' inputmode='decimal' maxlength='$1' style='width: $1em'/>");

      // @ts-ignore
      window.MathJaxLoader
        .then(() => {
          let buffer = "";
          let t = false;
          replace.split("`").reverse().forEach(function (element) {
            if (t) {
              // @ts-ignore
              buffer = " " + window.MathJax.asciimath2svg(element).getElementsByTagName("svg")[0].outerHTML + " " + buffer;
            } else
              buffer = element + buffer;
            t = !t;
          });
          element.innerHTML = buffer;
        });
    }
    else
      element.innerHTML = "";
  }

  _mathQuestion(text) {
    this.math(text, this._question);
  }

  _mathAnswer(text) {
    this.math(text, this._answer);
  }

  clear() {
    var element = this._answer;
    var inputs = element.getElementsByTagName("input");
    for (var i = 0; i < inputs.length; i++) {
      var input: HTMLInputElement = inputs[i];
      input.removeAttribute("correction");
      if (input.type === "checkbox")
        input.checked = false;
      else
        input.value = '';
    }
    this.correct = false;
    this.sent = false;
    this.attempts = 0;
  }

  sendAnswer() {
    var element = this._answer;
    var inputs = element.getElementsByTagName("input");
    var everythingCorrect = true;

    for (var i = 0; i < inputs.length; i++) {
      var input = inputs[i];
      var value = "" + (input.type === "checkbox" ? input.checked : input.value);
      if (value) {
        value = value.replace(/ /g, "");
        value = value.replace(/²/g, "^2");
        value = value.replace(/³/g, "^3");
        value = value.replace(/·/g, "*");
      }

      var expected = this.values[i];
      if (expected) {
        expected = expected.replace(/ /g, "");
        expected = expected.replace(/²/g, "^2");
        expected = expected.replace(/³/g, "^3");
        expected = expected.replace(/·/g, "*");
      }
      var correct = value == expected;
      everythingCorrect = everythingCorrect && correct;
      input.setAttribute("correction", correct ? "correct" : "incorrect");
    }
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
    var element = this._answer;
    var inputs = element.getElementsByTagName("input");

    for (var i = 0; i < inputs.length; i++) {
      var input = inputs[i];
      var expected = this.values[i];

      if (input.type === "checkbox")
        input.checked = expected === "true";
      else
        input.value = expected;

      input.removeAttribute("correction");
    }
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
      themeStyles,
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
        .card-header[hidden] {
          display: none;
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
        .card-content {
          padding: 12px;
          background-color: var(--color-lightest);
          transition: background-color .5s ease-in-out;
          display: flex;
          flex-direction: row;
          flex-wrap: wrap;
        }
        .card-content img {
          max-width: calc(100vw - 44px);
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
        #question {
          margin-right: 16px;
        }

        [hidden] {
          display: none !important;
        }

        input {
          margin: 0.5em;
          outline: 3px solid transparent;
          transition: outline-color .5s ease-in-out;
          height: 1.3em;
        }
        input[correction=correct] {
          outline-color: var(--color-green);
        }
        input[correction=incorrect] {
          outline-color: var(--color-red);
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
      <a href="/app/browser/${encode(this.subject, this.chapter, this.topic)}" target="_blank" id="blinky">Wissenskarte ansehen <mwc-icon>open_in_new</mwc-icon></a>&nbsp;
      <mwc-icon-button icon="feedback" title="Feedback" @click="${this._feedback}"></mwc-icon-button>
  </div>
  <div class="card-content">
      <div id="question" style="${this._questionFlex}"></div>
      <div id="answer" style="${this._answerFlex}"></div>
  </div>
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
