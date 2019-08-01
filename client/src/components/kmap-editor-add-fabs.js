import {LitElement, html, css} from 'lit-element';
import {connect} from "pwa-helpers/connect-mixin";
import {store} from "../store";
import {modules, forgetModules, selectModule} from "../actions/content-maps";
import {fontStyles, colorStyles} from "./kmap-styles";
import 'mega-material/fab';
import {setCardForEdit} from "../actions/app";

class KMapEditorAddFabs extends connect(store)(LitElement) {

  static get styles() {
    // language=CSS
    return [
      fontStyles,
      colorStyles,
      css`
mwc-fab {
  position: absolute;
  right: 16px;
  z-index: 100;
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
  opacity: 1;
  transition: bottom .3s ease-in-out, opacity .2s ease-in;
}

.secondary[exited] {
  bottom: 20px !important;
  opacity: 0;
}
input {
  float: right;
}
[readonly] {
  background-color: var(--color-lightgray);
}
      `];
  }

  render() {
    // language=HTML
    return html`
      <mwc-fab icon="${this._opened ? 'remove' : 'add'}" class="primary" @click="${this._open}"></mwc-fab>
      <mwc-fab icon="add" label="Fach"         mini class="secondary one"   ?exited="${!this._opened}" @click="${this._addSubject}"></mwc-fab>
      <mwc-fab icon="add" label="Modul"        mini class="secondary two"   ?exited="${!this._opened || !this._currentSubject}" @click="${this._addModule}"></mwc-fab>
      <mwc-fab icon="add" label="Landkarte"    mini class="secondary three" ?exited="${!this._opened || !this._currentModule}" @click="${this._addChapter}"></mwc-fab>
      <mwc-fab icon="add" label="Wissenskarte" mini class="secondary four"  ?exited="${!this._opened || !this._currentModule || !this._currentChapter}" @click="${this._addTopic}"></mwc-fab>
      
      <mwc-dialog id="addDialog" title="${this._title()}">
        <form id="addForm" @keyup="${this._maybeEnter}">
          <label>${this._explanation()}</label>
          <br/>
          <div class="field">
            <label for="subject">Fach</label>
            <input id="subject" name="subject" type="text" .value="${this._subject}" @change="${e => {this._subject = e.target.value; this._chapter = this._subject}}" ?readonly="${this._mode !== 'subject'}"/>
          </div>
          <div class="field">
            <label for="module">Modul</label>
            <input id="module" name="module" type="text" .value="${this._module}" @change="${e => this._module = e.target.value}" ?readonly="${this._mode !== 'module' && this._mode !== 'subject'}"/>
          </div>
          <div class="field">
            <label for="chapter">Kapitel</label>
            <input id="chapter" name="chapter" type="text" .value="${this._chapter}" @change="${e => this._chapter = e.target.value}" ?readonly="${this._mode !== 'module' && this._mode !== 'chapter'}"/>
          </div>
          <div class="field">
            <label for="topic">Thema</label>
            <input id="topic" name="topic" type="text" .value="${this._topic}" @change="${e => this._topic = e.target.value}"/>
          </div>
        </form>
        <mwc-button slot="action" primary close @click="${this._ok}">Erstellen</mwc-button>
        <mwc-button slot="action" primary close @click="${this._cancel}">Abbrechen</mwc-button>
      </mwc-dialog>
    `;
  }

  static get properties() {
    return {
      _currentSubject: {type: String},
      _currentModule: {type: String},
      _currentChapter: {type: String},
      _opened: {type: Boolean},
      _subject: {type: String},
      _module: {type: String},
      _chapter: {type: String},
      _topic: {type: String},
      _mode: {type: String},
    };
  }

  constructor() {
    super();
    this._currentSubject = '';
    this._currentModule = '';
    this._currentChapter = '';
    this._opened = false;
    this._subject = '';
    this._module = '';
    this._chapter = '';
    this._topic = '';
    this._mode = 'topic';
  }

  updated(changedProperties) {
  }

  stateChanged(state) {
    if (state.maps.map) {
      this._currentSubject = state.maps.map.subject;
      this._currentChapter = state.maps.map.chapter;
    }
    if (state.contentMaps.selectedModule)
      this._currentModule = state.contentMaps.selectedModule.module;
  }

  _title() {
    switch (this._mode) {
      case "topic":
        return 'Neue Wissenskarte';
      case "chapter":
        return 'Neue Wissenslandkarte';
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
        return `Der Wissenslandkarte ${this._currentChapter} wird eine neue Wissenskarte hinzugefügt. Die Wissenskarte wird im Modul ${this._currentModule} gespeichert.`;
      case "chapter":
        return `Es wird eine neue Wissenslandkarte mit einer ersten Wissenskarte erzeugt. Die Wissenskarte wird im Modul ${this._currentModule} gespeichert.`;
      case "module":
        return `Es wird ein neues Modul erzeugt, indem eine erste Wissenskarte auf einer neuen Wissenslandkarte erstellt wird.`;
      case "subject":
        return `Es wird ein neues Fach erzeugt, indem eine erste Wissenskarte auf der Wissenslandkarte mit dem Namen des Fachs erstellt wird. Gespeichert wird in einem neuen Modul.`;
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
    this.shadowRoot.getElementById('addDialog').open();
  }

  _addChapter() {
    this._opened = false;
    this._mode = 'chapter';
    this._subject = this._currentSubject;
    this._module = this._currentModule;
    this._chapter = '';
    this._topic = '';
    this.shadowRoot.getElementById('addDialog').open();
  }

  _addModule() {
    this._opened = false;
    this._mode = 'module';
    this._subject = this._currentSubject;
    this._module = '';
    this._chapter = '';
    this._topic = '';
    this.shadowRoot.getElementById('addDialog').open();
  }

  _addSubject() {
    this._opened = false;
    this._mode = 'subject';
    this._subject = '';
    this._module = '';
    this._chapter = '';
    this._topic = '';
    this.shadowRoot.getElementById('addDialog').open();
  }

  _ok() {
    let card = {
      added: true,
      subject: this._subject,
      module: this._module,
      chapter: this._chapter,
      topic: this._topic,
      name: this._topic,
    };
    console.log(card);
    store.dispatch(setCardForEdit(card));
  }
}

window.customElements.define('kmap-editor-add-fabs', KMapEditorAddFabs);
