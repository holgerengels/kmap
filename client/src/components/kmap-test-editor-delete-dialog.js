import {css, html, LitElement} from 'lit-element';
import {connect} from "pwa-helpers/connect-mixin";
import {store} from "../store";
import {unsetTestForDelete} from "../actions/app";
import {deleteTest, loadSet} from "../actions/test-editor";
import {colorStyles, fontStyles} from "./kmap-styles";

import '@material/mwc-button';
import '@material/mwc-dialog';
import '@material/mwc-textfield';

class KMapTestEditorDeleteDialog extends connect(store)(LitElement) {
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
  ${this._test ? html`
  <form>
    <div class="field">
      <span>Soll der Test <i>${this._test.key}</i> aus dem Set <i>${this._test.set}</i> im Fach <i>${this._test.subject}</i> wirklich gelöscht werden?</span>
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
      _test: {type: Object},
    };
  }

  constructor() {
    super();
    this._test = null;
  }

  firstUpdated(changedProperties) {
    this._deleteDialog = this.shadowRoot.getElementById('deleteDialog');
  }

  updated(changedProperties) {
    if (changedProperties.has('_test') && this._test) {
      this._deleteDialog.open = true;
    }
  }

  stateChanged(state) {
    this._test = state.app.testForDelete;
  }

  _delete() {
    this._deleteDialog.open = false;
    console.log(this._test);

    let test = this._test;
    store.dispatch(deleteTest(test.subject, test.set, test))
      .then(store.dispatch(unsetTestForDelete()))
      .then(lala => window.setTimeout(function(test) {
        store.dispatch(loadSet(test.subject, test.set));
      }.bind(undefined, test), 1000));
  }

  _cancel() {
    this._deleteDialog.open = false;
    store.dispatch(unsetTestForDelete());
  }

}

window.customElements.define('kmap-test-editor-delete-dialog', KMapTestEditorDeleteDialog);
