import {LitElement, html, css} from 'lit-element';
import { connect } from '@captaincodeman/rdx';
import {store} from "../store";
import {setTestForEdit} from "../actions/app";
import {fontStyles, colorStyles} from "./kmap-styles";

import '@material/mwc-button';
import '@material/mwc-dialog';
import '@material/mwc-fab';
import '@material/mwc-textfield';

class KMapTestEditorAddFabs extends connect(store, LitElement) {
  static get styles() {
    // language=CSS
    return [
      fontStyles,
      colorStyles,
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
      <mwc-fab icon="add" label="Set"    extended mini class="secondary one"  ?exited="${!this._opened}" @click="${this._addSet}"></mwc-fab>
      <mwc-fab icon="add" label="Test"   extended mini class="secondary two"  ?exited="${!this._opened || !this._currentSet}" @click="${this._addTest}"></mwc-fab>

      <mwc-dialog id="addDialog" title="${this._header()}">
        <form id="addForm" @keyup="${this._maybeEnter}">
          <label>${this._explanation()}</label>
          <br/>
        <mwc-textfield label="Fach" type="text" .value="${this._subject}" @change="${e => this._subject = e.target.value }" ?disabled="${this._mode !== 'set'}"></mwc-textfield>
        <mwc-textfield label="Set" type="text" .value="${this._set}" @change="${e => this._set = e.target.value}" ?disabled="${this._mode !== 'set'}"></mwc-textfield>
        <mwc-textfield label="Titel" type="text" .value="${this._key}" @change="${e => this._key = e.target.value}"></mwc-textfield>
        </form>
        <mwc-button slot="secondaryAction" dialogAction="cancel">Abbrechen</mwc-button>
        <mwc-button slot="primaryAction" @click="${this._ok}">Erstellen</mwc-button>
      </mwc-dialog>
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
    this.shadowRoot.getElementById('addDialog').show();
  }

  _addSet() {
    this._opened = false;
    this._mode = 'set';
    this._subject = this._currentSubject;
    this._set = '';
    this._key = '';
    this.shadowRoot.getElementById('addDialog').show();
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
    this.shadowRoot.getElementById('addDialog').close();
  }
}

window.customElements.define('kmap-test-editor-add-fabs', KMapTestEditorAddFabs);
