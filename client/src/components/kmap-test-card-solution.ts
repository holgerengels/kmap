import {LitElement, html, css} from 'lit';
import {customElement, property, state} from 'lit/decorators.js';

import {resetStyles, fontStyles, colorStyles, contentStyles} from "./kmap-styles";
import {unsafeHTML} from 'lit/directives/unsafe-html.js';
import {math} from "../math";
import {katexStyles} from "../katex-css";
import {urls} from "../urls";

@customElement('kmap-test-card-solution')
export class KMapTestCardsolution extends LitElement {
  @property({type: String})
  private instance: string = '';

  @property({type: String})
  private subject: string = '';
  @property({type: String})
  private set: string = '';
  @property({type: String})
  private key: string = '';

  @property({type: String})
  private solution: string = '';
  @state()
  private _solution: string = '';

  willUpdate(changedProperties) {
    if (changedProperties.has("solution")) {
      this._solution = this._math(this.solution);
    }
  }

  _math(code: string) {
    if (code) {
      code = code.replace(/inline:([^"]*)/g, urls.server + "tests/" + this.subject + "/" + this.set + "/" + this.key + "/$1?instance=" + this.instance);
      code = math(code);
      return code;
    }
    else
      return '';
  }

  static get styles() {
    // language=CSS
    return [
      resetStyles,
      fontStyles,
      colorStyles,
      katexStyles,
      contentStyles,
      css`
        :host {
          display: contents;
        }
        #solution {
          padding: 8px 16px 0px 16px;
        }
        slot {
          display: flex;
          justify-content: flex-end;
        }
      `];
  }

  render() {
    return html`
      <div id="solution">
        <p>${unsafeHTML(this._solution)}</p>
        <slot></slot>
      </div>
    `;
  }
}
