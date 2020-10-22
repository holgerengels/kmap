import {css, customElement, html, LitElement, property, query} from 'lit-element';
import {connect} from '@captaincodeman/rdx';
import {State, store} from "../store";

import './kmap-timeline';
import {Timeline, Week} from "../models/courses";
import {KMapTimeline} from "./kmap-timeline";

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

  static get styles() {
    // language=CSS
    return [
      css`
        :host {
          display: flex;
        }
      `];
  }

  render() {
    // language=HTML
    return html`
      <aside>
        <kmap-timeline id="timeline" .curriculum="${this._curriculum}"></kmap-timeline>
      </aside>
    `;
  }
}
