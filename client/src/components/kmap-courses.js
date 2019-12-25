import {LitElement, html, css} from 'lit-element';
import { connect } from '@captaincodeman/rdx';
import {store} from "../store";
import {loadCourses, storeCourses, forgetCourses, storeCourse} from "../actions/courses";
import {logout, showMessage, updateTitle} from "../actions/app";
import {handleErrors} from "../actions/fetchy";

import {colorStyles, fontStyles} from "./kmap-styles";
import {config} from "../config";
import '@material/mwc-button';
import '@material/mwc-icon';
import '@material/mwc-icon-button';
import '@material/mwc-textarea';
import '@material/mwc-textfield';
import '@material/mwc-top-app-bar';
import 'mega-material/list';

class KCourses extends connect(store, LitElement) {
  static get styles() {
    // language=CSS
    return [
      fontStyles,
      colorStyles,
      css`
:host {
  display: contents;
}
.board {
  height: auto;
  padding: 8px;
  padding-bottom: 36px;
  display: flex;
  flex-flow: row wrap;
  justify-content: flex-start;
}
.form {
  max-width: 300px;
  margin: 12px;
  flex: 0 0 50%;
  align-items: stretch;
}
.space {
  margin: 12px;
  flex: 1 1 100%;
}
.scroll {
  height: 208px;
  overflow-y: auto;
}
mwc-icon {
  pointer-events: all;
  cursor: pointer;
}
mega-list-item {
  cursor: pointer;
}
[disabled], [disabled] svg {
  color: gray;
  fill: gray;
  pointer-events: none;
}
.page {
  display: none;
  transition: opacity .8s;
  padding: 8px;
}
.page[active] {
  display: block;
}
mwc-textarea, mwc-textfield {
  width: 300px;
  --mdc-text-field-filled-border-radius: 4px 16px 0 0;
  margin: 4px 0;
}
      `];
  }

  render() {
    // language=HTML
    return html`
      <mwc-top-app-bar id="bar" dense scrollTarget="board">
        <mwc-icon-button icon="menu" slot="navigationIcon" @click="${e => this._fire('toggleDrawer')}"></mwc-icon-button>
        <div slot="title">Kurse</div>
        <kmap-login-button slot="actionItems" @lclick="${e => this._fire('login')}"></kmap-login-button>
      </mwc-top-app-bar>
      <div id="content" class="board">
        <div class="form">
          <label section>Kurse</label>
          <span style="float: right">
          <mwc-icon @click="${e => this._showPage('new')}" ?disabled="${!this._userid}">add</mwc-icon>
          <mwc-icon @click="${e => this._showPage('edit')}" ?disabled="${!this._userid || this._selectedIndex === -1}">edit</mwc-icon>
          <mwc-icon @click="${e => this._showPage('delete')}" ?disabled="${!this._userid || this._selectedIndex === -1}">delete</mwc-icon>
          </span>
          <br style="clear: right"/>
          <div class="scroll">
          <mega-list>
            ${this._courses.map((course, i) => html`
              <mega-list-item icon="group" ?activated="${this._selectedIndex === i}" @click="${e => this._select(i)}">${course}</mega-list-item>
            `)}
          </mega-list>
          </div>
        </div>
        <div class="form">
          <div class="page" ?active="${this._page === 'new'}">
            <label section>Neuer Kurs</label>
            <mwc-textfield label="Name" type="text" required .value=${this._newName} @change=${e => this._newName = e.target.value}></mwc-textfield>
            <mwc-textarea placeholder="Schüler" required rows="7" .value=${this._newStudents} @change=${e => this._newStudents = e.target.value}></mwc-textarea>
            <mwc-button @click="${this._new}">Speichern</mwc-button>
          </div>
          <div class="page" ?active="${this._page === 'edit'}">
            <label section>Kurs bearbeiten</label>
            <mwc-textfield type="text" disabled .value=${this._editName}></mwc-textfield>
            <mwc-textarea placeholder="Schüler" required rows="3" .value=${this._editStudents} @change=${e => this._editStudents = e.target.value}></mwc-textarea>
            <mwc-button @click="${this._edit}">Speichern</mwc-button>
          </div>
          <div class="page" ?active="${this._page === 'delete'}">
            <label section>Kurs löschen</label>
            <div class="field">
              ${this._selected
                ? html`<label>Soll der Kurs '${this._selected}' wirklich gelöscht werden?</label>`
                : ''}
            </div>
            <mwc-button @click="${this._delete}">Löschen</mwc-button>
          </div>
          <div class="page" ?active="${this._page === 'default'}">
            <label section>Kurs</label>
            <mwc-textfield type="text" disabled .value=${this._selected}></mwc-textfield>
            <mwc-textarea placeholder="Schüler" disabled rows="3" .value=${this._selectedStudents}></mwc-textarea>
          </div>
        </div>
        <div class="space"></div>
      </div>
    `;
  }

  static get properties() {
    return {
      _instance: {type: String},
      _userid: {type: String},
      _courses: {type: Array},
      _selectedIndex: {type: Number},
      _selected: {type: String},
      _selectedStudents: {type: String},
      _page: {type: String},
      _newName: {type: String},
      _newStudents: {type: String},
      _editName: {type: String},
      _editStudents: {type: String},
    };
  }

  constructor() {
    super();
    this._instance = null;
    this._courses = [];
    this._selectedIndex = -1;
    this._page = '';
    this._newName = "";
    this._newStudents = "";
    this._editName = "";
    this._editStudents = "";
  }

  firstUpdated(changedProperties) {
    let bar = this.shadowRoot.getElementById('bar');
    let content = this.shadowRoot.getElementById('content');
    bar.scrollTarget = content;

    if (this._userid)
      store.dispatch(loadCourses());

    store.dispatch(updateTitle("Kurse"));
  }

  updated(changedProperties) {
    if (changedProperties.has('_selectedIndex')) {
      this._selected = this._courses[this._selectedIndex];
      if (this._selected)
        fetch(`${config.server}state?userid=${this._userid}&course=${this._selected}`, {
          method: "GET",
          mode: "cors",
          cache: "no-cache",
          credentials: "include",
          headers: {
            "Content-Type": "application/json; charset=utf-8",
            "X-Instance": this._instance,
          }
        })
          .then(handleErrors)
          .then(res => res.json())
          .then(data => this._selectedStudents = data.data.join(', '))
          .catch((error) => {
            store.dispatch(showMessage(error.message));
            if (error.message === "invalid session")
              store.dispatch(logout({userid: this._userid}));
          });
    }
    if (changedProperties.has('_userid') && !this._userid)
      this._page = '';
  }

  stateChanged(state) {
    this._instance = state.app.instance;
    if (this._userid !== state.app.userid) {
      this._userid = state.app.userid;
      if (this._userid)
        store.dispatch(loadCourses());
      else
        store.dispatch(forgetCourses())
    }
    this._courses = state.courses.courses;
  }

  _select(index) {
    if (this._selectedIndex === index)
      this._selectedIndex = -1;
    else
      this._selectedIndex = index;

    this._page = this._selectedIndex !== -1 ? 'default' : '';
  }

  _showPage(page) {
    this._page = page;

    if (page === 'edit') {
      this._editName = this._selected;
      fetch(`${config.server}state?userid=${this._userid}&course=${this._selected}`, {
        method: "GET",
        mode: "cors",
        cache: "no-cache",
        credentials: "include",
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "X-Instance": this._instance,
        }
      })
        .then(handleErrors)
        .then(res => res.json())
        .then(data => this._editStudents = data.data.join(','))
        .catch((error) => {
          store.dispatch(showMessage(error.message));
          if (error.message === "invalid session")
            store.dispatch(logout({userid: this._userid}));
        });
    }
  }

  _new() {
    let name = this._newName;
    let students = this._newStudents.split(',');
    for (let i = 0; i < students.length; i++)
      students[i] = students[i].trim();

    store.dispatch(storeCourse({ name: name, students: students }))
      .then(() => store.dispatch(loadCourses()))
      .then(() => {
          this._selectedIndex = this._courses.indexOf(name);
          this._newName = '';
          this._newStudents = '';
          this._page = 'default';
        });
  }

  _edit() {
    let name = this._editName;
    let students = this._editStudents.split(',');
    for (let i = 0; i < students.length; i++)
      students[i] = students[i].trim();

    store.dispatch(storeCourse({ name: name, students: students })).then(() => {
      this._selectedStudents = students.join(', ');
      this._editName = '';
      this._editStudents = '';
      this._page = 'default';
    });
  }

  _delete() {
    let courses = new Array(...this._courses);
    courses.splice(this._selectedIndex, 1);
    store.dispatch(storeCourses(courses)).then(() => {
      this._page = '';
    });
  }

  _fire(name) {
    this.dispatchEvent(new CustomEvent(name, {bubbles: true, composed: true}));
  }
}
customElements.define('kmap-courses', KCourses);

