import {LitElement, html, css, customElement, property, query} from 'lit-element';
import {connect} from '@captaincodeman/rdx';
import {State, store} from "../store";

import '@material/mwc-button';
import '@material/mwc-dialog';
import '@material/mwc-fab';
import '@material/mwc-textfield';
import './validating-form';

import {fontStyles, colorStyles, themeStyles} from "./kmap-styles";
import {Test} from "../models/tests";
import {Dialog} from "@material/mwc-dialog/mwc-dialog";

@customElement('kmap-test-editor-add-fabs')
export class KMapTestEditorAddFabs extends connect(store, LitElement) {
  @property()
  private _currentSet: string = '';
  @property()
  private _currentSubject: string = '';

  @property()
  private _opened: boolean = false;
  @property()
  private _set: string = '';
  @property()
  private _subject: string = '';
  @property()
  private _key: string = '';

  @property()
  private _mode: string = 'test';
  @property()
  // @ts-ignore
  private _layers: string[] = [];
  @property()
  private _fabs: boolean = false;

  @query('#addDialog')
  // @ts-ignore
  private _addDialog: Dialog;

  @property()
  private _valid: boolean = false;

  mapState(state: State) {
    return {
      _currentSet: state.contentSets.selected ? state.contentSets.selected.set : '',
      _currentSubject: state.contentSets.selected ? state.contentSets.selected.subject : '',
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
    this._addDialog.show();
  }

  _addSet() {
    this._opened = false;
    this._mode = 'set';
    this._subject = this._currentSubject;
    this._set = '';
    this._key = '';
    this._addDialog.show();
  }

  _ok() {
    let test: Test | any = {
      added: true,
      subject: this._subject,
      set: this._set,
      key: this._key,
    };
    console.log(test);
    store.dispatch.tests.setTestForEdit(test);
    this._addDialog.close();
  }

  _maybeEnter(event) {
    if (event.keyCode === 13 && this._valid) {
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
      <mwc-fab icon="add" label="Set"    extended mini class="secondary one"  ?exited="${!this._opened}" @click="${this._addSet}"></mwc-fab>
      <mwc-fab icon="add" label="Test"   extended mini class="secondary two"  ?exited="${!this._opened || !this._currentSet}" @click="${this._addTest}"></mwc-fab>

      <mwc-dialog id="addDialog" title="${this._header()}">
        <validating-form id="addForm" @keyup="${this._maybeEnter}" @validity="${e => this._valid = e.target.valid}">
          <label>${this._explanation()}</label>
          <br/>
        <mwc-textfield label="Fach" type="text" .value="${this._subject}" @change="${e => this._subject = e.target.value }" ?disabled="${this._mode !== 'set'}" pattern="[^/]*" required validate></mwc-textfield>
        <mwc-textfield label="Set" type="text" .value="${this._set}" @change="${e => this._set = e.target.value}" ?disabled="${this._mode !== 'set'}" pattern="[^/]*" required validate></mwc-textfield>
        <mwc-textfield label="Titel" type="text" .value="${this._key}" @change="${e => this._key = e.target.value}" pattern="[^/]*" required validate></mwc-textfield>
        </validating-form>
        <mwc-button slot="secondaryAction" dialogAction="cancel">Abbrechen</mwc-button>
        <mwc-button slot="primaryAction" @click="${this._ok}" ?disabled="${!this._valid}">Erstellen</mwc-button>
      </mwc-dialog>
    `;
  }
}
