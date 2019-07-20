import { LitElement, html, css } from 'lit-element';
import {colorStyles, fontStyles} from "./kmap-styles";

class KMapKnowledgeCardDepends extends LitElement {
  static get styles() {
    // language=CSS
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
    ${this.depends && this.depends.length > 0
        ? html`
            <b>Voraussetzungen:</b> ${this.depends.map((depend, i) => html`
                &nbsp;<a href="#browser/${this.subject}/${this.chapter}/${depend}">${depend}</a>
            `)}
            <br/><br/>
        `
        : ''
    }
</div>
    `;
  }

  static get properties() {
    return {
      key: {type: String},
      subject: {type: String},
      chapter: {type: String},
      depends: {type: Array},
    };
  }

  constructor() {
    super();
    this.key = '';
    this.subject = '';
    this.chapter = '';
    this.depends = [];
  }
}

window.customElements.define('kmap-knowledge-card-depends', KMapKnowledgeCardDepends);
