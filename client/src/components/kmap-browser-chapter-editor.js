import { LitElement, html, css } from 'lit-element';
import {connect} from "pwa-helpers/connect-mixin";
import {store} from "../store";
import {setCardForEdit, setCardForRename, setCardForDelete} from "../actions/app";
import {colorStyles, fontStyles} from "./kmap-styles";
import 'mega-material/button';
import './modal-dialog';

class KMapBrowserChapterEditor extends connect(store)(LitElement) {
  static get styles() {
    // language=CSS
    return [
      fontStyles,
      colorStyles,
      css`
mega-button[disabled] {
  pointer-events: none;
  color: var(--color-darkgray);
  opacity: .5;
}
      `
    ];
  }

  render() {
    return html`
      <mega-button icon="edit" ?disabled="${!this._enabled}" @click="${this._showEdit}"></mega-button>
      <mega-button icon="delete" ?disabled="${!this._enabled}" @click="${this._showDelete}"></mega-button>
    `;
  }

  static get properties() {
    return {
      subject: {type: String},
      chapter: {type: String},
      chapterCard: {type: Object},
      _selectedModule: {type: Object},
      _enabled: {type: Boolean},
    };
  }

  constructor() {
    super();
    this.module = '';
    this.subject = '';
    this.chapter = '';
    this.summary = '';
    this.attachments = [];
    this._enabled = false;
  }

  firstUpdated(changedProperties) {
  }

  updated(changedProperties) {
    if (changedProperties.has("module") || changedProperties.has("subject") || changedProperties.has("_selectedModule")) {
      this._enabled = this._selectedModule && ((this.chapterCard
        && this.subject === this._selectedModule.subject
        && this.chapterCard.module === this._selectedModule.module)
        || !this.chapterCard);
    }
  }

  stateChanged(state) {
    this._selectedModule = state.contentMaps.selectedModule;
  }

  _showEdit() {
    let card = this.chapterCard ? {
      module: this.chapterCard.module,
      subject: this.subject,
      chapter: this.chapter,
      topic: '_',
      summary: this.chapterCard.summary,
      description: this.chapterCard.description,
      attachments: this.chapterCard.attachments,
    } : {
      added: true,
      module: this._selectedModule.module,
      subject: this._selectedModule.subject,
      chapter: this.chapter,
      topic: '_',
    };
    store.dispatch(setCardForEdit(card));
  }

  _showDelete() {
    let card = {
      module: this._selectedModule.module,
      subject: this._selectedModule.subject,
      chapter: this.chapter,
      topic: '_',
    };
    store.dispatch(setCardForDelete(card));
  }
}

window.customElements.define('kmap-browser-chapter-editor', KMapBrowserChapterEditor);