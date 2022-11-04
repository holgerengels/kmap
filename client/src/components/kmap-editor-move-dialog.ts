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

@customElement('kmap-editor-move-dialog')
export class KMapEditorMoveDialog extends Connected {
  @state()
  private _card?: Card = undefined;
  @state()
  private _newModule: string = '';

  @query('#moveDialog')
  // @ts-ignore
  private _moveDialog: Dialog;

  @state()
  private _valid: boolean = false;

  mapState(state: State) {
    return {
      _card: state.maps.editAction?.action === "move" ? state.maps.editAction.card : undefined,
    };
  }

  updated(changedProperties) {
    if (changedProperties.has('_card') && this._card !== undefined) {
      if (!this._card.subject)
        this._card.subject = store.state.maps.subject || '';
      if (!this._card.chapter)
        this._card.chapter = store.state.maps.chapter || '';

      this._newModule = '';
      this._moveDialog.show();

    }
  }

  async _move() {
    this._moveDialog.close();
    if (!this._card)
      return;

    const card: Card | any = this._card;
    card.newModule = this._newModule;

    await store.dispatch.maps.moveTopic(card);
    window.setTimeout(function () {
      store.dispatch.maps.load();
    }, 1000);
  }

  _cancel() {
    this._moveDialog.close();
    store.dispatch.maps.unsetEditAction();
  }

  _maybeEnter(event) {
    if (event.key === "Enter" && this._valid) {
      event.preventDefault();
      this._move();
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
        <mwc-dialog id="moveDialog" title="Verschieben">
        ${this._card ? html`
        <validating-form @keyup="${this._maybeEnter}" @validity="${e => this._valid = e.target.valid}">
            <div class="field">
              <label for="topic">Thema</label>
              <span id="topic">${this._card.topic}</span>
            </div>
            <mwc-textfield label="Verschieben nach ..." type="text" .value="${this._newModule}" @change="${e => this._newModule = e.target.value}" pattern="^([^/.]*)$" required></mwc-textfield>
          </validating-form>
          ` : '' }
          <mwc-button slot="secondaryAction" @click=${this._cancel}>Abbrechen</mwc-button>
          <mwc-button slot="primaryAction" @click=${this._move} ?disabled="${!this._valid}">Verschieben</mwc-button>
        </mwc-dialog>
    `;
  }
}
