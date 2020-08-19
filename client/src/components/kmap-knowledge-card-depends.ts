import {LitElement, html, css, customElement, property} from 'lit-element';
import {colorStyles, fontStyles} from "./kmap-styles";

@customElement('kmap-knowledge-card-depends')
export class KMapKnowledgeCardDepends extends LitElement {
  @property({type: String})
  private subject: string = '';
  @property({type: String})
  private chapter: string = '';
  @property({type: String})
  private depends: string[] = [];
  @property({type: Boolean})
  private chapterDepends: boolean = false;

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
    ${this.depends && this.depends.length > 0
      ? html`
          <b>Voraussetzungen:</b> ${this.depends.map((depend) => html`
            ${this.chapterDepends ? html`
              &nbsp;<a href="/app/browser/${this.subject}/${depend}" title="${(depend.includes('/') ? 'Wissenskarte ': 'Wissenslandkarte ') + depend}">${depend}</a>
            ` : html`
              &nbsp;<a href="/app/browser/${this.subject}/${this.chapter}/${depend}" title="Wissenskarte ${depend}">${depend}</a>
            `}
          `)}
        `
      : ''}
    `;
  }
}
