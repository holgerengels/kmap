import {LitElement, html, css} from 'lit';
import {customElement, property} from 'lit/decorators.js';
import {unsafeHTML} from "lit/directives/unsafe-html.js";
import {resetStyles, colorStyles, fontStyles} from "./kmap-styles";

@customElement('kmap-knowledge-card-skills')
export class KMapKnowledgeCardSkills extends LitElement {

  @property({type: Object})
  private skills: string[] = [];

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
        abbr {
          padding: 0px 8px 0px 8px;
          margin: 0px 0px 3px 0px;
          border-radius: 4px;
          background-color: var(--color-primary);
          color: white;
          font-size: 80%;
          font-weight: 500;
        }
      `
    ];
  }

  render() {
    return this.skills && this.skills.length > 0
      ? html`
        <b>Kompetenzcheck</b><br/>
        ${this.skills.map((skill) => html`
          <span>${unsafeHTML(skill.replace(/\[([^\]]*)] */g, '<abbr>$1</abbr> '))}</span><br/>
        `)}
      ` : ''
    ;
  }
}
