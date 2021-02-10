import {css, customElement, html, LitElement, property} from 'lit-element';
import {store} from "../store";

import {colorStyles, fontStyles} from "./kmap-styles";
import '@material/mwc-icon-button';
import './kmap-timeline-card';
import {cardStyles} from "../mdc.card.css";
import {iconPointInTime} from "./icons";
import {Week} from "../models/courses";

@customElement('kmap-timeline')
export class KMapTimeline extends LitElement {
  @property()
  private subject: string = '';
  @property()
  private curriculum: Week[] = [];
  @property()
  private _sw: number = -1;
  @property()
  private _requirements?: Week;
  @property()
  private _weeks: Week[] = [];
  @property()
  private _target?: string[];

  updated(changedProperties) {
    if (changedProperties.has("curriculum")) {
      if (this.curriculum) {
        this._weeks = this.curriculum.filter(w => w.sw !== 0);
        const reqs: Week[] = this.curriculum.filter(w => w.sw === 0);
        this._requirements = reqs.length !== 0 ? reqs[0] : undefined;
      }
      else
        this._weeks = [];
    }
    if (changedProperties.has("_target")) {
      store.dispatch.maps.setTargeted(this._target);
    }
  }

  _markWeek(e) {
    this.mark(this._sw == e.target.id ? -1 : e.target.id);
  }

  mark(sw, scroll?) {
    if (!this.shadowRoot) return;

    this.shadowRoot.querySelectorAll("mwc-icon-button").forEach(e => e.removeAttribute("selected"));

    if (sw != -1) {
      const element = this.shadowRoot.getElementById(sw);
      if (element) {
        element.setAttribute("selected", "true");
        if (scroll)
          element.scrollIntoView({block: "start", behavior: "smooth"});
      }

      const target: string[] = [];
      if (this._requirements)
        target.push(...this._requirements.tops.filter(top => top[0] === 'card' || top[0] === 'map').map(top => top[1]));

      for (let i = 0; (this._weeks[i].sw || -1) <= sw; i++) {
        target.push(...(this._weeks[i].tops || []).filter(top => top[0] === 'card' || top[0] === 'map').map(top => top[1]));
      }
      this._target = target;
    }
    else {
      this._target = undefined;
    }

    this._sw = sw;
  }

  static get styles() {
    // language=CSS
    return [
      fontStyles,
      colorStyles,
      cardStyles,
      css`
        :host {
          display: block;
          background-color: white;
          height: 100%;
          overflow-y: auto;
          scroll-snap-type: y mandatory;
          background-image: url(icons/1x1.svg);
          background-position-x: 50px;
          background-repeat: repeat-y;
        }
        .grid {
          scroll-snap-align: start;
          display: grid;
          grid-template-columns: 32px 41px 1fr;
        }
        .week {
          margin: 19px 0px 0px 8px;
          text-align: center;
          font-family: Roboto,sans-serif;
          -webkit-font-smoothing: antialiased;
          font-size: 0.85rem;
          font-weight: 500;
        }
        .knob {
          margin: 8px 0px;
          --mdc-icon-button-size: 38px;
          --foreground: var(--color-secondary-dark);
          --background: white;
        }
        .knob[selected] {
          --background: var(--color-secondary-dark);
        }
        .right {
          display: flex;
          flex-flow: column;
        }
        div.holidays {
          padding: 12px;
          background-color: var(--color-lightgray);
          box-shadow: rgba(0, 0, 0, 0.2) 0px 2px 1px -1px, rgba(0, 0, 0, 0.14) 0px 1px 1px 0px, rgba(0, 0, 0, 0.12) 0px 1px 3px 0px;
        }
        div.holidays {
          margin: 8px 0px;
        }
      `];
  }

  render() {
    // language=HTML
    return html`
      ${this._weeks.map((week) => html`
        ${week.sw ? html`
          <div class="grid">
            <div class="week">SW<br/>${week.sw}</div>
            <div class="knobs">
              <mwc-icon-button id="${week.sw}" class="knob" @click="${this._markWeek}">${iconPointInTime}</mwc-icon-button>
            </div>
            <div class="right">
              <kmap-timeline-card .tops="${week.tops}" .subject="${this.subject}"></kmap-timeline-card>
            </div>
          </div>
        ` : html`
          <div class="holidays">
            ${week.holidays}
          </div>
        `}
      `)}
    `;
  }
}
