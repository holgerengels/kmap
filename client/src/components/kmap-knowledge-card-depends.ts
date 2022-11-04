import {LitElement, html, css} from 'lit';
import {customElement, property} from 'lit/decorators.js';
import {resetStyles, colorStyles, fontStyles} from "./kmap-styles";
import {encodePath} from "../urls";

@customElement('kmap-knowledge-card-depends')
export class KMapKnowledgeCardDepends extends LitElement {
  @property({type: String})
  private subject: string = '';
  @property({type: String})
  private dependencies: string[] = [];

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
          <a href="/app/browser/${encodePath(this.subject, ...depend.split('/'))}" title="${(depend.includes('/') ? 'Wissenskarte ': 'Wissenslandkarte ') + depend}">${depend.replace(/\//, " → ")}</a>
        `)}
      ` : ''
    ;
  }
}
