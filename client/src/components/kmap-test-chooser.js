import {LitElement, html, css} from 'lit-element';
import {updateTitle, updateLocation} from "../actions/app";
import {store} from "../store";
import {fetchSubjectsIfNeeded, fetchChaptersIfNeeded, fetchTreeIfNeeded, fetchChapterIfNeeded} from "../actions/tests";
import { connect } from '@captaincodeman/rdx';

import {colorStyles, elevationStyles, fontStyles} from "./kmap-styles";
import '@material/mwc-button';
import '@material/mwc-icon';
import '@material/mwc-icon-button';
import '@material/mwc-formfield';
import '@material/mwc-slider';
import '@material/mwc-top-app-bar';
import '@material/mwc-top-app-bar';
import 'mega-material/surface';

class KmapTestChooser extends connect(store, LitElement) {
  static get styles() {
    // language=CSS
    return [
      fontStyles,
      colorStyles,
      elevationStyles,
      css`
:host {
  display: contents;
}
.box {
  padding: 8px;
  background-color: whitesmoke;
}
[hidden] {
  display: none;
}
select {
  border: none;
  border-bottom: 2px solid var(--color-mediumgray);
  padding: 12px 6px;
  background-color: var(--color-lightgray);
  outline: none;
}
select:focus {
  border-bottom-color: var(--color-primary);
}
option {
  font-size:16px;
  background-color:#ffffff;
}
        mwc-button {
          vertical-align: middle;
        }
      `
    ];
  }

  render() {
    // language=HTML
    return html`
  <div class="box elevation-01">
    <label section>Thema auswählen</label>
    <br/>
    <div class="mdc-elevation--z1">
      <mwc-formfield>
        <select required @change="${e => this.subject = e.target.value}">
          <option value="" style="color:var(--color-mediumgray)">Fach</option>
          ${this.subjects.map((subject, j) => html`<option value="${subject}">${subject}</option>`)}
        </select>
      </mwc-formfield>
      ${!this._chaptersLoading ? html`
        ${this.arrangedChapters && this.arrangedChapters.length > 0 ? html`
          <mwc-formfield>
            <select required @change="${e => this.chapter = e.target.value.split(".").pop()}">
              <option value="" style="color:var(--color-mediumgray)">Kapitel</option>
              ${this.arrangedChapters.map((chapter, j) => html`<option value="${chapter}">${chapter.replace(".", " - ")}</option>`)}
            </select>
          </mwc-formfield>
        ` : html`
          ${this.subject ? html`
            <label class="secondary" style="vertical-align: sub; padding-left: 16px">Zu diesem Fach gibt es noch keine Aufgaben</label>
          ` : ''}
        `}
      ` : '' }
    </div>
    <br/><br/>
    <label ?hidden="${!this.chapter || !this._allTests || this._allTests.length === 0}">Anzahl Aufgaben: ${this._maxNumber}&nbsp;&nbsp;&nbsp; ⟶ </label>
    <mwc-button @click="${this._start}" ?disabled="${!this._allTests || this._allTests.length === 0}">Starten</mwc-button>
  </div>
    `;
  }

  static get properties() {
    return {
      active: {type: Boolean},
      subjects: {type: Array},
      subject: {type: String},
      tree: {type: Array},
      chapters: {type: Array},
      topics: {type: Array},
      arrangedChapters: {type: Array},
      chapter: {type: String },
      _chaptersLoading: { Boolean },
      _allTests: {type: Array},
      _maxNumber: {type: Number},
    };
  }

  constructor() {
    super();
    this._maxNumber = 3;
    this.tree = [];
    this._chaptersLoading = false;
  }

  firstUpdated(changedProperties) {
    store.dispatch(fetchSubjectsIfNeeded());
  }

  updated(changedProperties) {
    if (changedProperties.has("subject")) {
      store.dispatch(fetchChaptersIfNeeded(this.subject));
      store.dispatch(fetchTreeIfNeeded(this.subject));
      this.chapter = undefined;
      this.chapters = [];
      this.arrangedChapters = undefined;
      this._allTests = undefined;
    }

    if ((changedProperties.has("chapters") || changedProperties.has("tree")) && this.subject) {
      this.arrange(this.chapters, this.tree);
    }

    if (changedProperties.has("chapter")) {
      if (this.chapter)
        store.dispatch(fetchChapterIfNeeded(this.subject, this.chapter));
      else
        this._allTests = undefined;
    }
  }

  stateChanged(state) {
    this.subjects = state.tests.subjects;
    if (!this.subjects)
      this.subjects = [];

    this.chapters = state.tests.chapters;
    if (!this.chapters)
      this.chapters = [];

    this.tree = state.tests.tree;
    if (!this.tree)
      this.tree = [];

    if (this._allTests !== state.tests.tests) {
      this._allTests = state.tests.tests;

      var topics = [];
      for (var test of this._allTests) {
        if (!topics.includes(test.chapter + "." + test.topic))
          topics.push(test.chapter + "." + test.topic);
      }
      this.topics = topics;
      this._maxNumber = this._allTests.length - this._allTests.length % 3;
    }
    this._chaptersLoading = state.tests.fetchingChapters || state.tests.fetchingTree;
  }

  arrange(chapters, tree) {
    var arrangedChapters = [];
    for (var path of tree) {
      var parts = path.split(".");
      var last = parts[parts.length - 1];
      if (chapters.includes(last))
        arrangedChapters.push(path);
    }
    this.arrangedChapters = arrangedChapters;
  }

  _start(e) {
    store.dispatch(updateLocation(['#test', this.subject, ... this.chapter.split('.')].join('/')));
  }
}
customElements.define('kmap-test-chooser', KmapTestChooser);
