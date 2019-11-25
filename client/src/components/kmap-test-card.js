import {LitElement, html, css} from 'lit-element';
import {connect} from "pwa-helpers/connect-mixin";
import {store} from "../store";
import {config} from '../config';
import {STATE_COLORS} from './state-colors';
import {fontStyles, colorStyles} from "./kmap-styles";
import './star-rating';
import '@material/mwc-icon';
import '@material/mwc-button';

class KMapTestCard extends connect(store)(LitElement) {

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
.card-header[hidden] {
    display: none;
}
.card-header a {
    color: white;
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
mwc-icon {
  vertical-align: middle;
  --mdc-icon-size: 1.2em;
}
      `];
  }

  render() {
    return html`
  <div class="card-header" ?hidden="${this.hideHeader}">
      <span>Aufgabe ${this.num + 1} von ${this.of} (${this._levelText()})</span>
      <div style="flex: 1 0 auto"></div>
      <a href="#browser/${this.subject}/${this.chapter}/${this.topic}" target="_blank" id="blinky">Wissenskarte ansehen <mwc-icon>open_in_new</mwc-icon></a>
  </div>
  <div class="card-content">
      <div id="question" style="${this.questionFlex}"></div>
      <div id="answer" style="${this.answerFlex}"></div>
  </div>
  ${this.showActions ? html`
    <div class="card-footer" ?stacked="${this._narrow}">
        <mwc-button @click="${this.showAnswer}">Richtige Antwort zeigen</mwc-button>
        <div style="flex: 1 0 auto"></div>
        <mwc-button @click="${this.sendAnswer}" ?hidden="${this.sent}">Antwort abschicken</mwc-button>
        <mwc-button @click="${this.next}" ?hidden="${!this.correct}">Weiter</mwc-button>
    </div>`
      : ''}
    `;
  }

  static get properties() {
    return {
      _instance: {type: String},
      hideHeader: {type: Boolean},
      subject: {type: String},
      chapter: {type: String},
      topic: {type: String},
      num: {type: Number},
      of: {type: Number},
      level: {type: Number},
      key: {type: String},
      question: {type: String},
      answer: {type: String},
      values: {type: Array},
      showActions: {type: Boolean},
      sent: {type: Boolean},
      correct: {type: Boolean},
      attempts: {type: Number},
      questionFlex: {type: String},
      answerFlex: {type: String},
      balance: {type: Number},
      _narrow: {type: Boolean},
    };
  }

  constructor() {
    super();
    this._instance = null;
    this.hideHeader = false;
    this.sent = false;
    this.correct = false;
    this.attempts = 0;
    this.balance = 4;
    this._colorize("0");
    this._narrow = false;
  }

  _colorize(rate) {
    this._opaque = STATE_COLORS[rate][0];
    this._light = STATE_COLORS[rate][1];
    this._lightest = STATE_COLORS[rate][2];
    this.style.setProperty('--color-opaque', this._opaque);
    this.style.setProperty('--color-light', this._light);
    this.style.setProperty('--color-lightest', this._lightest);
  }

  firstUpdated() {
    this._question = this.shadowRoot.getElementById('question');
    this._answer = this.shadowRoot.getElementById('answer');
  }

  updated(changedProperties) {
    if (changedProperties.has("question"))
      this._mathQuestion(this.question);
    if (changedProperties.has("answer"))
      this._mathAnswer(this.answer);
    if (changedProperties.has("balance"))
      this._flexes(this.balance);
  }

  stateChanged(state) {
    this._instance = state.app.instance;
    this._narrow = state.app.narrow;
    console.log("narrow " + this._narrow);
  }

  _flexes(balance) {
    if (balance === undefined)
      balance = 4;
    this.questionFlex = "flex: " + balance;
    this.answerFlex = "flex: " + (6 - balance);
  }

  _levelText() {
    switch (this.level) {
      case "1":
        return "leicht";
      case "2":
        return "mittel";
      case "3":
        return "schwer";
    }
  }

  math(text, element) {
    if (text) {
      let replace = text.replace(/inline:([^"]*)/g, config.server + "data/" + this.subject + "/" + this.chapter + "/" + this.topic + "/tests/$1?instance=" + this._instance);
      replace = replace.replace(/<check\/>/g, "<input type='checkbox'/>");
      replace = replace.replace(/<text\/>/g, "<input type='text' inputmode='text'/>");
      replace = replace.replace(/<text ([0-9]+)\/>/g, "<input type='text' inputmode='text' maxlength='$1' style='width: $1em'/>");
      replace = replace.replace(/<integer\/>/g, "<input type='number' inputmode='numeric'/>");
      replace = replace.replace(/<integer ([0-9]+)\/>/g, "<input type='number' inputmode='numeric' maxlength='$1' style='width: $1em'/>");
      replace = replace.replace(/<decimal\/>/g, "<input type='number' inputmode='decimal' step='any'/>");
      replace = replace.replace(/<decimal ([0-9]+)\/>/g, "<input type='number' inputmode='decimal' step='any' maxlength='$1' style='width: $1em'/>");

      let buffer = "";
      let t = false;
      replace.split("`").reverse().forEach(function (element) {
        if (t) {
          buffer = " " + MathJax.asciimath2svg(element).getElementsByTagName("svg")[0].outerHTML + " " + buffer;
        }
        else
          buffer = element + buffer;
        t = !t;
      });
      element.innerHTML = buffer;
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
      var input = inputs[i];
      input.removeAttribute("correction");
      if (input.type === "checkbox")
        input.checked = false;
      else
        input.value = null;
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
      if (value)
        value = value.replace(/ /g, "");

      var expected = this.values[i];
      var correct = value == expected;
      everythingCorrect = everythingCorrect && correct;
      input.setAttribute("correction", correct ? "correct" : "incorrect");
    }
    this.correct = everythingCorrect;
    this.sent = this.sent || this.correct;
    this.attempts++;
    if (!everythingCorrect) {
      let blinky = this.shadowRoot.getElementById('blinky');
      blinky.addEventListener("animationend", e => {
        blinky.className = undefined;
      });
      blinky.className = "blink";
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

  next(e) {
    this.dispatchEvent(new CustomEvent('next', {
      bubbles: true, composed: true, detail: {
        "chapter": this.chapter,
        "topic": this.topic,
        "key": this.key,
        "attempts": this.attempts,
      }
    }));
  }

}

window.customElements.define('kmap-test-card', KMapTestCard);
