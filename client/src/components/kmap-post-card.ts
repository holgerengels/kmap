import {css, html, LitElement} from 'lit';
import {customElement, property} from 'lit/decorators.js';
import {urls} from '../urls';

import './kmap-card';
import {resetStyles, colorStyles, elevationStyles, fontStyles} from "./kmap-styles";
import {Card} from "../models/types";
import {unsafeHTML} from "lit/directives/unsafe-html.js";

@customElement('kmap-post-card')
export class KMapPostCard extends LitElement {

  @property({type: Object})
  private card?: Card;

  @property({type: Boolean})
  private expanded: boolean = false;

  static get styles() {
    // language=CSS
    return [
      resetStyles,
      fontStyles,
      colorStyles,
      elevationStyles,
      css`
        kmap-card {
          background-color: white;
          max-width: 800px;
        }
        kmap-card-text {
          padding-left: 32px;
          padding-right: 32px;
        }
        [slot=primary] {
          display: grid;
          grid-template-columns: 132px 1fr;
        }
        [slot=primary] img {
          grid-row: 1 / span 3;
          object-fit: cover;
          border-radius: 4px;
          margin-left: 32px;
          margin-top: 24px;
        }
      `];
  }

  render() {
    if (this.card === undefined)
      return html`card undefined`;
    else {
      const thumb = this.card.thumb
        ? `${urls.server}data/Blog/Blog/${this.card.topic}/${this.card.thumb}?instance=root`
        : "/app/icons/KMap.svg";
      // language=HTML
      return html`
        <kmap-card>
          <div slot="primary" ?expanded="${this.expanded}">
            <img src="${thumb}" width="100" alt="${this.card.topic}"/>
            <div></div>
            <kmap-card-text type="title">${this.card.topic}</kmap-card-text>
            <kmap-card-text type="subheader"><b>${new Date(this.card.created!).toLocaleDateString('DE')}</b>&nbsp;
              ${this.expanded
                ? html`<a rel="author" href="https://kmap.eu/app/browser/Hilfe/Autoren/${this.card.author}" title="Autor">${this.card.author}</a>`
                : html`${this.card.author}`
              }
            </kmap-card-text>
          </div>
          ${this.expanded ? html`
            <kmap-card-text>
              <kmap-knowledge-card-description
                instance="root"
                subject="Blog"
                chapter="Blog"
                .topic="${this.card.topic}"
                .description="${this.card.description}">
              </kmap-knowledge-card-description>
            </kmap-card-text>
            <kmap-card-spacer></kmap-card-spacer>
            <kmap-card-text><a href="/app/blog" style="color: gray; cursor: pointer">ZURÜCK</a></kmap-card-text>
          ` : html`
            <kmap-card-text type="content">${unsafeHTML(this.card.summary)}</kmap-card-text>
            <kmap-card-spacer></kmap-card-spacer>
            <kmap-card-text><a href="/app/blog/${this.card.topic}" style="color: gray; cursor: pointer">WEITERLESEN</a>
            </kmap-card-text>
          `}
        </kmap-card>
      `;
    }
  }
}
