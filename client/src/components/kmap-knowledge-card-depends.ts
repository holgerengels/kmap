import {LitElement, html, css, customElement, property} from 'lit-element';
import {colorStyles, fontStyles} from "./kmap-styles";

@customElement('kmap-knowledge-card-depends')
export class KMapKnowledgeCardDepends extends LitElement {
  @property({type: String})
  private subject: string = '';
  @property({type: String})
  private dependencies: string[] = [];

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
        a:not(:last-child):after {
            content: ", ";
        }
      `
    ];
  }

  render() {
    return html`
    ${this.dependencies && this.dependencies.length > 0
      ? html`
          <b>Voraussetzungen:</b> ${this.dependencies.map((depend) => html`
              &nbsp;<a href="/app/browser/${this.subject}/${depend}"
              title="${(depend.includes('/') ? 'Wissenskarte ': 'Wissenslandkarte ') + depend}">${depend.replace(/\//, " → ")}</a>
          `)}
        `
      : ''}
    `;
  }
}
