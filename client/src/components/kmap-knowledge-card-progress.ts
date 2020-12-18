import {LitElement, html, css, customElement, property} from 'lit-element';
import {colorStyles, fontStyles} from "./kmap-styles";

@customElement('kmap-knowledge-card-progress')
export class KMapKnowledgeCardProgress extends LitElement {
  @property({type: Number})
  private progressNum: number = 0;
  @property({type: Number})
  private progressOf: number = 0;

  static get styles() {
    // language=CSS
    return [
      fontStyles,
      colorStyles,
      css`
        :host {
          display: block;
        }
        a {
          color: var(--color-opaque);
          text-decoration: none;
          font-weight: bold;
        }
        a:hover {
          text-decoration: underline;
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
