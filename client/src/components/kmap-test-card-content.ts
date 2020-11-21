import {LitElement, html, css, customElement, property, query} from 'lit-element';

import {urls} from '../urls';
import {fontStyles, colorStyles} from "./kmap-styles";
import {unsafeHTML} from "lit-html/directives/unsafe-html";
import {math} from "../math";
import {katexStyles} from "../katex-css";

import './dnd-assign';
import {DndAssign} from "./dnd-assign";
import './dnd-fillin';
import {DndFillin} from "./dnd-fillin";

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

  @property()
  private _question: string = '';
  @property()
  private _answer: string = '';

  @query('#question')
  // @ts-ignore
  private _questionElement: HTMLElement;
  @query('#answer')
  // @ts-ignore
  private _answerElement: HTMLElement;

  updated(changedProperties) {
    if (changedProperties.has("question")) {
      let set = (value:string):void => { this._question = value };
      this._math(this.question, set);
    }
    if (changedProperties.has("answer")) {
      let set = (value:string):void => { this._answer = value };
      this._math(this.answer, set);
    }
    if (changedProperties.has("balance"))
      this._flexes(this.balance);
  }

  _flexes(balance) {
    if (balance === undefined)
      balance = 4;
    this._questionFlex = "flex: " + balance;
    this._answerFlex = "flex: " + (6 - balance);
  }

  _math(code: string, setter) {
    if (code) {
      code = code.replace(/inline:([^"]*)/g, urls.server + "tests/" + this.subject + "/" + this.set + "/" + this.key + "/$1?instance=" + this.instance);
      code = code.replace(/<check\/>/g, "<input type='checkbox'/>");
      code = code.replace(/<text\/>/g, "<input type='text' inputmode='text'/>");
      code = code.replace(/<text ([0-9]+)\/>/g, "<input type='text' inputmode='text' maxlength='$1' style='width: $1em'/>");
      code = code.replace(/<integer\/>/g, "<input type='text' inputmode='numeric'/>");
      code = code.replace(/<integer ([0-9]+)\/>/g, "<input type='text' inputmode='numeric' maxlength='$1' style='width: $1em'/>");
      code = code.replace(/<decimal\/>/g, "<input type='text' inputmode='decimal'/>");
      code = code.replace(/<decimal ([0-9]+)\/>/g, "<input type='text' inputmode='decimal' maxlength='$1' style='width: $1em'/>");
      math(code, setter);
    }
    else
      setter("");
  }

  clear() {
    var element = this._answerElement;
    var inputs = element.getElementsByTagName("input");
    for (var i = 0; i < inputs.length; i++) {
      var input: HTMLInputElement = inputs[i];
      input.removeAttribute("correction");
      if (input.type === "checkbox")
        input.checked = false;
      else
        input.value = '';
    }
    var assigns = element.getElementsByTagName("dnd-assign");
    for (const element of assigns) {
      const assign: DndAssign = element as DndAssign;
      assign.clear();
    }
    var fillins = element.getElementsByTagName("dnd-fillin");
    for (const element of fillins) {
      const fillin: DndFillin = element as DndFillin;
      fillin.clear();
    }
  }

  checkValues(): boolean {
    var everythingCorrect = true;
    var element = this._answerElement;
    var inputs = element.getElementsByTagName("input");

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

    var assigns = element.getElementsByTagName("dnd-assign");
    for (const element of assigns) {
      const assign: DndAssign = element as DndAssign;
      everythingCorrect = everythingCorrect && assign.valid === true;
      assign.setAttribute("correction", assign.valid ? "correct" : "incorrect");
      assign.bark();
    }
    var fillins = element.getElementsByTagName("dnd-fillin");
    for (const element of fillins) {
      const fillin: DndFillin = element as DndFillin;
      everythingCorrect = everythingCorrect && fillin.valid === true;
      fillin.setAttribute("correction", fillin.valid ? "correct" : "incorrect");
      fillin.bark();
    }
    return everythingCorrect;
  }

  showAnswer() {
    var element = this._answerElement;
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

    var assigns = element.getElementsByTagName("dnd-assign");
    for (const element of assigns) {
      const assign: DndAssign = element as DndAssign;
      assign.showAnswer();
    }
    var fillins = element.getElementsByTagName("dnd-fillin");
    for (const element of fillins) {
      const fillin: DndFillin = element as DndFillin;
      fillin.showAnswer();
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
      katexStyles,
      css`
        .katex { font-size: 1.2em; }
        :host {
          padding: 12px;
          background-color: var(--color-lightest);
          transition: background-color .5s ease-in-out;
          display: flex;
          flex-direction: row;
          flex-wrap: wrap;
          font-family: Roboto,sans-serif;
          -webkit-font-smoothing: antialiased;
          font-size: 0.95rem;
          font-weight: 400;
        }
        img {
          max-width: calc(100vw - 44px);
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
      <div id="question" style="${this._questionFlex}">${unsafeHTML(this._question)}</div>
      <div id="answer" style="${this._answerFlex}">${unsafeHTML(this._answer)}</div>
    `;
  }
}
