import {css, customElement, html, LitElement, property} from 'lit-element';
import {connect} from '@captaincodeman/rdx';
import {State, store} from "../store";

import {colorStyles, fontStyles} from "./kmap-styles";
import '@material/mwc-icon';
import '@material/mwc-icon-button';
import '@material/mwc-top-app-bar';
import './kmap-login-button';
import './kmap-summary-card';
import './kmap-knowledge-card';
import './kmap-browser-chapter-editor';
import './svg-connector';
import {cardStyles} from "../mdc.card.css";
import {iconPointInTime} from "./icons";
import {Timeline} from "../models/courses";

export interface Week {
  cw: number,
  sw: number,
  tops: string[],
}

@customElement('kmap-timeline')
export class KMapTimeline extends connect(store, LitElement) {
  @property()
  // @ts-ignore
  private _instance: string = '';
  @property()
  // @ts-ignore
  private _userid: string = '';
  @property()
  // @ts-ignore
  private _subject: string = '';

  @property()
  private _sw: number = -1;
  @property()
  private _weeks: Week[] = [];
  @property()
  private _selectedTimeline?: Timeline;
  @property()
  private _target?: string[];

  mapState(state: State) {
    return {
      _instance: state.app.instance,
      _userid: state.app.userid,
      _subject: state.maps.subject,
      _selectedTimeline: state.courses.selectedTimeline,
    };
  }

  firstUpdated() {
    /*
    this._weeks = [
      { cw: 38, sw: 1, tops: ["Grundwissen/Mengenlehre", "Grundwissen/Zahlenmengen", "Grundwissen/Intervalle"] },
      { cw: 39, sw: 2, tops: ["Grundwissen/Terme", "Grundwissen/Gleichungen"] },
      { cw: 40, sw: 3, tops: ["Grundwissen/Koordinatensystem", "Grundwissen/Symmetrie", "Grundwissen/Geraden"] },
      { cw: 41, sw: 4, tops: ["Parabeln/*", "Grundwissen/Parabeln"] },
      { cw: 42, sw: 5, tops: ["Funktionen/Allgemeines", "Funktionen/Darstellung"] },
      { cw: 43, sw: 6, tops: ["Lineare Funktionen/Steigung", "Lineare Funktionen/Hauptform"] },
      { cw: 46, sw: 7, tops: ["Lineare Funktionen/Punktsteigungsform", "Lineare Funktionen/Lage im Koordinatensystem"] },
      { cw: 47, sw: 8, tops: ["Lineare Funktionen/*"] },
    ];
     */
  }

  updated(changedProperties) {
    if (changedProperties.has("_weeks")) {
      const cw = this._cw();
      let index = -1;
      let sw = -1;
      for (let i = 0; i < this._weeks.length; i++){
        let week = this._weeks[i];
        if (cw === week.cw) {
          index = i;
          sw = week.sw;
          break;
        }
      }
      this._mark(sw, true);
      console.log(cw);
      console.log(index)
      console.log(sw)
    }
    if (changedProperties.has("_selectedTimeline")) {
      this._weeks = this._selectedTimeline ? JSON.parse(this._selectedTimeline.curriculum) : [];
    }
    if (changedProperties.has("_target")) {
      store.dispatch.maps.setTargeted(this._target);
    }
  }

  _markWeek(e) {
    this._mark(this._sw == e.target.id ? -1 : e.target.id);
  }

  _mark(sw, scroll?) {
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
      for (let i = 0; i < sw; i++) {
        target.push(...this._weeks[i].tops);
      }
      this._target = target;
    }
    else {
      this._target = undefined;
    }

    this._sw = sw;
  }

  _cw() {
    var date = new Date();
    var currentThursday = new Date(date.getTime() +(3-((date.getDay()+6) % 7)) * 86400000);
    var yearOfThursday = currentThursday.getFullYear();
    var firstThursday = new Date(new Date(yearOfThursday,0,4).getTime() +(3-((new Date(yearOfThursday,0,4).getDay()+6) % 7)) * 86400000);
    return Math.floor(1 + 0.5 + (currentThursday.getTime() - firstThursday.getTime()) / 86400000/7);
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
        }
        aside {
          height: 100%;
          overflow-y: auto;
          scroll-snap-type: y mandatory;
        }
        .grid {
          scroll-snap-align: start;
          display: grid;
          grid-template-columns: 54px 50px 1fr;
        }
        .week {
          margin: 19px 0px 0px 8px;
        }
        .knob {
          margin: 4px 0px;
          --foreground: var(--color-secondary-dark);
          --background: white;
        }
        .knob[selected] {
          --background: var(--color-secondary-dark);
        }
        .knobs {
          background-image: url("/app/1x1.svg");
          background-repeat: repeat-y;
          background-position-x: 23px;
        }
        .right {
          display: flex;
          flex-flow: column;
        }
        .mdc-card {
          margin: 6px 8px 6px 0px;
        }
        .title {
          margin: 12px
        }
      `];
  }

  render() {
    // language=HTML
    return html`
        <aside>
            ${this._weeks.map((week) => html`
              <div class="grid">
                <div class="week">SW&nbsp;${week.sw}</div>
                <div class="knobs">
                  <mwc-icon-button id="${week.sw}" class="knob" @click="${this._markWeek}">${iconPointInTime}</mwc-icon-button>
                </div>
                <div class="right">
                  ${week.tops.map((top) => html`
                      <div class="mdc-card">
                          <div class="title mdc-card__primary-action">${top.replace("/", " → ")}</div>
                      </div>
                  `)}
                </div>
              </div>
            `)}
        </aside>
    `;
  }
}
