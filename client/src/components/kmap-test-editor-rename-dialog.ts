import {html, css, customElement, property, query} from 'lit-element';
import {Connected} from "./connected";
import {State, store} from "../store";

import '@material/mwc-button';
import '@material/mwc-dialog';
import '@material/mwc-textfield';
import './validating-form';
import {colorStyles, fontStyles} from "./kmap-styles";
import {Dialog} from "@material/mwc-dialog/mwc-dialog";
import {Test} from "../models/tests";

@customElement('kmap-test-editor-rename-dialog')
export class KMapTestEditorRenameDialog extends Connected {
  @property()
  private _test?: Test = undefined;
  @property()
  private _newName: string = '';

  @query('#renameDialog')
  // @ts-ignore
  private _renameDialog: Dialog;

  @property()
  private _valid: boolean = false;

  mapState(state: State) {
    return {
      _test: state.tests.testForRename,
    };
  }

  updated(changedProperties) {
    if (changedProperties.has('_test') && this._test !== undefined) {
      if (!this._test.subject)
        this._test.subject = store.state.tests.subject || '';
      if (!this._test.chapter)
        this._test.chapter = store.state.tests.chapter || '';

      this._newName = '';
      this._renameDialog.show();

    }
  }

  _rename() {
    this._renameDialog.close();
    if (!this._test)
      return;

    const test: Test | any = this._test;
    test.newName = this._newName;

    store.dispatch.tests.renameTest(test);
    window.setTimeout(function() {
      store.dispatch.tests.load();
    }, 1000);
  }

  _cancel() {
    this._renameDialog.close();
    store.dispatch.tests.unsetTestForRename();
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
        ${this._test ? html`
        <validating-form @keyup="${this._maybeEnter}" @validity="${e => this._valid = e.target.valid}">
            <div class="field">
              <label for="topic">Thema</label>
              <span id="topic">${this._test.key}</span>
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
