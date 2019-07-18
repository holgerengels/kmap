import { LitElement, html, css } from 'lit-element';
import {colorStyles, fontStyles} from "./kmap-styles";

class KMapKnowledgeCardProgress extends LitElement {
  static get styles() {
    return [
      fontStyles,
      colorStyles,
      css`
.content {
  padding: 12px;
  background-color: var(--color-lightest);
  transition: background-color .5s ease-in-out;
}
.content img {
  max-width: calc(100vw - 44px);
}
.content a {
  color: var(--color-opaque);
  text-decoration: none;
  font-weight: bold;
}
.content a:hover {
   text-decoration: underline;
}
      `
    ];
  }

  render() {
    return html`
<div class="content">
  <b>Fortschritt:</b>
    ${this.progressNum} / ${this.progressOf} bearbeitet
  <br/><br/>
</div>
    `;
  }

  static get properties() {
    return {
      key: {type: String},
      progressNum: {type: String},
      progressOf: {type: String},
    };
  }

  constructor() {
    super();
    this.key = '';
    this.progressNum = 0;
    this.progressOf = 0;
  }
}

window.customElements.define('kmap-knowledge-card-progress', KMapKnowledgeCardProgress);
