import {css, customElement, html, LitElement, property} from 'lit-element';

import {colorStyles, fontStyles} from "./kmap-styles";
import '@material/mwc-icon';
import '@material/mwc-icon-button';
import '@material/mwc-top-app-bar';
import './kmap-login-button';
import './kmap-summary-card';
import './kmap-knowledge-card';
import './kmap-browser-chapter-editor';
import './kmap-timeline-card';
import './svg-connector';
import {cardStyles} from "../mdc.card.css";
import {iconTest} from "./icons";

@customElement('kmap-timeline-card')
export class KMapTimelineCard extends LitElement {
  @property()
  private subject: string = '';

  @property()
  tops?: string[][];

  static get styles() {
    // language=CSS
    return [
      fontStyles,
      colorStyles,
      cardStyles,
      css`
        .mdc-card {
          margin: 6px 8px 6px 0px;
        }
        .mdc-card > * {
          display: block;
          margin: 12px
        }
        .mdc-card *:not(:first-child) {
          margin-top: 0px;
        }
        a.link {
          text-decoration: none !important;
        }
        a.link > * {
          display: inline;
        }
        a > mwc-icon {
          --mdc-icon-size: 20px;
          vertical-align: text-top;
          margin: -2px;
        }
        a > div > svg {
          width: 18px;
          height: 18px;
          vertical-align: text-top;
          margin: 0px -1px 0px -1px;
        }
      `];
  }

  render() {
    if (this.tops === undefined)
      return html`tops undefined`;

    // language=HTML
    return html`
      <div class="mdc-card">
        ${this.tops.map((top) => {
          switch (top[0]) {
            case 'card':
              return html`
                <a href="${(this._top(top[1]))}" class="link mdc-card__primary-action">
                <mwc-icon title="Wissenskarte">fullscreen</mwc-icon>
                <span>${top[1].replace("/", " → ")}</span>
                </a>
              `;
            case 'map':
              return html`
                <a href="${(this._map(top[1]))}" class="link mdc-card__primary-action">
                <mwc-icon title="Wissenslandkarte">open_in_new</mwc-icon>
                <span>${top[1] + " ∗"}</span>
                </a>
              `;
            case 'test':
              return html`
                <a href="${(this._test(top[1]))}" class="link mdc-card__primary-action">
                    <span title="Tests">${iconTest}</span>
                    <span>${top[1].replace("/", " → ")}</span>
                    </a>
              `;
            case 'note':
              return html`
                <div class="title font-body">${top[1]}</div>
              `;
            case 'link':
              return html`
                <a class="link mdc-card__primary-action" href="${top[1].split(' ')[0]}">
                <mwc-icon title="Wissenslandkarte">link</mwc-icon>
                <span>${top[1].split(' ').slice(1).join(' ')}</span>
                </a>
              `;
            default:
              return 'fehler';
          }
        })}
      </div>
    `;
  }

  private _top(top: string) {
    return "browser/" + this.subject + '/' + top.split("/").map(p => encodeURIComponent(p)).join("/");
  }

  private _map(top: string) {
    return "browser/" + this.subject + '/' + encodeURIComponent(top);
  }

  private _test(top: string) {
    return "test/" + this.subject + '/' + top.split("/").map(p => encodeURIComponent(p)).join("/");
  }
}
