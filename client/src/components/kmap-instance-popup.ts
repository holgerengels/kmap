import {LitElement, html, css, customElement, query, property} from 'lit-element';
import { connect } from '@captaincodeman/rdx';
import {State, store} from "../store";

import '@material/mwc-button';
import '@material/mwc-dialog';
import '@material/mwc-textfield';
import 'pwa-helper-components/pwa-install-button';
import 'pwa-helper-components/pwa-update-available';
import {Dialog} from "@material/mwc-dialog/mwc-dialog";
import {TextField} from "@material/mwc-textfield/mwc-textfield";
import {colorStyles, fontStyles} from "./kmap-styles";
import {Instance} from "../models/instances";

@customElement('kmap-instance-popup')
export class KMapInstancePopup extends connect(store, LitElement) {
  @property()
  private _instances: Instance[] = [];

  @property()
  private _userid: string = '';

  @query('#instanceDialog')
  // @ts-ignore
  private _instanceDialog: Dialog;
  @query('#instanceId')
  // @ts-ignore
  private _instanceId: TextField;

  mapState(state: State) {
    return {
      _instances: state.instances.instances,
    };
  }

  updated(changedProps) {
    if (changedProps.has('_userid')) {
      if (this._userid && !changedProps.get("_userid")) {
        this._instanceDialog.close();
        store.dispatch.shell.showMessage("Du bist jetzt angemeldet!");
      }
      else if (!this._userid && changedProps.get("_userid")) {
        this._instanceDialog.close();
        store.dispatch.shell.showMessage("Du bist jetzt abgemeldet!");
      }
    }
  }

  show() {
    this._instanceDialog.show();
  }

  _instance() {
    // @ts-ignore
    store.dispatch.app.instance({ userid: this._instanceId.value, password: this._instancePassword.value });
  }

  _logout() {
    store.dispatch.app.logout();
  }

  _chooseInstance() {
    // @ts-ignore
    let textfield = this.shadowRoot.getElementById('instance');
    // @ts-ignore
    let instance: string = textfield.value;
    // @ts-ignore
    store.dispatch.app.chooseInstance(instance);
    this._instanceDialog.close();
  }

  _maybeEnter(event) {
    if (event.keyCode === 13) {
      event.preventDefault();
      this._instance();
    }
  }

  static get styles() {
    // language=CSS
    return [
      fontStyles,
      colorStyles,
      css`
        form {
          width: 300px;
          display: block;
        }
        [hidden] {
          display: none !important;
        }
        mwc-textfield {
          width: 300px;
          --mdc-text-field-filled-border-radius: 4px 16px 0 0;
        }
    `];
  }

  render() {
    // language=HTML
    return html`
  <mwc-dialog id="instanceDialog" title="Instanz wählen">
    <div>
        <h3>Instanzen</h3>
        <p>KMap anmeldest, kannst Du erweiterte Funktionen nutzen. Du kannst Deinen Lernfortschritt tracken.
         manInstanzen erlauben es einer Schule erweiterte Funktionen zu nutzen</p>
    </div>
    <mwc-textfield id="instance" name="instance" label="Instanz" type="text" required diainstanceitialFocus></mwc-textfield>
    <mwc-button slot="primaryAction" @click=${this._chooseInstance}>Auswählen</mwc-button>
  </mwc-dialog>
    `;
  }
}
