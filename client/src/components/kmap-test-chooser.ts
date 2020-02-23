import {LitElement, html, css, customElement, property} from 'lit-element';
import { connect } from '@captaincodeman/rdx';
import {State, store} from "../store";

import '@material/mwc-button';
import '@material/mwc-formfield';
import '@material/mwc-icon';
import '@material/mwc-icon-button';
import '@material/mwc-list/mwc-list-item';
import '@material/mwc-select';
import '@material/mwc-slider';
import '@material/mwc-top-app-bar';
import '@material/mwc-top-app-bar';
import '@material/menu-surface';
import {colorStyles, elevationStyles, fontStyles, themeStyles} from "./kmap-styles";

@customElement('kmap-test-chooser')
export class KmapTestChooser extends connect(store, LitElement) {
  @property()
  private _subjects: string[] = [];
  @property()
  private _subject: string = '';
  @property()
  private _tree?: string[] = undefined;
  @property()
  private _chapters?: string[] = undefined;
  @property()
  private _chaptersLoading: boolean = false;

  @property()
  private _arrangedChapters: string[] = [];

  @property()
  private _chapter: string = '';

  @property()
  private _allTests?: string[] = undefined;
  @property()
  private _maxNumber: number = 3;

  mapState(state: State) {
    return {
      _subjects: state.subjects.subjects,
      _chapters: state.tests.chapters ? state.tests.chapters.chapters : [],
      _tree: state.tests.tree,
      _chaptersLoading: state.tests.loadingChapters || state.tests.loadingTree,
      _allTests: state.tests.tests,
      _maxNumber: state.tests.tests ? state.tests.tests.length - state.tests.tests.length % 3 : -1,
    };
  }

  updated(changedProperties) {
    if (changedProperties.has("_subject")) {
      store.dispatch.tests.loadChapters(this._subject);
      store.dispatch.tests.loadTree(this._subject);
      this._chapter = '';
      this._arrangedChapters = [];
      this._allTests = undefined;
    }

    if ((changedProperties.has("_chapters") || changedProperties.has("_tree")))
      this.arrange(this._chapters, this._tree);

    if (changedProperties.has("_chapter")) {
      if (this._chapter)
        store.dispatch.tests.loadTests({subject: this._subject, chapter: this._chapter});
      else
        this._allTests = undefined;
    }
  }

  stateChanged() {
    /*
    var topics = [];
    for (var test of this._allTests) {
      if (!topics.includes(test.chapter + "." + test.topic))
        topics.push(test.chapter + "." + test.topic);
    }
    this.topics = topics;
     */
  }

  arrange(chapters?: string[], tree?: string[]) {
    if (chapters && tree) {
      var arrangedChapters: string[] = [];
      for (var path of tree) {
        var parts = path.split(".");
        var last = parts[parts.length - 1];
        if (chapters.includes(last))
          arrangedChapters.push(path);
      }
      this._arrangedChapters = arrangedChapters;
    }
    else
      this._arrangedChapters = [];
  }

  _start() {
    // @ts-ignore
    store.dispatch.routing.replace(`/app/test/${[this._subject, ...this._chapter.split('.')].join('/')}`);
  }

  static get styles() {
    // language=CSS
    return [
      fontStyles,
      colorStyles,
      themeStyles,
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
    <div>
      <mwc-formfield>
        <mwc-select label="Fach" required @change="${e => this._subject = e.target.value}">
          ${this._subjects.map((subject) => html`<mwc-list-item value="${subject}">${subject}</mwc-list-item>`)}
        </mwc-select>
      </mwc-formfield>
      ${!this._chaptersLoading ? html`
        ${this._arrangedChapters ? html`
          <mwc-formfield>
            <mwc-select label="Kapitel" required @change="${e => this._chapter = e.target.value.split(".").pop()}">
              ${this._arrangedChapters.map((chapter) => html`<mwc-list-item value="${chapter}">${chapter.replace(".", " - ")}</mwc-list-item>`)}
            </mwc-select>
          </mwc-formfield>
        ` : html`
          ${this._subject ? html`
            <label class="secondary" style="vertical-align: sub; padding-left: 16px">Zu diesem Fach gibt es noch keine Aufgaben</label>
          ` : ''}
        `}
      ` : '' }
    </div>
    <br/><br/>
    <label ?hidden="${!this._chapter || !this._allTests}">Anzahl Aufgaben: ${this._maxNumber}&nbsp;&nbsp;&nbsp; ⟶ </label>
    <mwc-button @click="${this._start}" ?disabled="${!this._allTests}">Starten</mwc-button>
  </div>
    `;
  }
}
