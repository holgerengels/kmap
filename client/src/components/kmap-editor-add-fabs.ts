import {LitElement, html, css, customElement, property, query} from 'lit-element';
import {connect} from '@captaincodeman/rdx';
import {State, store} from "../store";

import '@material/mwc-button';
import '@material/mwc-dialog';
import '@material/mwc-fab';
import '@material/mwc-textfield';
import {fontStyles, colorStyles, themeStyles} from "./kmap-styles";
import {Dialog} from "@material/mwc-dialog/mwc-dialog";
import {Card} from "../models/types";

@customElement('kmap-editor-add-fabs')
export class KMapEditorAddFabs extends connect(store, LitElement) {
  @property()
  private _currentModule: string = '';
  @property()
  private _currentSubject: string = '';
  @property()
  private _currentChapter: string = '';

  @property()
  private _opened: boolean = false;
  @property()
  private _module: string = '';
  @property()
  private _subject: string = '';
  @property()
  private _chapter: string = '';
  @property()
  private _topic: string = '';

  @property()
  private _mode: string = 'topic';
  @property()
  // @ts-ignore
  private _layers: string[] = [];
  @property()
  private _fabs: boolean = false;

  @query('#addDialog')
  // @ts-ignore
  private _addDialog: Dialog;

  mapState(state: State) {
    return {
      _currentModule: state.contentMaps.selected ? state.contentMaps.selected.module : '',
      _currentSubject: state.maps.subject,
      _currentChapter: state.maps.chapter,
      _layers: state.shell.layers,
    };
  }

  updated(changedProperties) {
    if (changedProperties.has("_layers"))
      window.setTimeout(function (that) {
        that._fabs = that._layers.includes('editor');
      }.bind(undefined, this), 300);
  }

  _header() {
    switch (this._mode) {
      case "topic":
        return 'Neues Thema';
      case "chapter":
        return 'Neues Kapitel';
      case "module":
        return 'Neues Modul';
      case "subject":
        return 'Neues Fach';
      default:
        return '';
    }
  }

  _explanation() {
    switch (this._mode) {
      case "topic":
        return `Dem Kapitel ${this._currentChapter} wird eine neues Thema hinzugefügt. Das Thema wird im Modul ${this._currentModule} gespeichert.`;
      case "chapter":
        return `Es wird ein neues Kapitel mit einem ersten Thema erzeugt. Das Thema wird im Modul ${this._currentModule} gespeichert.`;
      case "module":
        return `Es wird ein neues Modul erzeugt, indem eine erstes Thema in einem neuen Kapitel erstellt wird.`;
      case "subject":
        return `Es wird ein neues Fach erzeugt, indem ein erstes Thema im Kaptitel mit dem Namen des Fachs erstellt wird. Gespeichert wird in einem neuen Modul.`;
      default:
        return '';
    }
  }

  _open() {
    this._opened = !this._opened;
  }

  _addTopic() {
    this._opened = false;
    this._mode = 'topic';
    this._subject = this._currentSubject;
    this._module = this._currentModule;
    this._chapter = this._currentChapter;
    this._topic = '';
    this._addDialog.show();
  }

  _addChapter() {
    this._opened = false;
    this._mode = 'chapter';
    this._subject = this._currentSubject;
    this._module = this._currentModule;
    this._chapter = '';
    this._topic = '';
    this._addDialog.show();
  }

  _addModule() {
    this._opened = false;
    this._mode = 'module';
    this._subject = this._currentSubject;
    this._module = '';
    this._chapter = '';
    this._topic = '';
    this._addDialog.show();
  }

  _addSubject() {
    this._opened = false;
    this._mode = 'subject';
    this._subject = '';
    this._module = '';
    this._chapter = '';
    this._topic = '';
    this._addDialog.show();
  }

  _ok() {
    let card: Card | any = {
      added: true,
      subject: this._subject,
      module: this._module,
      chapter: this._chapter,
      topic: this._topic,
      name: this._topic,
      summary: '',
      description: '',
      links: '',
      depends: [],
      attachments: [],
    };
    console.log(card);
    store.dispatch.maps.setCardForEdit(card);
    this._addDialog.close();
  }

  _maybeEnter(event) {
    if (event.keyCode === 13) {
      event.preventDefault();
      this._ok();
    }
  }

  static get styles() {
    // language=CSS
    return [
      fontStyles,
      colorStyles,
      themeStyles,
      css`
        :host {
          display: contents;
        }
        mwc-textfield {
          margin-bottom: 4px;
        }
        mwc-fab {
          position: fixed;
          right: 16px;
          z-index: 100;
          overflow: visible;
          --mdc-theme-secondary: var(--color-secondary);
          --mdc-theme-on-secondary: black;
        }
        .primary {
          bottom: 16px;
        }
        .one {
          bottom: 104px;
        }
        .two {
          bottom: 184px;
        }
        .three {
          bottom: 264px;
        }
        .four {
          bottom: 344px;
        }
        .secondary {
          --mdc-theme-secondary: var(--color-secondary-light);
          opacity: 1;
          transition: bottom .3s ease-in-out, opacity .2s ease-in;
        }
        .secondary[exited] {
          bottom: 20px !important;
          opacity: 0;
          pointer-events: none;
        }
      `];
  }

  render() {
    // language=HTML
    return html`
      <mwc-fab icon="${this._opened ? 'clear' : 'add'}" class="primary" ?exited="${!this._fabs}" @click="${this._open}"></mwc-fab>
      <mwc-fab icon="add" label="Fach"    extended mini class="secondary one"   ?exited="${!this._opened}" @click="${this._addSubject}"></mwc-fab>
      <mwc-fab icon="add" label="Modul"   extended mini class="secondary two"   ?exited="${!this._opened || !this._currentSubject}" @click="${this._addModule}"></mwc-fab>
      <mwc-fab icon="add" label="Kapitel" extended mini class="secondary three" ?exited="${!this._opened || !this._currentModule}" @click="${this._addChapter}"></mwc-fab>
      <mwc-fab icon="add" label="Thema"   extended mini class="secondary four"  ?exited="${!this._opened || !this._currentModule || !this._currentChapter}" @click="${this._addTopic}"></mwc-fab>

      <mwc-dialog id="addDialog" title="${this._header()}">
        <form id="addForm" @keyup="${this._maybeEnter}">
          <label>${this._explanation()}</label>
          <br/>
        <mwc-textfield label="Fach" type="text" .value="${this._subject}" @change="${e => {this._subject = e.target.value; this._chapter = this._subject}}" ?disabled="${this._mode !== 'subject'}" pattern="^([^/]*)$"></mwc-textfield>
        <mwc-textfield label="Modul" type="text" .value="${this._module}" @change="${e => this._module = e.target.value}" ?disabled="${this._mode !== 'module' && this._mode !== 'subject'}" pattern="^([^/]*)$"></mwc-textfield>
        <mwc-textfield label="Kapitel" type="text" .value="${this._chapter}" @change="${e => this._chapter = e.target.value}" ?disabled="${this._mode !== 'module' && this._mode !== 'chapter'}" pattern="^([^/]*)$"></mwc-textfield>
        <mwc-textfield label="Thema" type="text" .value="${this._topic}" @change="${e => this._topic = e.target.value}" pattern="^([^/]*)$"></mwc-textfield>
        </form>
        <mwc-button slot="secondaryAction" dialogAction="cancel">Abbrechen</mwc-button>
        <mwc-button slot="primaryAction" @click="${this._ok}">Erstellen</mwc-button>
      </mwc-dialog>
    `;
  }
}

