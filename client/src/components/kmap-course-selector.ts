import {html, customElement, property, css} from 'lit-element';
import {Connected} from "./connected";
import {State, store} from "../store";

import '@material/mwc-icon';
import '@material/mwc-list/mwc-list';
import '@material/mwc-list/mwc-list-item';
import {fontStyles, colorStyles} from "./kmap-styles";
import {Course} from "../models/courses";

@customElement('kmap-course-selector')
export class KMapCourseSelector extends Connected {

  @property()
  private _courses: Course[] = [];
  @property()
  private _selectedIndex: number = -1;

  _select(index) {
    if (this._selectedIndex === index)
      this._selectedIndex = -1;
    else
      this._selectedIndex = index;

    if (this._selectedIndex !== -1)
      store.dispatch.courses.selectCourse(this._courses[this._selectedIndex]);
    else
      store.dispatch.courses.unselectCourse();
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
      css`
        mwc-list { --mdc-list-vertical-padding: 0px; }
      `
    ];
  }

  render() {
    // language=HTML
    return html`
        <mwc-list>
          ${this._courses.map((course, i) => html`
            <mwc-list-item ?activated="${this._selectedIndex === i}" @click="${() => this._select(i)}">
              <span>${course.name}</span>
            </mwc-list-item>
          `)}
        </mwc-list>
    `;
  }
}
