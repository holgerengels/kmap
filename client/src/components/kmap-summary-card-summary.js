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
:host {
  display: block;
  padding: 8px;
  background-color: var(--color-lightest);
  transition: background-color .5s ease-in-out;
    font-family: Roboto,sans-serif;
    -webkit-font-smoothing: antialiased;
    font-size: 0.95rem;
    font-weight: 500;
}
span {
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
      <span>${this.summary}</span>
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
}

window.customElements.define('kmap-summary-card-summary', KMapSummaryCardSummary);
