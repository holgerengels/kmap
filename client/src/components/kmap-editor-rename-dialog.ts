import {html, css} from 'lit';
import {customElement, query, state} from 'lit/decorators.js';
import {Connected} from "./connected";
import {State, store} from "../store";

import '@material/mwc-button';
import '@material/mwc-dialog';
import '@material/mwc-textfield';
import './validating-form';
import {resetStyles, colorStyles, fontStyles} from "./kmap-styles";
import {Dialog} from "@material/mwc-dialog/mwc-dialog";
import {Card} from "../models/types";

@customElement('kmap-editor-rename-dialog')
export class KMapEditorRenameDialog extends Connected {
  @state()
  private _card?: Card = undefined;
  @state()
  private _newChapter: string = '';
  @state()
  private _newTopic: string = '';

  @query('#renameDialog')
  // @ts-ignore
  private _renameDialog: Dialog;

  @state()
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

      this._newChapter = this._card.chapter;
      this._newTopic = this._card.topic;
      this._renameDialog.show();

    }
  }

  async _rename() {
    this._renameDialog.close();
    if (!this._card)
      return;

    const card: Card | any = this._card;
    card.newChapter = this._newChapter;
    card.newTopic = this._newTopic;

    await store.dispatch.maps.renameCard(card);
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
        <mwc-dialog id="renameDialog" title="Umbenennen">
        ${this._card ? html`
          <validating-form @keyup="${this._maybeEnter}" @validity="${e => this._valid = e.target.valid}">
            <div class="field">
              <label for="chaptertopic">Umbenennen: </label>
              <span id="chaptertopic">${this._card.chapter} / ${this._card.topic}</span>
            </div>
            <mwc-textfield label="Neues Kapitel ..." type="text" .value="${this._newChapter}"
                           @change="${e => this._newChapter = e.target.value}" pattern="^([^/.]*)$"
                           required></mwc-textfield>
            <mwc-textfield label="Neues Thema ..." type="text" .value="${this._newTopic}"
                           @change="${e => this._newTopic = e.target.value}" pattern="^([^/.]*)$"
                           required></mwc-textfield>
          </validating-form>
        ` : '' }
          <mwc-button slot="secondaryAction" @click=${this._cancel}>Abbrechen</mwc-button>
          <mwc-button slot="primaryAction" @click=${this._rename} ?disabled="${!this._valid}">Umbenennen</mwc-button>
        </mwc-dialog>
    `;
  }
}
