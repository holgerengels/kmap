import {LitElement, html, css, customElement, property} from 'lit-element';
import { connect } from '@captaincodeman/rdx';
import {State, store} from "../store";

import '@material/mwc-button';
import {Card} from "../models/maps";
import {colorStyles, fontStyles, themeStyles} from "./kmap-styles";
import {Module} from "../models/contentMaps";

@customElement('kmap-summary-card-editor')
export class KMapSummaryCardEditor extends connect(store, LitElement) {

  @property()
  private _subject: string = '';
  @property()
  private _selectedModule?: Module = undefined;
  @property()
  private card?: Card = undefined;

  @property()
  private _enabled: boolean = false;

  mapState(state: State) {
    return {
      _subject: state.maps.subject,
      _selectedModule: state.contentMaps.selected,
    };
  }

  updated(changedProperties) {
    if (changedProperties.has("card") || changedProperties.has("_selectedModule")) {
      this._enabled = this.card !== undefined && this._selectedModule !== undefined
        && this._subject === this._selectedModule.subject
        && this.card.module === this._selectedModule.module;
    }
  }

  _showEdit() {
    if (this.card !== undefined)
      store.dispatch.maps.setCardForEdit(this.card);
  }

  _showRename() {
    if (this.card !== undefined)
      store.dispatch.maps.setCardForRename(this.card);
  }

  _showDelete() {
    if (this.card !== undefined)
      store.dispatch.maps.setCardForDelete(this.card);
  }

  getState() { return 0; }

  static get styles() {
    // language=CSS
    return [
      fontStyles,
      colorStyles,
      themeStyles,
      css`
        :host {
          display: block;
          background-color: var(--color-lightest);
          transition: background-color .5s ease-in-out;
          font-family: Roboto,sans-serif;
          -webkit-font-smoothing: antialiased;
          font-size: 0.95rem;
          font-weight: 500;
        }
        mwc-button[disabled] {
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
      <mwc-button icon="edit" ?disabled="${!this._enabled}" @click="${this._showEdit}"></mwc-button>
      <mwc-button icon="label" ?disabled="${!this._enabled}" @click="${this._showRename}"></mwc-button>
      <mwc-button icon="delete" ?disabled="${!this._enabled}" @click="${this._showDelete}"></mwc-button>
      ${this.card && this.card.annotations ? html`<div class="warn">${this.card.annotations}</div>` : ''}
    `;
  }
}
