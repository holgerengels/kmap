import {LitElement, html, customElement, property} from 'lit-element';
import { connect } from '@captaincodeman/rdx';
import {State, store} from "../store";

import 'mega-material/list';
import {fontStyles, colorStyles} from "./kmap-styles";

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
      // @ts-ignore
      _courses: state.courses.courses,
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
        <mega-list dense>
          ${this._courses.map((course, i) => html`
            <mega-list-item dense icon="group" ?activated="${this._selectedIndex === i}" @click="${() => this._select(i)}">${course}</mega-list-item>
          `)}
        </mega-list>
    `;
  }
}
