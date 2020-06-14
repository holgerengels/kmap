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
        }
      `
    ];
  }

  render() {
    return html`${this.summary}`;
  }
}
