import {html, css} from 'lit';
import {customElement, property, state} from 'lit/decorators.js';
import {Connected} from "./connected";
import {State, store} from "../store";

import '@material/mwc-button';
import {colorStyles, fontStyles} from "./kmap-styles";
import {Module} from "../models/contentMaps";
import {Card} from "../models/types";

@customElement('kmap-summary-card-editor')
export class KMapSummaryCardEditor extends Connected {

  @state()
  private _subject: string = '';
  @state()
  private _selectedModule?: Module = undefined;
  @property()
  private card?: Card = undefined;

  @state()
  private _enabled: boolean = false;

  mapState(state: State) {
    return {
      _subject: state.maps.subject,
      _selectedModule: state.contentMaps.selected,
    };
  }

  willUpdate(changedProperties) {
    if (changedProperties.has("card") || changedProperties.has("_selectedModule")) {
      this._enabled = this.card !== undefined && this._selectedModule !== undefined
        && this._subject === this._selectedModule.subject
        && this.card.module === this._selectedModule.module;
    }
  }

  _showEdit(e) {
    e.cancelBubble = true;
    if (this.card !== undefined)
      store.dispatch.maps.setEditAction({ card: this.card, action: "edit" });
  }

  _showRename(e) {
    e.cancelBubble = true;
    if (this.card !== undefined)
      store.dispatch.maps.setEditAction({ card: this.card, action: "rename" });
  }

  _showMove(e) {
    e.cancelBubble = true;
    if (this.card !== undefined)
      store.dispatch.maps.setEditAction({ card: this.card, action: "move" });
  }

  _showDelete(e) {
    e.cancelBubble = true;
    if (this.card !== undefined)
      store.dispatch.maps.setEditAction({ card: this.card, action: "delete" });
  }

  getState() { return 0; }

  static get styles() {
    // language=CSS
    return [
      fontStyles,
      colorStyles,
      css`
        :host {
          display: block;
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
      <mwc-button icon="edit" ?disabled="${!this._enabled}" @click="${this._showEdit}" title="editieren"></mwc-button>
      <mwc-button icon="label" ?disabled="${!this._enabled}" @click="${this._showRename}" title="umbenennen"></mwc-button>
      <mwc-button icon="read_more" ?disabled="${!this._enabled}" @click="${this._showMove}" title="verschieben"></mwc-button>
      <mwc-button icon="delete" ?disabled="${!this._enabled}" @click="${this._showDelete}" title="löschen"></mwc-button>
      ${this.card !== undefined && this.card.annotations ? html`<div class="warn">${this.card.annotations}</div>` : ''}
    `;
  }
}
