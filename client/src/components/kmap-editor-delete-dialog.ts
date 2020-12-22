import {LitElement, html, css, customElement, property, query} from 'lit-element';
import {connect} from '@captaincodeman/rdx';
import {State, store} from "../store";

import '@material/mwc-button';
import '@material/mwc-dialog';
import {colorStyles, fontStyles} from "./kmap-styles";
import {Dialog} from "@material/mwc-dialog/mwc-dialog";
import {Card} from "../models/types";

@customElement('kmap-editor-delete-dialog')
export class KMapEditorDeleteDialog extends connect(store, LitElement) {
  @property()
  private _card?: Card = undefined;

  @query('#deleteDialog')
  // @ts-ignore
  private _deleteDialog: Dialog;

  mapState(state: State) {
    return {
      _card: state.maps.cardForDelete,
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

  _delete() {
    this._deleteDialog.close();
    if (!this._card)
      return;

    const card: Card = this._card;

    store.dispatch.maps.deleteTopic(card);
    window.setTimeout(function(subject, chapter) {
      store.dispatch.maps.load({subject: subject, chapter: chapter});
    }.bind(undefined, card.subject, card.chapter), 1000);
  }

  _cancel() {
    this._deleteDialog.close();
    store.dispatch.maps.unsetCardForDelete();
  }

  static get styles() {
    // language=CSS
    return [
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
