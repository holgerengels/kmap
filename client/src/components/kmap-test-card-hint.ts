import {LitElement, html, css, customElement, property} from 'lit-element';

import {fontStyles, colorStyles, elevationStyles} from "./kmap-styles";
import {unsafeHTML} from "lit-html/directives/unsafe-html";
import {math} from "../math";

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
      elevationStyles,
      css`
        :host {
          display: contents;
        }
        #hint {
          padding: 12px 12px 4px 12px;
          background-color: white;
        }
        slot {
          display: flex;
          justify-content: flex-end;
        }
      `];
  }

  render() {
    return html`
      <div id="hint" class="elevation-02">
        <div>${unsafeHTML(this._hint)}</div>
        <slot></slot>
      </div>
    `;
  }
}
