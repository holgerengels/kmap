import {LitElement, html, css, customElement, property} from 'lit-element';
import {colorStyles, fontStyles} from "./kmap-styles";

@customElement('kmap-knowledge-card-summary')
export class KMapKnowledgeCardSummary extends LitElement {

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
          padding: 12px;
          font-family: Roboto,sans-serif;
          -webkit-font-smoothing: antialiased;
          font-size: 0.95rem;
          font-weight: 400;
        }
      `
    ];
  }

  render() {
    return html`${this.summary}`;
  }
}
