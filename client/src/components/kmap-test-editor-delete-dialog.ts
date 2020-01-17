import {LitElement, html, css, customElement, property, query} from 'lit-element';
import {connect} from '@captaincodeman/rdx';
import {State, store} from "../store";

import {colorStyles, fontStyles} from "./kmap-styles";

import '@material/mwc-button';
import '@material/mwc-dialog';
import '@material/mwc-textfield';
import {Dialog} from "@material/mwc-dialog/mwc-dialog";
import {Test} from "../models/tests";

@customElement('kmap-test-editor-delete-dialog')
export class KMapTestEditorDeleteDialog extends connect(store, LitElement) {
  @property()
  private _test?: Test = undefined;

  @query('#deleteDialog')
  // @ts-ignore
  private _deleteDialog: Dialog;

  mapState(state: State) {
    return {
      _test: state.tests.testForDelete,
    };
  }

  updated(changedProperties) {
    if (changedProperties.has('_test') && this._test) {
      this._deleteDialog.show();
    }
  }

  _delete() {
    this._deleteDialog.close();
    console.log(this._test);
    if (!this._test)
      return;

    store.dispatch.tests.deleteTest(this._test);
    window.setTimeout(function(test: Test) {
      store.dispatch.contentSets.loadSet({subject: test.subject, set: test.set});
    }.bind(undefined, this._test), 1000);
  }

  _cancel() {
    this._deleteDialog.close();
    store.dispatch.tests.unsetTestForDelete();
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
}
