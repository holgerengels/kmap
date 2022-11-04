import {css, html, LitElement} from 'lit';
import {customElement, property, state} from 'lit/decorators.js';
import {store} from "../store";

import {resetStyles, colorStyles, fontStyles, elevationStyles} from "./kmap-styles";
import '@material/mwc-icon-button';
import './kmap-timeline-card';
import {iconPointInTime} from "./icons";
import {Week} from "../models/courses";

@customElement('kmap-timeline')
export class KMapTimeline extends LitElement {
  @property()
  private subject: string = '';
  @property()
  private curriculum: Week[] = [];
  @state()
  private _sw: number = -1;
  @state()
  private _requirements?: Week;
  @state()
  private _weeks: Week[] = [];
  @state()
  private _target?: string[];

  declare shadowRoot: ShadowRoot;

  willUpdate(changedProperties) {
    if (changedProperties.has("curriculum")) {
      if (this.curriculum) {
        this._weeks = this.curriculum.filter(w => w.sw !== 0);
        const reqs: Week[] = this.curriculum.filter(w => w.sw === 0);
        this._requirements = reqs.length !== 0 ? reqs[0] : undefined;
      } else
        this._weeks = [];
    }
  }

  updated(changedProperties) {
    if (changedProperties.has("_target")) {
      store.dispatch.maps.setTargeted(this._target);
    }
  }

  _markWeek(e) {
    const target = e.currentTarget;
    const id = target.id;
    this.mark(this._sw == id ? -1 : id);
  }

  mark(sw, scroll?) {
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
      resetStyles,
      fontStyles,
      colorStyles,
      elevationStyles,
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
          margin: 8px 0px;
          background-color: var(--color-lightgray);
          box-shadow: var(--elevation-01);
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
