import {LitElement, html, css} from 'lit-element';
import {connect} from "pwa-helpers/connect-mixin";
import {store} from "../store";
import {fontStyles, colorStyles} from "./kmap-styles";
import 'mega-material/fab';
import {setTestForEdit} from "../actions/app";

class KMapTestEditorAddFabs extends connect(store)(LitElement) {

  static get styles() {
    // language=CSS
    return [
      fontStyles,
      colorStyles,
      css`
mega-fab {
  position: absolute;
  right: 16px;
  z-index: 100;
  --mega-theme-secondary: var(--color-secondary);
  --mega-theme-on-secondary: black;
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
  --mega-theme-secondary: var(--color-secondary-light);
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
      <mega-fab icon="${this._opened ? 'clear' : 'add'}" class="primary" ?exited="${!this._fabs}" @click="${this._open}"></mega-fab>
      <mega-fab icon="add" label="Set"   mini class="secondary one"   ?exited="${!this._opened}" @click="${this._addSet}"></mega-fab>
      <mega-fab icon="add" label="Test"   mini class="secondary two"  ?exited="${!this._opened || !this._currentSet}" @click="${this._addTest}"></mega-fab>
      
      <mega-dialog id="addDialog" title="${this._header()}">
        <form id="addForm" @keyup="${this._maybeEnter}">
          <label>${this._explanation()}</label>
          <br/>
          <div class="field">
            <label for="subject">Fach</label>
            <input id="subject" name="subject" type="text" .value="${this._subject}" @change="${e => this._subject = e.target.value}" ?readonly="${this._mode !== 'set'}"/>
          </div>
          <div class="field">
            <label for="set">Set</label>
            <input id="set" name="set" type="text" .value="${this._set}" @change="${e => this._set = e.target.value}" ?readonly="${this._mode !== 'set'}"/>
          </div>
          <div class="field">
            <label for="key">Titel</label>
            <input id="key" name="key" type="text" .value="${this._key}" @change="${e => this._key = e.target.value}"/>
          </div>
        </form>
        <mega-button slot="action" primary close @click="${this._ok}">Erstellen</mega-button>
        <mega-button slot="action" primary close @click="${this._cancel}">Abbrechen</mega-button>
      </mega-dialog>
    `;
  }

  static get properties() {
    return {
      _currentSubject: {type: String},
      _currentSet: {type: String},
      _opened: {type: Boolean},
      _subject: {type: String},
      _set: {type: String},
      _key: {type: String},
      _mode: {type: String},
      _layers: {type: Array},
      _fabs: {type: Boolean},
    };
  }

  constructor() {
    super();
    this._currentSubject = '';
    this._currentSet = '';
    this._opened = false;
    this._subject = '';
    this._set = '';
    this._key = '';
    this._mode = 'test';
    this._layers = [];
  }

  updated(changedProperties) {
    if (changedProperties.has("_layers"))
      window.setTimeout(function (that) {
        that._fabs = that._layers.includes('editor');
      }.bind(undefined, this), 300);
  }

  stateChanged(state) {
    if (state.contentSets.selectedSet) {
      this._currentSubject = state.contentSets.selectedSet.subject;
      this._currentSet = state.contentSets.selectedSet.set;
    }
    else {
      this._currentSubject = '';
      this._currentSet = '';
    }
    this._layers = state.app.layers;
  }

  _header() {
    switch (this._mode) {
      case "test":
        return 'Neue Aufgabe';
      case "set":
        return 'Neues Set';
      default:
        return '';
    }
  }

  _explanation() {
    switch (this._mode) {
      case "test":
        return `Dem Set ${this._currentSet} im Fach ${this._currentSubject} wird eine neue Aufgabe hinzugefügt.`;
      case "set":
        return `Es wird ein neues Set erzeugt, indem eine erste Aufgabe erstellt wird.`;
      default:
        return '';
    }
  }

  _open() {
    this._opened = !this._opened;
  }

  _addTest() {
    this._opened = false;
    this._mode = 'test';
    this._subject = this._currentSubject;
    this._set = this._currentSet;
    this._key = '';
    this.shadowRoot.getElementById('addDialog').open();
  }

  _addSet() {
    this._opened = false;
    this._mode = 'set';
    this._subject = this._currentSubject;
    this._set = '';
    this._key = '';
    this.shadowRoot.getElementById('addDialog').open();
  }

  _ok() {
    let test = {
      added: true,
      subject: this._subject,
      set: this._set,
      key: this._key,
    };
    console.log(test);
    store.dispatch(setTestForEdit(test));
  }
}

window.customElements.define('kmap-test-editor-add-fabs', KMapTestEditorAddFabs);
