import {LitElement, html, css} from 'lit-element';
import {connect} from 'pwa-helpers/connect-mixin.js';
import {store} from "../store";
import {loadCourses, storeCourses, forgetCourses, storeCourse} from "../actions/courses";

import 'mega-material/icon-button';
import 'mega-material/list';
import 'mega-material/top-app-bar';
import {colorStyles, fontStyles} from "./kmap-styles";
import {config} from "../config";
import {logout, showMessage, updateTitle} from "../actions/app";
import {handleErrors} from "../actions/fetchy";

class KCourses extends connect(store)(LitElement) {
  static get styles() {
    // language=CSS
    return [
      fontStyles,
      colorStyles,
      css`
          :host {
              overflow-y: auto;
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
.field {
  display: flex;
  justify-content: space-between;
  margin: 12px;
}
.field input, .field textarea, .field div {
  width: 210px;
}
textarea {
  resize: vertical;
}
.scroll {
  height: 208px;
  overflow-y: auto;
}
mega-icon {
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
  opacity: 0.0;
  transition: opacity .8s;
}
.page[active] {
  display: block;
  opacity: 1.0;
}
        `
    ];
  }

  render() {
    return html`
      <mega-top-app-bar>
        <mega-icon-button icon="menu" slot="navigationIcon"></mega-icon-button>
        <div slot="title">Kurse</div>
      </mega-top-app-bar>
      <div class="board">
        <div class="form">
          <label section>Kurse</label>
          <span style="float: right">
          <mega-icon @click="${e => this._showPage('new')}" ?disabled="${!this._userid}">add</mega-icon>
          <mega-icon @click="${e => this._showPage('edit')}" ?disabled="${!this._userid || this._selectedIndex === -1}">edit</mega-icon>
          <mega-icon @click="${e => this._showPage('delete')}" ?disabled="${!this._userid || this._selectedIndex === -1}">delete</mega-icon>
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
            <div class="field">
                <label for="newName">Name</label>
                <input id="newName" required type="text" .value=${this._newName} @change=${e => this._newName = e.target.value}/>
            </div>
            <div class="field">
                <label for="newStudents">Schüler</label>
                <textarea id="newStudents" required rows="7" .value="${this._newStudents}" @change=${e => this._newStudents = e.target.value}></textarea>
            </div>
            <mega-button @click="${this._new}">Speichern</mega-button>
          </div>
          <div class="page" ?active="${this._page === 'edit'}">
            <label section>Kurs bearbeiten</label>
            <div class="field">
                <label for="editName">Name</label>
                <input id="editName" required type="text" .value=${this._editName} disabled/>
            </div>
            <div class="field">
                <label for="editStudents">Schüler</label>
                <textarea id="editStudents" required rows="7" .value="${this._editStudents}" @change=${e => this._editStudents = e.target.value}></textarea>
            </div>
            <mega-button @click="${this._edit}">Speichern</mega-button>
          </div>
          <div class="page" ?active="${this._page === 'delete'}">
            <label section>Kurs löschen</label>
            <div class="field">
              ${this._selected
                ? html`<label>Soll der Kurs '${this._selected}' wirklich gelöscht werden?</label>`
                : ''}
            </div>
            <mega-button @click="${this._delete}">Löschen</mega-button>
          </div>
          <div class="page" ?active="${this._page === 'default'}">
            <label section>Kurs</label>
            <div class="field">
                <label>Name</label>
                <div class="font-body">${this._selected}</div>
            </div>
            <div class="field">
                <label>Schüler</label>
                <div class="font-body">${this._selectedStudents}</div>
            </div>
          </div>
        </div>
        <div class="space"></div>
      </div>
    `;
    }

  static get properties() {
    return {
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
    this._courses = [];
    this._selectedIndex = -1;
    this._page = '';
    this._newName = "";
    this._newStudents = "";
    this._editName = "";
    this._editStudents = "";
  }

  firstUpdated(changedProperties) {
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
}
customElements.define('kmap-courses', KCourses);

