import {LitElement, html, css, customElement, property} from 'lit-element';
import {connect} from '@captaincodeman/rdx';
import {State, store} from "../store";

import {colorStyles, fontStyles} from "./kmap-styles";
import '@material/mwc-button';
import '@material/mwc-icon';
import '@material/mwc-icon-button';
import '@material/mwc-list/mwc-list';
import '@material/mwc-list/mwc-list-item';
import '@material/mwc-textarea';
import '@material/mwc-textfield';
import '@material/mwc-top-app-bar';

@customElement('kmap-courses')
export class KCourses extends connect(store, LitElement) {
  @property()
  private _page: string = '';
  @property()
  private _courses: string[] = [];
  @property()
  private _selectedIndex: number = -1;

  @property()
  private _selectedName: string = '';
  @property()
  private _selectedStudents: string = '';
  @property()
  private _newName: string = '';
  @property()
  private _newStudents: string = '';
  @property()
  private _editName: string = '';
  @property()
  private _editStudents: string = '';

  mapState(state: State) {
    return {
      _courses: state.courses.courses,
      _selectedIndex: state.courses.courses.includes(this._selectedName) ? state.courses.courses.indexOf(this._selectedName) : -1,
      _selectedStudents: state.courses.students || '',
      _editStudents: state.courses.students || '',
    };
  }

  updated(changedProperties) {
    if (changedProperties.has('_selectedIndex')) {
      if (this._selectedIndex === -1) {
        this._selectedName = '';
        this._selectedStudents = '';
      }
      else {
        this._selectedName = this._courses[this._selectedIndex];
        store.dispatch.courses.loadCourse(this._selectedName);
      }
    }
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
      this._editName = this._selectedName;
      store.dispatch.courses.loadCourse(this._selectedName);
    }
  }

  async _new() {
    let name = this._newName;
    let students = this._newStudents.split(',');
    for (let i = 0; i < students.length; i++)
      students[i] = students[i].trim();

    this._selectedName = name;
    this._selectedStudents = students.join(', ');

    await store.dispatch.courses.storeChange({ name: name, students: students });

    this._newName = '';
    this._newStudents = '';
    this._page = 'default';
  }

  _edit() {
    let name = this._editName;
    let students = this._editStudents.split(',');
    for (let i = 0; i < students.length; i++)
      students[i] = students[i].trim();

    this._selectedName = name;
    this._selectedStudents = students.join(', ');

    store.dispatch.courses.storeChange({name: name, students: students});

    this._editName = '';
    this._editStudents = '';
    this._page = 'default';
  }

  _delete() {
    let courses = new Array(...this._courses);
    courses.splice(this._selectedIndex, 1);
    store.dispatch.courses.store(courses);
    this._courses = courses;
    this._page = '';
  }

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
          margin: 4px 0;
        }
      `];
  }

  render() {
    // language=HTML
    return html`
      <main id="content" class="board">
        <div class="form">
          <label>Kurse</label>
          <span style="float: right">
          <mwc-icon @click="${() => this._showPage('new')}">add</mwc-icon>
          <mwc-icon @click="${() => this._showPage('edit')}" ?disabled="${this._selectedIndex === -1}">edit</mwc-icon>
          <mwc-icon @click="${() => this._showPage('delete')}" ?disabled="${this._selectedIndex === -1}">delete</mwc-icon>
          </span>
          <br style="clear: right"/>
          <div class="scroll">
          <mwc-list>
            ${this._courses.map((course, i) => html`
              <mwc-list-item ?activated="${this._selectedIndex === i}" @click="${() => this._select(i)}" graphic="icon">
                <span>${course}</span>
                <mwc-icon slot="graphic">group</mwc-icon>
              </mwc-list-item>
            `)}
          </mwc-list>
          </div>
        </div>
        <div class="form">
          <div class="page" ?active="${this._page === 'new'}">
            <label>Neuer Kurs</label>
            <mwc-textfield label="Name" type="text" required .value=${this._newName} @change=${e => this._newName = e.target.value}></mwc-textfield>
            <mwc-textarea placeholder="Schüler" required rows="7" .value=${this._newStudents} @change=${e => this._newStudents = e.target.value}></mwc-textarea>
            <mwc-button @click="${this._new}">Speichern</mwc-button>
          </div>
          <div class="page" ?active="${this._page === 'edit'}">
            <label>Kurs bearbeiten</label>
            <mwc-textfield type="text" disabled .value=${this._editName}></mwc-textfield>
            <mwc-textarea placeholder="Schüler" required rows="3" .value=${this._editStudents} @change=${e => this._editStudents = e.target.value}></mwc-textarea>
            <mwc-button @click="${this._edit}">Speichern</mwc-button>
          </div>
          <div class="page" ?active="${this._page === 'delete'}">
            <label>Kurs löschen</label>
            <div class="field">
              ${this._selectedName
                ? html`<label>Soll der Kurs '${this._selectedName}' wirklich gelöscht werden?</label>`
                : ''}
            </div>
            <mwc-button @click="${this._delete}">Löschen</mwc-button>
          </div>
          <div class="page" ?active="${this._page === 'default'}">
            <label>Kurs</label>
            <mwc-textfield type="text" disabled .value=${this._selectedName}></mwc-textfield>
            <mwc-textarea placeholder="Schüler" disabled rows="3" .value=${this._selectedStudents}></mwc-textarea>
          </div>
        </div>
        <div class="space"></div>
      </main>
    `;
  }
}
