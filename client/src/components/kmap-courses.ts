import {LitElement, html, css, customElement, property, query} from 'lit-element';
import {connect} from '@captaincodeman/rdx';
import {State, store} from "../store";

import {colorStyles, fontStyles} from "./kmap-styles";
import '@material/mwc-button';
import '@material/mwc-icon';
import '@material/mwc-icon-button';
import '@material/mwc-list/mwc-list';
import '@material/mwc-list/mwc-list-item';
import '@material/mwc-select';
import '@material/mwc-textarea';
import '@material/mwc-textfield';
import '@material/mwc-top-app-bar';
import {Course} from "../models/courses";
import {Subject} from "../models/subjects";
import {TextArea} from "@material/mwc-textarea/mwc-textarea";

@customElement('kmap-courses')
export class KMapCourses extends connect(store, LitElement) {
  @property()
  private _subjects: Subject[] = [];

  @property()
  private _page: string = '';
  @property()
  private _courses: Course[] = [];
  @property()
  private _selectedIndex: number = -1;
  @property()
  private _selected?: Course;
  @property()
  private _newSubject: string = '';
  @property()
  private _newName: string = '';
  @property()
  private _newStudents: string = '';
  @property()
  private _newCurriculum: string = '';
  @property()
  private _editSubject: string = '';
  @property()
  private _editName: string = '';
  @property()
  private _editStudents: string = '';
  @property()
  private _editCurriculum: string = '';

  @query(`#newCurriculum`)
  private _newCurriculumField: TextArea;
  @query(`#editCurriculum`)
  private _editCurriculumField: TextArea;

  mapState(state: State) {
    return {
      _subjects: state.subjects.subjects,
      _courses: state.courses.courses,
      _selectedIndex: this._selected && state.courses.courses.includes(this._selected) ? state.courses.courses.indexOf(this._selected) : -1,
    };
  }

  firstUpdated() {
    const validityTransform = (newValue, nativeValidity) => {
      if (nativeValidity.valid) {
        try {
          JSON.parse(newValue);
          return { valid: true };
        }
          // @ts-ignore
        catch (e: SyntaxError) {
          return {
            valid: false,
            customError: true,
          };
        }
      }
      return {};
    };
    this._newCurriculumField.validityTransform = validityTransform;
    this._editCurriculumField.validityTransform = validityTransform;
  }

  updated(changedProperties) {
    if (changedProperties.has('_selectedIndex')) {
      if (this._selectedIndex === -1) {
        this._selected = undefined;
      }
      else {
        this._selected = this._courses[this._selectedIndex];
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
      if (!this._selected) return;

      this._editName = this._selected.name;
      this._editStudents = this._selected.students.join(", ") || '';
      this._editCurriculum = this._selected.curriculum;
    }
  }

  async _new() {
    if (this._newCurriculumField.reportValidity()) {
      let subject = this._newSubject;
      let name = this._newName;
      let students = this._newStudents.split(',');
      for (let i = 0; i < students.length; i++)
        students[i] = students[i].trim();
      let curriculum = this._newCurriculum;

      const course: Course = {subject: subject, name: name, students: students, curriculum: curriculum};
      await store.dispatch.courses.saveCourse(course);
      this._selected = course;

      this._newSubject = '';
      this._newName = '';
      this._newStudents = '';
      this._newCurriculum = '';
      this._page = 'default';
    }
  }

  async _edit() {
    if (this._editCurriculumField.reportValidity()) {
      let subject = this._editSubject;
      let name = this._editName;
      let students = this._editStudents.split(',');
      for (let i = 0; i < students.length; i++)
        students[i] = students[i].trim();
      let curriculum = this._editCurriculum;

      const course: Course = {subject: subject, name: name, students: students, curriculum: curriculum};
      await store.dispatch.courses.saveCourse(course);

      this._selected = course;

      this._editSubject = '';
      this._editName = '';
      this._editStudents = '';
      this._editCurriculum = '';
      this._page = 'default';
    }
  }

  _delete() {
    if (!this._selected) return;

    store.dispatch.courses.deleteCourse(this._selected);
    this._courses = this._courses.filter(c => c.name === this._selected?.name);

    this._selected = undefined;
    this._selectedIndex = -1;
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
        mwc-textarea, mwc-textfield, mwc-select {
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
                <span>${course.name}</span>
                <mwc-icon slot="graphic">group</mwc-icon>
              </mwc-list-item>
            `)}
          </mwc-list>
          </div>
        </div>
        <div class="form">
          <div class="page" ?active="${this._page === 'new'}">
            <label>Neuer Kurs</label>
            <mwc-select label="Fach" required @change="${e => this._newSubject = e.target.value}">
              ${this._subjects.map((subject) => html`<mwc-list-item value="${subject.name}">${subject.name}</mwc-list-item>`)}
            </mwc-select>
            <mwc-textfield label="Name" type="text" required .value=${this._newName} @change=${e => this._newName = e.target.value}></mwc-textfield>
            <mwc-textarea placeholder="Schüler" required rows="7" .value=${this._newStudents} @change=${e => this._newStudents = e.target.value}></mwc-textarea>
            <mwc-textarea id="newCurriculum" placeholder="Lernplan" rows="7" validationMessage="Kein valides JSON" .value=${this._newCurriculum} @change=${e => this._newCurriculum = e.target.value}></mwc-textarea>
            <mwc-button @click="${this._new}">Speichern</mwc-button>
          </div>
          <div class="page" ?active="${this._page === 'edit'}">
            <label>Kurs bearbeiten</label>
            <mwc-textfield type="text" disabled .value=${this._editSubject}></mwc-textfield>
            <mwc-textfield type="text" disabled .value=${this._editName}></mwc-textfield>
            <mwc-textarea placeholder="Schüler" required rows="7" .value=${this._editStudents} @change=${e => this._editStudents = e.target.value}></mwc-textarea>
            <mwc-textarea id="editCurriculum" placeholder="Lernplan" rows="7" validationMessage="Kein valides JSON" .value=${this._editCurriculum} @change=${e => this._editCurriculum = e.target.value}></mwc-textarea>
            <mwc-button @click="${this._edit}">Speichern</mwc-button>
          </div>
          <div class="page" ?active="${this._page === 'delete'}">
            <label>Kurs löschen</label>
            <div class="field">
              ${this._selected
                ? html`<label>Soll der Kurs '${this._selected.name}' wirklich gelöscht werden?</label>`
                : ''}
            </div>
            <mwc-button @click="${this._delete}">Löschen</mwc-button>
          </div>
          <div class="page" ?active="${this._page === 'default'}">
            <label>Kurs</label>
            <mwc-textfield type="text" disabled .value=${this._selected?.subject || ''}></mwc-textfield>
            <mwc-textfield type="text" disabled .value=${this._selected?.name || ''}></mwc-textfield>
            <mwc-textarea placeholder="Schüler" disabled rows="3" .value=${this._selected?.students.join(", ") || ''}></mwc-textarea>
            <mwc-textarea placeholder="Lernplan" disabled rows="3" .value=${this._selected?.curriculum || ''}></mwc-textarea>
          </div>
        </div>
        <div class="space"></div>
      </main>
    `;
  }
}
