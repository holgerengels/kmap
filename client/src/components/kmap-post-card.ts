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
        }
        kmap-card-text {
          padding-left: 32px;
          padding-right: 32px;
        }
        [slot=primary] {
          display: grid;
          grid-template-columns: 100px 1fr;
        }
        [expanded] {
          grid-template-columns: 120px 1fr;
        }
        [slot=primary] img {
          grid-row: 1 / span 3;
          object-fit: cover;
          border-top-left-radius: 4px;
          border-bottom-right-radius: 4px;
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
            <img src="${thumb}" width="${this.expanded ? '120' : '100'}"/>
            <div></div>
            <kmap-card-text type="${this.expanded ? 'title' : 'header'}">${this.card.topic}</kmap-card-text>
            <kmap-card-text type="subheader"><b>${new Date(this.card.created!).toLocaleDateString()}</b>&nbsp; ${this.card.author}</kmap-card-text>
          </div>
          ${this.expanded ? html`
            <kmap-card-text>
              <kmap-knowledge-card-description
                .instance="root"
                .subject="Blog"
                .chapter="Blog"
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
