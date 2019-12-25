import {LitElement, html, css} from 'lit-element';
import { connect } from '@captaincodeman/rdx';
import {store} from "../store";
import 'mega-material/list';
import {forgetCourses, loadCourses, selectCourse} from "../actions/courses";
import {fontStyles, colorStyles} from "./kmap-styles";

class KMapCourseSelector extends connect(store, LitElement) {

    static get styles() {
      // language=CSS
        return [
          fontStyles,
          colorStyles,
          css``];
    }

  render() {
    return html`
<mega-list dense>
  ${this._courses.map((course, i) => html`
    <mega-list-item dense icon="group" ?activated="${this._selectedIndex === i}" @click="${e => this._select(i)}">${course}</mega-list-item>
  `)}
</mega-list>
    `;
    }

  static get properties() {
    return {
      _userid: {type: String},
      _courses: {type: Array},
      _selectedIndex: {type: Number},
    };
  }

  constructor() {
    super();
    this._courses = [];
    this._selectedIndex = -1;
  }

  _select(index) {
    if (this._selectedIndex === index)
      this._selectedIndex = -1;
    else
      this._selectedIndex = index;

    store.dispatch(selectCourse(this._selectedIndex !== -1 ? this._courses[this._selectedIndex] : ''));
  }

  stateChanged(state) {
    if (this._userid !== state.app.userid) {
      this._userid = state.app.userid;
      if (this._userid)
        store.dispatch(loadCourses());
      else
        store.dispatch(forgetCourses())
    }
    this._courses = state.courses.courses;
  }

  updated(changedProperties) {
  }
}

window.customElements.define('kmap-course-selector', KMapCourseSelector);
