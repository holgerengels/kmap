import {html, css} from 'lit';
import {customElement, state} from 'lit/decorators.js';
import {Connected} from "./connected";
import {State, store} from "../store";

import '@material/mwc-icon';
import '@material/mwc-list/mwc-list';
import '@material/mwc-list/mwc-list-item';
import {resetStyles, fontStyles, colorStyles} from "./kmap-styles";
import {Timeline} from "../models/courses";

@customElement('kmap-timeline-selector')
export class KMapTimelineSelector extends Connected {

  @state()
  private _timelines: Timeline[] = [];
  @state()
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
      resetStyles,
      fontStyles,
      colorStyles,
      css`
        mwc-list { --mdc-list-vertical-padding: 0px; }
      `
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
