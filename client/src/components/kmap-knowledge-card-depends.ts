import {LitElement, html, css, customElement, property} from 'lit-element';
import {colorStyles, fontStyles} from "./kmap-styles";
import {encode} from "../urls";

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
        }
        a:not(:last-child):after {
            content: ", ";
        }
      `
    ];
  }

  render() {
    return this.dependencies && this.dependencies.length > 0
      ? html`
        <b>Voraussetzungen:</b> ${this.dependencies.map((depend) => html`
          <a href="/app/browser/${encode(this.subject, ...depend.split('/'))}" title="${(depend.includes('/') ? 'Wissenskarte ': 'Wissenslandkarte ') + depend}">${depend.replace(/\//, " → ")}</a>
        `)}
      ` : ''
    ;
  }
}
