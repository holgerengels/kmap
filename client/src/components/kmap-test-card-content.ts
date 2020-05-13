import {LitElement, html, css, customElement, property, query} from 'lit-element';

import {urls} from '../urls';
import {fontStyles, colorStyles, themeStyles} from "./kmap-styles";

@customElement('kmap-test-card-content')
export class KMapTestCardContent extends LitElement {
  @property({type: String})
  private instance: string = '';

  @property({type: String})
  private subject: string = '';
  @property({type: String})
  private set: string = '';
  @property({type: String})
  private key: string = '';
  @property({type: String})
  private question: string = '';
  @property({type: String})
  private answer: string = '';
  @property({type: Number})
  private balance: number = 4;

  @property({type: String})
  private values: string[] = [];
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

  math(text, element) {
    if (text) {
      let replace = text.replace(/inline:([^"]*)/g, urls.server + "tests/" + this.subject + "/" + this.set + "/" + this.key + "/$1?instance=" + this.instance);
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
  }

  checkValues(): boolean {
    var element = this._answer;
    var inputs = element.getElementsByTagName("input");
    var everythingCorrect = true;

    for (var i = 0; i < inputs.length; i++) {
      var input = inputs[i];
      var value = "" + (input.type === "checkbox" ? input.checked : input.value);
      if (value) {
        value = this.canonicalize(value);
      }

      var expected = this.values[i];
      if (expected) {
        expected = this.canonicalize(expected);
      }
      var correct = value == expected;
      everythingCorrect = everythingCorrect && correct;
      input.setAttribute("correction", correct ? "correct" : "incorrect");
    }
    return everythingCorrect;
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
  }

  private canonicalize(value: string) {
    value = value.replace(/ /g, "");
    value = value.replace(/²/g, "^2");
    value = value.replace(/³/g, "^3");
    value = value.replace(/·/g, "*");
    return value;
  }

  static get styles() {
    // language=CSS
    return [
      fontStyles,
      colorStyles,
      themeStyles,
      css`
        :host {
          padding: 12px;
          backgroundsssssss-color: var(--color-lightest);
          transition: background-color .5s ease-in-out;
          display: flex;
          flex-direction: row;
          flex-wrap: wrap;
        }
        .card-content img {
          max-width: calc(100vw - 44px);
        }
        .card-footer a {
          color: black;
        }
        #question {
          margin-right: 16px;
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
      `];
  }

  render() {
    return html`
      <div id="question" style="${this._questionFlex}"></div>
      <div id="answer" style="${this._answerFlex}"></div>
    `;
  }
}
