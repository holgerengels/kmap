import {LitElement, html, css} from 'lit-element';
import {connect} from 'pwa-helpers/connect-mixin.js';
import {store} from "../store.js";
import {login, logout, showMessage} from "../actions/app";
import {colorStyles, fontStyles} from "./kmap-styles";

import '@material/mwc-button';
import '@material/mwc-dialog';
import '@material/mwc-textfield';
import 'pwa-helper-components/pwa-install-button';
import 'pwa-helper-components/pwa-update-available';

class KMapLoginPopup extends connect(store)(LitElement) {
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

  static get properties() {
    return {
      _userid: {type: String},
      _roles: {type: Array},
      _initials: {type: String},
      _message: {type: String},
      _failure: {type: Boolean},
    };
  }

  firstUpdated(changedProperties) {
    this._loginDialog = this.shadowRoot.getElementById('loginDialog');
    this._loginId = this.shadowRoot.getElementById('loginId');
    this._loginPassword = this.shadowRoot.getElementById('loginPassword');
  }

  updated(changedProps) {
    if (changedProps.has('_userid')) {
      if (this._userid && !changedProps.get("_userid")) {
        this._loginDialog.open = false;
        store.dispatch(showMessage("Du bist jetzt angemeldet!"))
      }
      else if (!this._userid && changedProps.get("_userid")) {
        this._loginDialog.open = false;
        store.dispatch(showMessage("Du bist jetzt abgemeldet!"))
      }
    }
  }

  stateChanged(state) {
    this._userid = state.app.userid;
    this._roles = state.app.roles;
    this._initials = this._userid ? this._buildInitials(this._userid) : null;
    this._message = state.app.loginResponse;
    this._failure = state.app.loginFailure;
  }

  show() {
    this._loginDialog.open = true;
  }

  _login(e) {
    store.dispatch(login({ userid: this._loginId.value, password: this._loginPassword.value }));
  }

  _logout() {
    store.dispatch(logout({ userid: this._userid}));
  }

  _maybeEnter(event) {
    if (event.keyCode === 13) {
      event.preventDefault();
      this._login();
    }
  }

  _buildInitials(userid) {
    var pos = userid.indexOf('.');
    return pos != -1 ? userid[pos+1].toUpperCase() + userid[0].toUpperCase() : userid[0].toUpperCase();
  }
}

customElements.define('kmap-login-popup', KMapLoginPopup);
