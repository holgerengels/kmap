import {LitElement, html, css} from 'lit';
import {customElement, property, state} from 'lit/decorators.js';

import {fontStyles, colorStyles, elevationStyles} from "./kmap-styles";
import {unsafeHTML} from 'lit/directives/unsafe-html.js';
import {math} from "../math";
import {katexStyles} from "../katex-css";
import {urls} from "../urls";

@customElement('kmap-test-card-hint')
export class KMapTestCardHint extends LitElement {
  @property({type: String})
  private instance: string = '';

  @property({type: String})
  private subject: string = '';
  @property({type: String})
  private set: string = '';
  @property({type: String})
  private key: string = '';

  @property({type: String})
  private hint: string = '';
  @state()
  private _hint: string = '';

  willUpdate(changedProperties) {
    if (changedProperties.has("hint")) {
      let set = (value:string):void => { this._hint = value };
      this._math(this.hint, set);
    }
  }

  _math(code: string, setter) {
    if (code) {
      code = code.replace(/inline:([^"]*)/g, urls.server + "tests/" + this.subject + "/" + this.set + "/" + this.key + "/$1?instance=" + this.instance);
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
