import {LitElement, html, customElement, property} from 'lit-element';
import { connect } from '@captaincodeman/rdx';
import {State, store} from "../store";

import '@material/mwc-icon';
import '@material/mwc-list/mwc-list';
import '@material/mwc-list/mwc-list-item';
import {fontStyles, colorStyles, themeStyles} from "./kmap-styles";

@customElement('kmap-course-selector')
export class KMapCourseSelector extends connect(store, LitElement) {

  @property()
  private _courses: string[] = [];
  @property()
  private _selectedIndex: number = -1;

  _select(index) {
    if (this._selectedIndex === index)
      this._selectedIndex = -1;
    else
      this._selectedIndex = index;

    store.dispatch.courses.selectCourse(this._selectedIndex !== -1 ? this._courses[this._selectedIndex] : '');
  }

  mapState(state: State) {
    return {
      _courses: state.courses.courses,
    };
  }

  static get styles() {
    // language=CSS
    return [
      fontStyles,
      colorStyles,
      themeStyles,
    ];
  }

  render() {
    // language=HTML
    return html`
        <mwc-list>
          ${this._courses.map((course, i) => html`
            <mwc-list-item ?activated="${this._selectedIndex === i}" @click="${() => this._select(i)}" graphic="icon">
              <span>${course}</span>
              <mwc-icon slot="graphic">group</mwc-icon>
            </mwc-list-item>
          `)}
        </mwc-list>
    `;
  }
}
