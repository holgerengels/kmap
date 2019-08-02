import {css, html, LitElement} from 'lit-element';
import {connect} from "pwa-helpers/connect-mixin";
import {store} from "../store";
import {unsetCardForRename} from "../actions/app";
import {renameTopic} from "../actions/editor";
import {fetchMapIfNeeded, invalidateMap} from "../actions/maps";
import {colorStyles, fontStyles} from "./kmap-styles";
import 'mega-material/button';
import 'mega-material/dialog';

class KMapEditorRenameDialog extends connect(store)(LitElement) {

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
  <form>
    <div class="field">
      <label for="topic">Thema</label>
      <span id="topic">${this._card.name}</span>
    </div>
    <div class="field">
      <label for="links">Umbenennen in</label>
      <input id="rename" type="text" .value="${this._newName}" @change="${e => this._newName = e.target.value}"/>
    </div>
  </form>
  <mwc-button slot="action" primary @click=${this._rename}>Umbenennen</mwc-button>
  <mwc-button slot="action" @click=${this._cancel}>Abbrechen</mwc-button>
</mwc-dialog>
    ` : '' }
    `;
    }

  static get properties() {
    return {
      _subject: {type: String},
      _chapter: {type: String},
      _card: {type: Object},
      _newName: {type: String},
    };
  }

  constructor() {
    super();
    this._subject = '';
    this._chapter = '';
    this._card = null;
    this._newName = '';
  }

  firstUpdated(changedProperties) {
    this._renameDialog = this.shadowRoot.getElementById('renameDialog');
  }

  updated(changedProperties) {
    if (changedProperties.has('_card') && this._card) {
      this._newName = '';
      this._renameDialog.open();
    }
  }

  stateChanged(state) {
    this._card = state.app.cardForRename;

    if (state.maps.map) {
      if (this._card) {
        this._subject = this._card.subject ? this._card.subject : state.maps.map.subject;
        this._chapter = this._card.chapter ? this._card.chapter : state.maps.map.chapter;
      }
    }
  }
  
  _rename() {
    this._renameDialog.close();
    this._card.subject = this._subject;
    this._card.chapter = this._chapter;
    this._card.topic = this._card.name;
    console.log(this._card);
    store.dispatch(renameTopic(this._subject, this._card.module, this._card, this._newName))
      .then(store.dispatch(invalidateMap(this._subject, this._chapter)))
      .then(store.dispatch(unsetCardForRename()))
      .then(lala => window.setTimeout(function(subject, chapter){ store.dispatch(fetchMapIfNeeded(subject, chapter)) }.bind(undefined, this._subject, this._chapter), 1000));
  }

  _cancel() {
    this._renameDialog.close();
    store.dispatch(unsetCardForRename());
  }

}

window.customElements.define('kmap-editor-rename-dialog', KMapEditorRenameDialog);
