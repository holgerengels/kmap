import {LitElement, html, css} from 'lit';
import {customElement, property} from 'lit/decorators.js';
import {resetStyles, colorStyles, fontStyles} from "./kmap-styles";

@customElement('kmap-knowledge-card-progress')
export class KMapKnowledgeCardProgress extends LitElement {
  @property({type: Number})
  private progressNum: number = 0;
  @property({type: Number})
  private progressOf: number = 0;

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
    return html`
        <b>Fortschritt:</b>
        ${this.progressNum} / ${this.progressOf} bearbeitet
        <br/><br/>
    `;
  }
}
