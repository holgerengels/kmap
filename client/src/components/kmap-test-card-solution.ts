import {LitElement, html, css, customElement, property} from 'lit-element';

import {fontStyles, colorStyles, elevationStyles} from "./kmap-styles";
import {unsafeHTML} from "lit-html/directives/unsafe-html";
import {math} from "../math";

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
      elevationStyles,
      css`
        :host {
          display: contents;
        }
        #solution {
          padding: 12px 12px 12px 12px;
          background-color: white;
        }
      `];
  }

  render() {
    return html`
      <div id="solution" class="elevation-02">
        <div>${unsafeHTML(this._solution)}</div>
        <slot></slot>
      </div>
    `;
  }
}
