import {LitElement, html, css, PropertyValues} from 'lit';
import {customElement, property, query, state} from 'lit/decorators.js';

import {urls} from '../urls';
import {resetStyles, fontStyles, colorStyles} from "./kmap-styles";
import {katexStyles} from "../katex-css";
import {unsafeHTML} from 'lit/directives/unsafe-html.js';
import {math} from "../math";

import './dnd-assign';
import './dnd-fillin';
import {TestInteraction} from "./test-interaction";

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

  @state()
  private _question: string = '';
  @state()
  private _answer: string = '';

  @query('#question')
  // @ts-ignore
  private _questionElement: HTMLElement;
  @query('#answer')
  private _answerElement: HTMLElement;

  willUpdate(changedProperties) {
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

  protected async updated(_changedProperties: PropertyValues) {
    if (_changedProperties.has("answer") && this.answer)
      await new Promise<void>((resolve) => setTimeout(() => { this.init(); resolve() }));
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

  init() {
    var element = this._answerElement;
    var inputs = element.getElementsByTagName("input");
    for (var i = 0; i < inputs.length; i++) {
      var input: HTMLInputElement = inputs[i];
      input.removeAttribute("correctness");
      if (input.type === "checkbox")
        input.checked = false;
      else
        input.value = '';
    }
    var elements = [
      ...element.getElementsByTagName("dnd-assign"),
      ...element.getElementsByTagName("dnd-fillin"),
      ...element.getElementsByTagName("kmap-solve-tree"),
      ...element.getElementsByTagName("kmap-jsxgraph"),
    ]
    for (const element of elements) {
      const testInteraction: TestInteraction = element as unknown as TestInteraction;
      testInteraction.init();
      element.removeAttribute("correctness");
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
      input.setAttribute("correctness", correct ? "correct" : "incorrect");
    }

    var elements = [
      ...element.getElementsByTagName("dnd-assign"),
      ...element.getElementsByTagName("dnd-fillin"),
      ...element.getElementsByTagName("kmap-solve-tree"),
      ...element.getElementsByTagName("kmap-jsxgraph"),
    ]
    for (const element of elements) {
      const testInteraction: TestInteraction = element as unknown as TestInteraction;
      everythingCorrect = everythingCorrect && testInteraction.isValid();
      element.setAttribute("correctness", testInteraction.isValid() ? "correct" : "incorrect");
      testInteraction.bark();
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

      input.removeAttribute("correctness");
    }

    var elements = [
      ...element.getElementsByTagName("dnd-assign"),
      ...element.getElementsByTagName("dnd-fillin"),
      ...element.getElementsByTagName("kmap-solve-tree"),
      ...element.getElementsByTagName("kmap-jsxgraph"),
    ]
    for (const element of elements) {
      const testInteraction: TestInteraction = element as unknown as TestInteraction;
      testInteraction.showAnswer();
      element.removeAttribute("correctness");
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
      resetStyles,
      fontStyles,
      colorStyles,
      katexStyles,
      css`
        :host {
          padding: 8px 16px;
          transition: background-color .5s ease-in-out;
          display: flex;
          flex-direction: row;
          flex-wrap: wrap;
          gap: 16px;
        }
        img {
          max-width: calc(var(--content-width, 100vw) - 64px);
        }
        input {
          vertical-align: text-bottom;
          outline: 3px solid transparent;
          transition: outline-color .5s ease-in-out;
          height: 1.3em;
          border: 1px solid var(--color-mediumgray);
        }
        kmap-solve-tree, kmap-jsxgraph {
          outline: 3px solid transparent;
        }
        *[correctness=correct] {
          outline-color: var(--color-green);
        }
        *[correctness=incorrect] {
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
