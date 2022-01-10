import {html, css} from 'lit';
import {customElement, state} from 'lit/decorators.js';
import {Connected} from "./connected";
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
import {colorStyles, elevationStyles, fontStyles} from "./kmap-styles";
import {Subject} from "../models/subjects";
import {count, TopicCount} from "../models/tests";

@customElement('kmap-test-chooser')
export class KmapTestChooser extends Connected {
  @state()
  private _subjects: Subject[] = [];
  @state()
  private _subject: string = '';
  @state()
  private _tree?: string[] = undefined;
  @state()
  private _chapters?: string[] = undefined;
  @state()
  private _chaptersLoading: boolean = false;
  @state()
  private _testTopics?: TopicCount[];

  @state()
  private _arrangedChapters: string[] = [];

  @state()
  private _chapter: string = '';

  @state()
  private _maxNumber?: number;

  mapState(state: State) {
    return {
      _subjects: state.subjects.subjects,
      _chapters: state.tests.chapters,
      _tree: state.tests.tree,
      _chaptersLoading: state.tests.loadingChapters || state.tests.loadingTree,
      _testTopics: state.tests.topics,
    };
  }

  updated(changedProperties) {
    if (changedProperties.has("_subject")) {
      store.dispatch.tests.loadChapters(this._subject);
      store.dispatch.tests.loadTree(this._subject);
      this._chapter = '';
      this._arrangedChapters = [];
    }

    if ((changedProperties.has("_chapters") || changedProperties.has("_tree")))
      this.arrange(this._chapters, this._tree);

    if (changedProperties.has("_chapter")) {
      if (this._chapter)
        this._maxNumber = this._testTopics !== undefined ? count(this._testTopics, this._chapter) : undefined;
      else
        this._maxNumber = undefined;
    }
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
    store.dispatch.routing.replace(`/app/test/${[this._subject, ...this._chapter.split('.')].join('/')}`);
  }

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
          ${this._subjects.map((subject) => html`<mwc-list-item value="${subject.name}">${subject.name}</mwc-list-item>`)}
        </mwc-select>
      </mwc-formfield>
      ${!this._chaptersLoading ? html`
        ${this._arrangedChapters ? html`
          <mwc-formfield>
            <mwc-select label="Kapitel" naturalMenuWidth required @change="${e => this._chapter = e.target.value.split(".").pop()}">
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
    <label ?hidden="${!this._chapter || !this._maxNumber}">Anzahl Aufgaben: ${this._maxNumber}&nbsp;&nbsp;&nbsp; ⟶ </label>
    <mwc-button @click="${this._start}" ?disabled="${!this._maxNumber}">Starten</mwc-button>
  </div>
    `;
  }
}
