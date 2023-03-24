import {LitElement, html, css} from 'lit';
import {customElement, property} from 'lit/decorators.js';
import {unsafeHTML} from "lit/directives/unsafe-html.js";
import {resetStyles, colorStyles, fontStyles} from "./kmap-styles";
import {Card} from "../models/types";

@customElement('kmap-summary-card-skills')
export class KMapSummaryCardSkills extends LitElement {

  @property()
  private card?: Card = undefined;

  static get styles() {
    // language=CSS
    return [
      resetStyles,
      fontStyles,
      colorStyles,
      css`
        :host {
          display: block;
          padding: 16px;
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
    return this.card && this.card.skills && this.card.skills.length > 0
      ? html`<span>
        ${this.card.skills.map((skill) => html`
          <span>${unsafeHTML(skill.replace(/\[([^\]]*)]/g, '<abbr>$1</abbr>'))}</span>&nbsp;
        `)}
      </span>` : ''
    ;
  }
}
