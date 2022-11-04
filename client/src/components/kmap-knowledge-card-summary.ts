import {LitElement, html, css} from 'lit';
import {customElement, property} from 'lit/decorators.js';
import {resetStyles, colorStyles, fontStyles} from "./kmap-styles";

@customElement('kmap-knowledge-card-summary')
export class KMapKnowledgeCardSummary extends LitElement {

  @property({type: String})
  private summary: string = '';

  static get styles() {
    // language=CSS
    return [
      resetStyles,
      fontStyles,
      colorStyles,
      css`
        :host {
          display: block;
        }
      `
    ];
  }

  render() {
    return html`${this.summary}`;
  }
}
