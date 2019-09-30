import { LitElement, html, css } from 'lit-element';
import {colorStyles, fontStyles} from "./kmap-styles";

class KMapKnowledgeCardProgress extends LitElement {
  static get styles() {
    // language=CSS
    return [
      fontStyles,
      colorStyles,
      css`
:host {
  display: block;
  padding: 12px;
  transition: background-color .5s ease-in-out;
}
img {
  max-width: calc(100vw - 44px);
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

  static get properties() {
    return {
      progressNum: {type: String},
      progressOf: {type: String},
    };
  }

  constructor() {
    super();
    this.progressNum = 0;
    this.progressOf = 0;
  }
}

window.customElements.define('kmap-knowledge-card-progress', KMapKnowledgeCardProgress);
