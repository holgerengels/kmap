import {LitElement, html, css, customElement, property} from 'lit-element';
import { colorStyles, fontStyles } from "./kmap-styles";

@customElement('kmap-summary-card-summary')
export class KMapSummaryCardSummary extends LitElement {

  @property({type: String})
  private summary: string = '';

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
}
