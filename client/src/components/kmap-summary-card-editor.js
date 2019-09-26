import { LitElement, html, css } from 'lit-element';
import {connect} from "pwa-helpers/connect-mixin";
import {store} from "../store";
import {setCardForEdit, setCardForRename, setCardForDelete} from "../actions/app";
import {colorStyles, fontStyles} from "./kmap-styles";
import 'mega-material/button';
import './modal-dialog';

class KMapSummaryCardEditor extends connect(store)(LitElement) {
  static get styles() {
    // language=CSS
    return [
      fontStyles,
      colorStyles,
      css`
.content {
  background-color: var(--color-lightest);
  transition: background-color .5s ease-in-out;
}
mega-button[disabled] {
  pointer-events: none;
  color: var(--color-darkgray);
  opacity: .5;
}
.warn {
  color: darkred;
  margin: 16px;  
}
      `
    ];
  }

  render() {
    return html`
      <div class="content">
        <mega-button icon="edit" ?disabled="${!this._enabled}" @click="${this._showEdit}"></mega-button>
        <mega-button icon="label" ?disabled="${!this._enabled}" @click="${this._showRename}"></mega-button>
        <mega-button icon="delete" ?disabled="${!this._enabled}" @click="${this._showDelete}"></mega-button>
      </div>
      <div class="content">
        ${this.card.annotations ? html`<div class="warn">${this.card.annotations}</div>` : ''}
      </div>
    `;
  }

  static get properties() {
    return {
      _subject: {type: String},
      _selectedModule: {type: Object},
      key: {type: String},
      card: {type: Object},
      _enabled: {type: Boolean},
      _annotated: {type: Boolean},
    };
  }

  constructor() {
    super();
    this._subject = '';
    this.key = '';
    this.card = null;
    this._enabled = false;
    this._annotated = false;
  }

  firstUpdated(changedProperties) {
  }

  updated(changedProperties) {
    if (changedProperties.has("card") || changedProperties.has("_selectedModule")) {
      this._enabled = this.card && this._selectedModule
        && this._subject === this._selectedModule.subject
        && this.card.module === this._selectedModule.module;
    }
  }

  stateChanged(state) {
    this._subject = state.maps.map.subject;
    this._selectedModule = state.contentMaps.selectedModule;
  }

  _showEdit() {
    store.dispatch(setCardForEdit(this.card));
  }

  _showRename() {
    store.dispatch(setCardForRename(this.card));
  }

  _showDelete() {
    store.dispatch(setCardForDelete(this.card));
  }

  getState() { return 0; }
}

window.customElements.define('kmap-summary-card-editor', KMapSummaryCardEditor);
