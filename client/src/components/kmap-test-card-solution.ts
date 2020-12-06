import {LitElement, html, css, customElement, property} from 'lit-element';

import {fontStyles, colorStyles, elevationStyles} from "./kmap-styles";
import {unsafeHTML} from "lit-html/directives/unsafe-html";
import {math} from "../math";
import {katexStyles} from "../katex-css";

@customElement('kmap-test-card-solution')
export class KMapTestCardsolution extends LitElement {
  @property({type: String})
  private solution: string = '';
  @property()
  private _solution: string = '';

  updated(changedProperties) {
    if (changedProperties.has("solution")) {
      let set = (value:string):void => { this._solution = value };
      this._math(this.solution, set);
    }
  }

  _math(code, setter) {
    if (code) {
      math(code, setter);
    }
    else
      setter("");
  }

  static get styles() {
    // language=CSS
    return [
      fontStyles,
      colorStyles,
      katexStyles,
      elevationStyles,
      css`
        :host {
          display: contents;
        }
        #solution {
          padding: 8px 16px 0px 16px;
          font-size: .875rem;
          line-height: 1.25rem;
          font-weight: 400;
          letter-spacing: .0178571429em;
          color: var(--color-darkgray);
        }
      `];
  }

  render() {
    return html`
      <div id="solution">
        <div>${unsafeHTML(this._solution)}</div>
        <slot></slot>
      </div>
    `;
  }
}
