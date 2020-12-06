import {css, customElement, html, LitElement, property, query} from 'lit-element';
import {connect} from '@captaincodeman/rdx';
import {State, store} from "../store";

import './kmap-timeline';
import {Timeline, Week} from "../models/courses";
import {KMapTimeline} from "./kmap-timeline";
import {elevationStyles} from "./kmap-styles";

@customElement('kmap-timeline-aside')
export class KMapTimelineAside extends connect(store, LitElement) {
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
  public open: boolean = true;

  @property()
  private _selectedTimeline?: Timeline;
  @property()
  private _curriculum: Week[] = [];
  @property()
  private _target?: string[];

  @query('#timeline')
  private _timeline: KMapTimeline;

  mapState(state: State) {
    return {
      _instance: state.app.instance,
      _userid: state.app.userid,
      _subject: state.maps.subject,
      _selectedTimeline: state.courses.selectedTimeline,
    };
  }

  updated(changedProperties) {
    if (changedProperties.has("_curriculum")) {
      const cw = this._cw();
      let sw = -1;
      for (let i = 0; i < this._curriculum.length; i++) {
        let week = this._curriculum[i];
        if (week.cw > cw)
          break;
        if (week.sw !== undefined)
          sw = week.sw;
      }
      setTimeout(function(that: KMapTimelineAside){
        that._timeline.mark(sw, true);
      }.bind(undefined, this), 300);

      console.log(cw);
      console.log(sw)
    }
    if (changedProperties.has("_selectedTimeline")) {
      if (this._selectedTimeline) {
        this._curriculum = JSON.parse(this._selectedTimeline.curriculum);
      }
      else
        this._curriculum = [];
    }
    if (changedProperties.has("_target")) {
      store.dispatch.maps.setTargeted(this._target);
    }
  }

  _cw() {
    var date = new Date();
    var currentThursday = new Date(date.getTime() +(3-((date.getDay()+6) % 7)) * 86400000);
    var yearOfThursday = currentThursday.getFullYear();
    var firstThursday = new Date(new Date(yearOfThursday,0,4).getTime() +(3-((new Date(yearOfThursday,0,4).getDay()+6) % 7)) * 86400000);
    return Math.floor(1 + 0.5 + (currentThursday.getTime() - firstThursday.getTime()) / 86400000/7);
  }

  _open() {
    this.dispatchEvent(new CustomEvent('open', {bubbles: true, composed: true}));
  }

  static get styles() {
    // language=CSS
    return [
      elevationStyles,
      css`
        :host {
          display: flex;
          background-color: white;
        }
        aside {
          display: grid;
        }
        label, kmap-timeline {
          transition: opacity .7s ease-in-out;
        }
        label {
          position: absolute;
          transform-origin: top left;
          transform: rotate(-90deg) translate(-120px, 0px);
          height: fit-content;
          width: 110px;
          padding: 5px;
          text-align: center;
          background-color: white;
        }
        [hidden] {
          opacity: 0;
        }
      `];
  }

  render() {
    // language=HTML
    return html`
      <aside ?open="${this.open}">
        <label class="elevation-02" ?hidden="${this.open}" @click="${this._open}">Wochenplan</label>
        <kmap-timeline id="timeline" ?hidden="${!this.open}" .subject="${this._subject}" .curriculum="${this._curriculum}"></kmap-timeline>
      </aside>
    `;
  }
}
