import {LitElement, html, css} from 'lit';
import {customElement, property} from 'lit/decorators.js';
import {resetStyles, colorStyles, fontStyles} from "./kmap-styles";
import {Skill} from "../models/types";

@customElement('kmap-knowledge-card-skills')
export class KMapKnowledgeCardSkills extends LitElement {
  @property({type: Object})
  private skills: Skill[] = [];

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
          padding: 1px 8px 0px 8px;
          margin: 0px 8px 3px 0px;
          border-radius: 4px;
          background-color: var(--color-primary);
          color: white;
          font-size: 80%;
          font-weight: 600;
        }
      `
    ];
  }

  render() {
    return this.skills && this.skills.length > 0
      ? html`
        <b>Kompetenzcheck</b><br/>
        ${this.skills.map((skill) => html`
          <abbr>${skill.tag || '??'}</abbr><span>${skill.text}</span><br/>
        `)}
      ` : ''
    ;
  }
}
