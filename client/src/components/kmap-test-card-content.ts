import {css, html, LitElement, PropertyValues} from 'lit';
import {customElement, property, query, state} from 'lit/decorators.js';
import {unsafeHTML} from 'lit/directives/unsafe-html.js';
import {urls} from '../urls';
import {colorStyles, fontStyles, resetStyles} from "./kmap-styles";
import {katexStyles} from "../katex-css";
import {math} from "../math";
import {lazyComponents} from "./lazy-components";

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

  protected willUpdate(_changedProperties) {
    if (_changedProperties.has("balance"))
      this._flexes(this.balance);
  }

  protected async updated(_changedProperties: PropertyValues) {
    if (_changedProperties.has("question")) {
      await lazyComponents(this.question);
      this._question = this._math(this.question);
    }
    if (_changedProperties.has("answer")) {
      await lazyComponents(this.answer);
      this._answer = this._math(this.answer);
      setTimeout(() => this.init());
    }
  }

  _flexes(balance) {
    if (balance === undefined)
      balance = 4;
    this._questionFlex = "flex: " + balance;
    this._answerFlex = "flex: " + (6 - balance);
  }

  _math(code: string): string {
    if (code) {
      code = code.replace(/inline:([^"]*)/g, urls.server + "tests/" + this.subject + "/" + this.set + "/" + this.key + "/$1?instance=" + this.instance);
      code = code.replace(/<check\/>/g, "<input type='checkbox'/>");
      code = code.replace(/<text\/>/g, "<input type='text' inputmode='text'/>");
      code = code.replace(/<text ([0-9]+)\/>/g, "<input type='text' inputmode='text' maxlength='$1' style='width: $1em'/>");
      code = code.replace(/<integer\/>/g, "<input type='text' inputmode='numeric'/>");
      code = code.replace(/<integer ([0-9]+)\/>/g, "<input type='text' inputmode='numeric' maxlength='$1' style='width: $1em'/>");
      code = code.replace(/<decimal\/>/g, "<input type='text' inputmode='decimal'/>");
      code = code.replace(/<decimal ([0-9]+)\/>/g, "<input type='text' inputmode='decimal' maxlength='$1' style='width: $1em'/>");
      code = math(code);
      return code;
    }
    else
      return '';
  }

  private forEachTestInteraction(fun: (testInteraction: TestInteraction) => void) {
    var element = this._answerElement;
    [
      ...element.getElementsByTagName("dnd-assign"),
      ...element.getElementsByTagName("dnd-fillin"),
      ...element.getElementsByTagName("kmap-solve-tree"),
      ...element.getElementsByTagName("kmap-jsxgraph"),
    ].forEach(element => fun(element as unknown as TestInteraction));
  }

  init() {
    var element = this._answerElement;
    var inputs = element.getElementsByTagName("input");
    for (var i = 0; i < inputs.length; i++) {
      var input: HTMLInputElement = inputs[i];
      input.removeAttribute("correctness");
      input.setAttribute("empty", "")
      if (input.type === "checkbox")
        input.checked = false;
      else
        input.value = '';
    }

    this.forEachTestInteraction((testInteraction: TestInteraction) => {
      testInteraction.init();
      testInteraction.removeAttribute("correctness");
    });
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

    this.forEachTestInteraction((testInteraction: TestInteraction) => {
      everythingCorrect = everythingCorrect && testInteraction.isValid();
      testInteraction.setAttribute("correctness", testInteraction.isValid() ? "correct" : "incorrect");
      testInteraction.bark();
    });
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

    this.forEachTestInteraction((testInteraction: TestInteraction) => {
      testInteraction.showAnswer();
      testInteraction.removeAttribute("correctness");
    });
  }

  private canonicalize(value: string) {
    value = value.replace(/ /g, "");
    value = value.replace(/²/g, "^2");
    value = value.replace(/³/g, "^3");
    value = value.replace(/·/g, "*");
    return value;
  }

  private _input(e) {
    const input = e.target;
    if (input.tagName === "INPUT") {
      if (input.type === "text")
        this.booleanAttribute(input, "empty", input.value === "");
      else if (input.type === "checkbox")
        this.booleanAttribute(input, "empty", !input.checked);
      input.removeAttribute("correctness");
    }
  }

  private booleanAttribute(element, name, bool) {
    if (bool)
      element.setAttribute(name, "")
    else
      element.removeAttribute(name)
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
          max-width: calc(var(--content-width, 100vw) - 32px);
        }
        @media (min-width: 600px) {
          img {
            max-width: calc(var(--content-width, 100vw) - 64px);
          }
        }
        input[type=checkbox] {
          vertical-align: middle;
          outline: 3px solid transparent;
          transition: outline-color .5s ease-in-out;
        }
        input[type=text] {
          vertical-align: middle;
          outline: 3px solid transparent;
          transition: outline-color .5s ease-in-out;
          height: 1.4em;
          border: 1px solid var(--color-lightergray);
          border-radius: 2px;
          padding: 2px 4px;
        }
        kmap-solve-tree, kmap-jsxgraph {
          outline: 3px solid transparent;
        }
        *[correctness=correct]:not([empty]) {
          outline-color: rgba(var(--color-green-num), .7) !important;
        }
        *[correctness=incorrect] {
          outline-color: rgba(var(--color-red-num), .7) !important;
        }
      `];
  }

  render() {
    return html`
      <div id="question" style="${this._questionFlex}" ?hidden="${this.balance === 0}">${unsafeHTML(this._question)}</div>
      <div id="answer" style="${this._answerFlex}" @input="${this._input}">${unsafeHTML(this._answer)}</div>
    `;
  }
}
