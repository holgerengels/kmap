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

@customElement('kmap-login-popup')
export class KMapLoginPopup extends connect(store, LitElement) {

  @property()
  private _userid: string = '';
  @property()
  private _message: string = '';

  @query('#loginDialog')
  // @ts-ignore
  private _loginDialog: Dialog;
  @query('#loginId')
  // @ts-ignore
  private _loginId: TextField;
  @query('#loginPassword')
  // @ts-ignore
  private _loginPassword: TextField;

  mapState(state: State) {
    return {
      _userid: state.app.userid,
      _message: state.app.loginResponse,
    };
  }

  updated(changedProps) {
    if (changedProps.has('_userid')) {
      if (this._userid && !changedProps.get("_userid")) {
        this._loginDialog.close();
        store.dispatch.shell.showMessage("Du bist jetzt angemeldet!");
      }
      else if (!this._userid && changedProps.get("_userid")) {
        this._loginDialog.close();
        store.dispatch.shell.showMessage("Du bist jetzt abgemeldet!");
      }
    }
  }

  show() {
    this._loginDialog.show();
  }

  _login() {
    // @ts-ignore
    store.dispatch.app.login({ userid: this._loginId.value, password: this._loginPassword.value });
  }

  _logout() {
    store.dispatch.app.logout();
  }

  _maybeEnter(event) {
    if (event.keyCode === 13) {
      event.preventDefault();
      this._login();
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
  <mwc-dialog id="loginDialog" title="Anmeldung">
    <form id="loginForm" ?hidden="${this._userid}" @keyup="${this._maybeEnter}">
      <mwc-textfield id="loginId" name="user" label="Benutzerkennung" type="text" dialogInitialFocus></mwc-textfield>
      <br/><br/>
      <mwc-textfield id="loginPassword" name="password" label="Passwort" type="password"></mwc-textfield>
    </form>
    <form id="logoutForm" ?hidden="${!this._userid}">
      Angemeldet als ${this._userid} ..
    </form>
    <div class="layout horizontal">
      <div id="message" style="height: 32px; padding-top: 10px">${this._message}</div>
    </div>
    <mwc-button slot="primaryAction" ?hidden="${this._userid}" @click=${this._login}>Anmelden</mwc-button>
    <mwc-button slot="secondaryAction" ?hidden="${!this._userid}" @click=${this._logout}>Abmelden</mwc-button>
    <pwa-install-button slot="secondaryAction"><mwc-button>App installieren</mwc-button></pwa-install-button>
    <pwa-update-available slot="secondaryAction"><mwc-button>App aktualisieren</mwc-button></pwa-update-available>
  </mwc-dialog>
    `;
  }
}
