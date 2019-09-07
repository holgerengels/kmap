import {LitElement, html, css} from 'lit-element';
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
    ${this.depends && this.depends.length > 0
      ? html`
        <div class="content">
          <b>Voraussetzungen:</b> ${this.depends.map((depend, i) => html`
            ${this.chapterDepends ? html`
              &nbsp;<a href="#browser/${this.subject}/${depend}">${depend}</a>
            ` : html`
              &nbsp;<a href="#browser/${this.subject}/${this.chapter}/${depend}">${depend}</a>
            `}
          `)}
        </div>
        `
      : ''}
    `;
  }

  static get properties() {
    return {
      subject: {type: String},
      chapter: {type: String},
      depends: {type: Array},
      chapterDepends: {type: Boolean},
    };
  }

  constructor() {
    super();
    this.subject = '';
    this.chapter = '';
    this.depends = [];
    this.chapterDepends = false;
  }
}

window.customElements.define('kmap-knowledge-card-depends', KMapKnowledgeCardDepends);
