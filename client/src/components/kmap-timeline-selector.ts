import {LitElement, html, customElement, property} from 'lit-element';
import { connect } from '@captaincodeman/rdx';
import {State, store} from "../store";

import '@material/mwc-icon';
import '@material/mwc-list/mwc-list';
import '@material/mwc-list/mwc-list-item';
import {fontStyles, colorStyles} from "./kmap-styles";
import {Timeline} from "../models/courses";

@customElement('kmap-timeline-selector')
export class KMapTimelineSelector extends connect(store, LitElement) {

  @property()
  private _timelines: Timeline[] = [];
  @property()
  private _selectedIndex: number = -1;

  _select(index) {
    if (this._selectedIndex === index)
      this._selectedIndex = -1;
    else
      this._selectedIndex = index;

    if (this._selectedIndex !== -1)
      store.dispatch.courses.selectTimeline(this._timelines[this._selectedIndex]);
    else
      store.dispatch.courses.unselectTimeline();
  }

  mapState(state: State) {
    return {
      _timelines: state.courses.timelines,
    };
  }

  static get styles() {
    // language=CSS
    return [
      fontStyles,
      colorStyles,
    ];
  }

  render() {
    // language=HTML
    return html`
        <mwc-list>
          ${this._timelines.map((timeline, i) => html`
            <mwc-list-item ?activated="${this._selectedIndex === i}" @click="${() => this._select(i)}">
              <span>${timeline.name}</span>
            </mwc-list-item>
          `)}
        </mwc-list>
    `;
  }
}
