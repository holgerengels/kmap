import { LitElement, html, css } from 'lit-element';
import {connect} from "pwa-helpers/connect-mixin";
import {store} from "../store";
import {setCardForEdit} from "../actions/app";
import {colorStyles, fontStyles} from "./kmap-styles";
import 'mega-material/button';
import './modal-dialog';

class KMapSummaryCardEditor extends connect(store)(LitElement) {
  static get styles() {
    return [
      fontStyles,
      colorStyles,
      css`
.content {
  background-color: var(--color-lightest);
  transition: background-color .5s ease-in-out;
}
      `
    ];
  }

  render() {
    return html`
      <div class="content">
        <mwc-button icon="edit" @click="${this._showEdit}"></mwc-button>
        <mwc-button icon="delete" @click="${this._showDelete}"></mwc-button>
      </div>
    `;
  }

  static get properties() {
    return {
      key: {type: String},
      card: {type: Object},
    };
  }

  constructor() {
    super();
    this.key = '';
    this.card = null;
  }

  firstUpdated(changedProperties) {
  }

  updated(changedProperties) {
    if (changedProperties.has('card') && this.card.topic) {
      if (card.links === null)
        card.links = '';
    }
  }

  stateChanged(state) {
  }

  _showEdit() {
    store.dispatch(setCardForEdit(this.card));
  }
}

window.customElements.define('kmap-summary-card-editor', KMapSummaryCardEditor);
