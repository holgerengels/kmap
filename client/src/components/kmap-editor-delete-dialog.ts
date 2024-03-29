import {html, css} from 'lit';
import {customElement, query, state} from 'lit/decorators.js';
import {Connected} from "./connected";
import {State, store} from "../store";

import '@material/mwc-button';
import '@material/mwc-dialog';
import {resetStyles, colorStyles, fontStyles} from "./kmap-styles";
import {Dialog} from "@material/mwc-dialog/mwc-dialog";
import {Card} from "../models/types";

@customElement('kmap-editor-delete-dialog')
export class KMapEditorDeleteDialog extends Connected {
  @state()
  private _card?: Card = undefined;

  @query('#deleteDialog')
  // @ts-ignore
  private _deleteDialog: Dialog;

  mapState(state: State) {
    return {
      _card: state.maps.editAction?.action === "delete" ? state.maps.editAction.card : undefined,
    };
  }

  updated(changedProperties) {
    if (changedProperties.has('_card') && this._card !== undefined) {
      if (!this._card.subject)
        this._card.subject = store.state.maps.subject || '';
      if (!this._card.chapter)
        this._card.chapter = store.state.maps.chapter || '';

      this._deleteDialog.show();
    }
  }

  async _delete() {
    this._deleteDialog.close();
    if (!this._card)
      return;

    const card: Card = this._card;

    await store.dispatch.maps.deleteTopic(card);
    window.setTimeout(function () {
      store.dispatch.maps.load();
    }, 1000);
  }

  _cancel() {
    this._deleteDialog.close();
    store.dispatch.maps.unsetEditAction();
  }

  static get styles() {
    // language=CSS
    return [
      resetStyles,
      fontStyles,
      colorStyles,
      css`
        form {
          width: 510px;
        }
    `];
  }

  render() {
    // language=HTML
    return html`
        <mwc-dialog id="deleteDialog" title="Löschen">
          ${this._card ? html`
          <form>
            <div class="field">
              <span>Soll die Wissenskarte zum Thema <i>${this._card.topic}</i> von der Wissenslandkarte zum Kapitel <i>${this._card.chapter}</i>
              aus dem Modul <i>${this._card.module}</i> im Fach <i>${this._card.subject}</i> wirklich gelöscht werden?</span>
            </div>
          </form>
          ` : '' }
          <mwc-button slot="secondaryAction" @click=${this._cancel}>Abbrechen</mwc-button>
          <mwc-button slot="primaryAction" @click=${this._delete}>Löschen</mwc-button>
        </mwc-dialog>
    `;
  }
}
