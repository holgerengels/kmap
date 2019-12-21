import {css, html, LitElement} from 'lit-element';
import {connect} from "pwa-helpers/connect-mixin";
import {store} from "../store";
import {unsetCardForDelete} from "../actions/app";
import {deleteTopic} from "../actions/editor";
import {fetchMapIfNeeded, invalidateMap} from "../actions/maps";
import {colorStyles, fontStyles} from "./kmap-styles";

import '@material/mwc-button';
import '@material/mwc-dialog';

class KMapEditorDeleteDialog extends connect(store)(LitElement) {
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
      <span>Soll die Wissenskarte zum Thema <i>${this._card.topic}</i> von der Wissenslandkarte zum Kapitel <i>${this._chapter}</i>
      aus dem Modul <i>${this._card.module}</i> im Fach <i>${this._subject}</i> wirklich gelöscht werden?</span>
    </div>
  </form>
  ` : '' }
  <mwc-button slot="secondaryAction" @click=${this._cancel}>Abbrechen</mwc-button>
  <mwc-button slot="primaryAction" @click=${this._delete}>Löschen</mwc-button>
</mwc-dialog>
    `;
    }

  static get properties() {
    return {
      _subject: {type: String},
      _chapter: {type: String},
      _card: {type: Object},
    };
  }

  constructor() {
    super();
    this._subject = '';
    this._chapter = '';
    this._card = null;
  }

  firstUpdated(changedProperties) {
    this._deleteDialog = this.shadowRoot.getElementById('deleteDialog');
  }

  updated(changedProperties) {
    if (changedProperties.has('_card') && this._card) {
      this._deleteDialog.show();
    }
  }

  stateChanged(state) {
    this._card = state.app.cardForDelete;

    if (state.maps.map) {
      if (this._card) {
        this._subject = this._card.subject ? this._card.subject : state.maps.map.subject;
        this._chapter = this._card.chapter ? this._card.chapter : state.maps.map.chapter;
      }
    }
  }

  _delete() {
    this._deleteDialog.close();

    this._card.subject = this._subject;
    this._card.chapter = this._chapter;
    this._card.topic = this._card.topic;
    console.log(this._card);
    store.dispatch(deleteTopic(this._subject, this._card.module, this._card))
      .then(store.dispatch(invalidateMap(this._subject, this._chapter)))
      .then(store.dispatch(unsetCardForDelete()))
      .then(lala => window.setTimeout(function(subject, chapter){ store.dispatch(fetchMapIfNeeded(subject, chapter)) }.bind(undefined, this._subject, this._chapter), 1000));
  }

  _cancel() {
    this._deleteDialog.close();
    store.dispatch(unsetCardForDelete());
  }

}

window.customElements.define('kmap-editor-delete-dialog', KMapEditorDeleteDialog);


/*
  synchronize: function () {
      this.$$('#cloudSynchronizer').params = { attachments: this.subject + "/" + this.chapter + "/" + this.topic };
      this.$$('#cloudSynchronizer').body = { subject: this.subject, chapter: this.chapter, topic: this.topic };
      console.log(this.$$('#cloudSynchronizer').headers);
      this.$$('#cloudSynchronizer').generateRequest();
  },

  createDirectory: function () {
      this.$$('#cloudDirectory').params = { directory: this.subject + "/" + this.chapter + "/" + this.topic };
      this.$$('#cloudDirectory').body = { subject: this.subject, chapter: this.chapter, topic: this.topic };
      this.$$('#cloudDirectory').generateRequest();
  },

 */
