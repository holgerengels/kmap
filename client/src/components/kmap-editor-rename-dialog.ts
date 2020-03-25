import {LitElement, html, css, customElement, property, query} from 'lit-element';
import {connect} from '@captaincodeman/rdx';
import {State, store} from "../store";

import '@material/mwc-button';
import '@material/mwc-dialog';
import '@material/mwc-textfield';
import {colorStyles, fontStyles, themeStyles} from "./kmap-styles";
import {Dialog} from "@material/mwc-dialog/mwc-dialog";
import {Card} from "../models/types";

@customElement('kmap-editor-rename-dialog')
export class KMapEditorRenameDialog extends connect(store, LitElement) {
  @property()
  private _card?: Card = undefined;
  @property()
  private _newName: string = '';

  @query('#renameDialog')
  // @ts-ignore
  private _renameDialog: Dialog;

  mapState(state: State) {
    return {
      _card: state.maps.cardForRename,
    };
  }

  updated(changedProperties) {
    if (changedProperties.has('_card') && this._card) {
      if (!this._card.subject)
        this._card.subject = store.state.maps.subject;
      if (!this._card.chapter)
        this._card.chapter = store.state.maps.chapter;

      this._newName = '';
      this._renameDialog.show();
    }
  }

  _rename() {
    this._renameDialog.close();
    if (!this._card)
      return;

    const card: Card | any = this._card;
    card.newName = this._newName;

    store.dispatch.maps.renameTopic(card);
    window.setTimeout(function(subject, chapter) {
      store.dispatch.maps.load({subject: subject, chapter: chapter});
    }.bind(undefined, card.subject, card.chapter), 1000);
  }

  _cancel() {
    this._renameDialog.close();
    store.dispatch.maps.unsetCardForRename();
  }

  static get styles() {
    // language=CSS
    return [
      fontStyles,
      colorStyles,
      themeStyles,
      css`
        form {
          width: 510px;
        }
    `];
  }

  render() {
    // language=HTML
    return html`
        <mwc-dialog id="renameDialog" title="Umbenennen">
        ${this._card ? html`
          <form>
            <div class="field">
              <label for="topic">Thema</label>
              <span id="topic">${this._card.topic}</span>
            </div>
            <mwc-textfield label="Umbenennen in ..." type="text" .value="${this._newName}" @change="${e => this._newName = e.target.value}"></mwc-textfield>
          </form>
          ` : '' }
          <mwc-button slot="secondaryAction" @click=${this._cancel}>Abbrechen</mwc-button>
          <mwc-button slot="primaryAction" @click=${this._rename}>Umbenennen</mwc-button>
        </mwc-dialog>
    `;
  }
}
