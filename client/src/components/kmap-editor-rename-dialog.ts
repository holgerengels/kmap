import {html, css, customElement, property, query} from 'lit-element';
import {Connected} from "./connected";
import {State, store} from "../store";

import '@material/mwc-button';
import '@material/mwc-dialog';
import '@material/mwc-textfield';
import './validating-form';
import {colorStyles, fontStyles} from "./kmap-styles";
import {Dialog} from "@material/mwc-dialog/mwc-dialog";
import {Card} from "../models/types";

@customElement('kmap-editor-rename-dialog')
export class KMapEditorRenameDialog extends Connected {
  @property()
  private _card?: Card = undefined;
  @property()
  private _newName: string = '';

  @query('#renameDialog')
  // @ts-ignore
  private _renameDialog: Dialog;

  @property()
  private _valid: boolean = false;

  mapState(state: State) {
    return {
      _card: state.maps.editAction?.action === "rename" ? state.maps.editAction.card : undefined,
    };
  }

  updated(changedProperties) {
    if (changedProperties.has('_card') && this._card !== undefined) {
      if (!this._card.subject)
        this._card.subject = store.state.maps.subject || '';
      if (!this._card.chapter)
        this._card.chapter = store.state.maps.chapter || '';

      this._newName = '';
      this._renameDialog.show();

    }
  }

  async _rename() {
    this._renameDialog.close();
    if (!this._card)
      return;

    const card: Card | any = this._card;
    card.newName = this._newName;

    await store.dispatch.maps.renameTopic(card);
    window.setTimeout(function () {
      store.dispatch.maps.load();
    }, 1000);
  }

  _cancel() {
    this._renameDialog.close();
    store.dispatch.maps.unsetEditAction();
  }

  _maybeEnter(event) {
    if (event.key === "Enter" && this._valid) {
      event.preventDefault();
      this._rename();
    }
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
        <mwc-dialog id="renameDialog" title="Umbenennen">
        ${this._card ? html`
        <validating-form @keyup="${this._maybeEnter}" @validity="${e => this._valid = e.target.valid}">
            <div class="field">
              <label for="topic">Thema</label>
              <span id="topic">${this._card.topic}</span>
            </div>
            <mwc-textfield label="Umbenennen in ..." type="text" .value="${this._newName}" @change="${e => this._newName = e.target.value}" pattern="^([^/.]*)$" required></mwc-textfield>
          </validating-form>
          ` : '' }
          <mwc-button slot="secondaryAction" @click=${this._cancel}>Abbrechen</mwc-button>
          <mwc-button slot="primaryAction" @click=${this._rename} ?disabled="${!this._valid}">Umbenennen</mwc-button>
        </mwc-dialog>
    `;
  }
}
