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
import {iconTest} from "./icons";

export interface Week {
  cw: number,
  sw: number,
  tops: string[][],
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
  private _requirements?: Week;
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
      if (this._selectedTimeline) {
        const curriculum: Week[] = JSON.parse(this._selectedTimeline.curriculum);
        this._weeks = curriculum.filter(w => w.sw !== 0);
        const reqs: Week[] = curriculum.filter(w => w.sw === 0);
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
      if (this._requirements)
        target.push(...this._requirements.tops.filter(top => top[0] === 'card' || top[0] === 'map').map(top => top[1]));

      for (let i = 0; this._weeks[i].sw <= sw; i++) {
        target.push(...this._weeks[i].tops.filter(top => top[0] === 'card' || top[0] === 'map').map(top => top[1]));
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
          background-image: url(/app/1x1.svg);
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
    // language=HTML
    return html`
        <aside>
            ${this._weeks.map((week) => html`
              <div class="grid">
                <div class="week">SW<br/>${week.sw}</div>
                <div class="knobs">
                  <mwc-icon-button id="${week.sw}" class="knob" @click="${this._markWeek}">${iconPointInTime}</mwc-icon-button>
                </div>
                <div class="right">
                  <div class="mdc-card">
                    ${week.tops.map((top) => {
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
                </div>
              </div>
            `)}
        </aside>
    `;
  }

  private _top(top: string) {
    return "browser/" + this._selectedTimeline?.subject + '/' + top.split("/").map(p => encodeURIComponent(p)).join("/");
  }

  private _map(top: string) {
    return "browser/" + this._selectedTimeline?.subject + '/' + encodeURIComponent(top);
  }

  private _test(top: string) {
    return "test/" + this._selectedTimeline?.subject + '/' + top.split("/").map(p => encodeURIComponent(p)).join("/");
  }
}
