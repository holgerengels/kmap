import { LitElement, html, css } from 'lit-element';
import {connect} from "pwa-helpers/connect-mixin";
import { colorStyles, fontStyles } from "./kmap-styles";
import {store} from "../store";

class KMapSummaryCardSummary extends connect(store)(LitElement) {
  static get styles() {
    // language=CSS
    return [
      fontStyles,
      colorStyles,
      css`
.content {
  padding: 8px;
  background-color: var(--color-lightest);
  transition: background-color .5s ease-in-out;
}
.content span {
  white-space: normal;
  hyphens: auto;
  overflow : hidden;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
}
      `
    ];
  }

  render() {
    return html`
      <div class="content">
        <span>${this.summary}</span>
      </div>
    `;
  }

  static get properties() {
    return {
      key: {type: String},
      summary: {type: String},
    };
  }

  constructor() {
    super();
    this.key = '';
    this.summary = '';
  }

/*
  _rating() {
    if (this._states && this._states.state && this._states.state.length !== 0) {
      this._state = this._getStateValue(this.key);
      this._progressNum = this._getStateValue(this.key + "*");
      this._progressOf = this._getStateValue(this.key + "#");
    }
    else {
      this._state = 0;
      this._progressNum = 0;
      this._progressOf = 0;
    }

    this.dispatchEvent(new CustomEvent('statecolor', { bubbles: true, detail: {layer: 'summary', key: this.key, state: this._state} }));
  }
 */
}

window.customElements.define('kmap-summary-card-summary', KMapSummaryCardSummary);
