import {LitElement, html, css, customElement, property} from 'lit-element';

import {fontStyles, colorStyles, elevationStyles} from "./kmap-styles";
import {unsafeHTML} from "lit-html/directives/unsafe-html";
import {math} from "../math";
import {katexStyles} from "../katex-css";

@customElement('kmap-test-card-hint')
export class KMapTestCardHint extends LitElement {
  @property({type: String})
  private hint: string = '';
  @property()
  private _hint: string = '';

  updated(changedProperties) {
    if (changedProperties.has("hint")) {
      let set = (value:string):void => { this._hint = value };
      this._math(this.hint, set);
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
        #hint {
          padding: 8px 16px 0px 16px;
          font-size: .875rem;
          line-height: 1.25rem;
          font-weight: 400;
          letter-spacing: .0178571429em;
          color: var(--color-darkgray);
        }
        slot {
          display: flex;
          justify-content: flex-end;
        }
      `];
  }

  render() {
    return html`
      <div id="hint">
        <p>${unsafeHTML(this._hint)}</p>
        <slot></slot>
      </div>
    `;
  }
}
