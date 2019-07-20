import {LitElement, html, css} from 'lit-element';
import {connect} from "pwa-helpers/connect-mixin";
import {store} from "../store";
import {setCardForEdit} from "../actions/app";
import {fontStyles, colorStyles} from "./kmap-styles";
import 'mega-material/button';
import 'mega-material/dialog';
import './kmap-summary-card-summary';
import './kmap-knowledge-card-description';

class KMapCardEditor extends connect(store)(LitElement) {

  static get styles() {
    // language=CSS
    return [
      fontStyles,
      colorStyles,
      css`
.form {
  width: 510px;
}
textarea {
  width: 100%;
  resize: vertical;
}
.preview {
  height: 52px;
  width: 100%;
  pointer-events: none;
  text-align: left;
}
.preview-scroller {
  position: absolute;
  top: -20px;
  left: 24px;
  right: 24px;
  max-height: 300px;
  overflow-y: auto;
  pointer-events: all;
  border-radius: 3px;
  box-shadow: 0 2px 2px 0 rgba(0, 0, 0, 0.14),
      0 1px 5px 0 rgba(0, 0, 0, 0.12),
      0 3px 1px -2px rgba(0, 0, 0, 0.2);
}
kmap-summary-card-summary {
  position: absolute;
  top: -20px;
  left: 24px;
  width: 300px;
  display: block;
  box-sizing: border-box;
  background-color: var(--color-lightgray);
  border-radius: 3px;
  box-shadow: 0 2px 2px 0 rgba(0, 0, 0, 0.14),
      0 1px 5px 0 rgba(0, 0, 0, 0.12),
      0 3px 1px -2px rgba(0, 0, 0, 0.2);
}
kmap-knowledge-card-description {
  display: block;
  box-sizing: border-box;
  background-color: var(--color-lightgray);
}
    `];
  }

  render() {
    return html`
<mwc-dialog id="editDialog" title="Editor">
${this.card ? html`
  <div id="form" class="form" @focus="${this._focus}">
    <div class="field">
      <label for="links">Thema</label>
      <span>${this.card.name}</span>
    </div>
    <div class="field">
      <label for="links"></label>
      <input id="links" type="text" placeholder="Verweist auf ..." value="${this.card.links}"/>
      <label for="priority"></label>
      <input id="priority" type="number" placeholder="Priorität" inputmode="numeric" min="0" step="1" value="${this.card.priority}"/>
    </div>
    <div class="field">
      <label for="summary">Kurztext</label>
      <textarea id="summary" rows="3" @keyup="${this._setSummary}" @focus="${this._focus}" @blur="${this._focus}">${this.card.summary}</textarea>
    </div>
    <div class="field">
      <label for="description">Langtext</label>
      <textarea id="description" placeholder="Langtext" rows="7" @keyup="${this._setDescription}" @focus="${this._focus}" @blur="${this._focus}">${this.card.description}</textarea>
    </div>
  </div>` : ''}
  <mwc-button class="button" slotd="action" primary @click=${this._save}>Speichern</mwc-button>
  <mwc-button class="button" slotd="action" @click=${this._cancel}>Abbrechen</mwc-button>
  <div class="preview" slot="action">
  <label style="text-align: center; display: block">» Preview «</label>
  ${this._showSummaryPreview ? html`<kmap-summary-card-summary .summary="${this._summary}"></kmap-summary-card-summary>` : ''}
  ${this._showDescriptionPreview ? html`<div class="preview-scroller"><kmap-knowledge-card-description 
    .subject="${this._subject}"
    .chapter="${this.card.chapter}"
    .topic="${this.card.name}"
    .description="${this._description}"
    ></kmap-knowledge-card-description></div>` : ''}
  </div>
</mwc-dialog>
    `;
    }

  static get properties() {
    return {
      _subject: {type: String},
      card: {type: Object},
      _summary: {type: String},
      _description: {type: String},
      _showSummaryPreview: {type: Boolean},
      _showDescriptionPreview: {type: Boolean},
    };
  }

  constructor() {
    super();
    this._subject = '';
    this.card = null;
    this._summary = '';
    this._description = '';
    this._showSummaryPreview = false;
    this._showDescriptionPreview = false;
    this._setSummary = this._debounce(this._setSummary.bind(this), 1000);
    this._setDescription = this._debounce(this._setDescription.bind(this), 1000);
  }

  firstUpdated(changedProperties) {
    this._editDialog = this.shadowRoot.getElementById('editDialog');
  }

  updated(changedProperties) {
    if (changedProperties.has('card') && this.card) {
      this._editDialog.open();
    }
  }

  stateChanged(state) {
    this._subject = state.app.dataPath[0];

    this.card = state.app.cardForEdit;
    if (this.card) {
      if (!this.card.summary)
        this.card.summary = '';
      if (!this.card.description)
        this.card.description = '';
      if (!this.card.links)
        this.card.links = '';
      if (!this.card.depends)
        this.card.depends = [];

      this._summary = this.card.summary;
      this._description = this.card.description;
    }
  }

  _focus(e) {
    if (e.type === "blur") {
      this._showSummaryPreview = false;
      this._showDescriptionPreview = false;
    }
    else if (e.type === "focus") {
      if (e.path[0].id === "summary")
        this._showSummaryPreview = true;
      else if (e.path[0].id === "description")
        this._showDescriptionPreview = true;
    }
  }

  _save() {
    this._editDialog.close();
    store.dispatch(setCardForEdit(null));
  }

  _cancel() {
    this._editDialog.close();
    store.dispatch(setCardForEdit(null));
  }

  _setSummary() {
    this._summary = this.shadowRoot.getElementById('summary').value;
  }

  _setDescription() {
    this._description = this.shadowRoot.getElementById('description').value;
  }

  _debounce(func, wait, immediate) {
    var timeout;
    return function (...args) {
      var context = this;
      var later = function () {
        timeout = null;
        if (!immediate) func.apply(context, args);
      };
      var callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) func.apply(context, args);
    }
  }
}

window.customElements.define('kmap-card-editor', KMapCardEditor);
