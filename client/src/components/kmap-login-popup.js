import {LitElement, html, css} from 'lit-element';
import {connect} from 'pwa-helpers/connect-mixin.js';
import {store} from "../store.js";

import 'mega-material/button';
import 'mega-material/dialog';
import 'mega-material/surface';
import {login, logout, showMessage} from "../actions/app";
import {fontStyles} from "./kmap-styles";

class KMapLoginPopup extends connect(store)(LitElement) {
  static get styles() {
    // language=CSS
    return [
      fontStyles,
      css`
.form {
  width: 300px;
}
[hidden] {
  display: none !important;
}

.form, .button, #message {
  display: block;
}
.field {
    display: flex;
    justify-content: space-between;
    margin: .5rem;
}
.field input {
  width: 180px;
}
.fab {
  cursor: pointer;
  position: absolute;
  display: flex;
  right: -4px;
  top: -4px;
  height: 40px; 
  width: 40px;
  border-radius: 50%; 
  color: black;
  background-color: var(--color-secondary);
  box-shadow: var(--elevation-06);
}
.fab > * {
  margin: auto;
}
    `];
  }

  render() {
    return html`
<div class="fab" @click="${this._show}" ?hidden="${!this._userid}"><span>${this._initials}</span></div>
<div class="fab" @click="${this._show}" ?hidden="${this._userid}"><mega-icon>person_outline</mega-icon></div>
  <mega-dialog id="loginDialog" title="Anmeldung">
    <div id="loginForm" class="form" ?hidden="${this._userid}" @keyup="${this._maybeEnter}">
      <div class="field">
        <label for="loginId">Benutzer</label>
        <input id="loginId" name="user" label="Benutzerkennung" type="text"/>
      </div>
      <div class="field">
        <label for="loginPassword">Passwort</label>
        <input id="loginPassword" name="password" label="Passwort" type="password"/>
      </div>
    </div>
    <div id="logoutForm" class="form" ?hidden="${!this._userid}">
      Angemeldet als ${this._userid} ..
    </div>
    <div class="layout horizontal" slot="action">
      <div id="message" style="height: 32px">${this._message}</div>
    </div>
    <mega-button class="button" slotd="action" primary ?hidden="${this._userid}" @click=${this._login}>Anmelden</mega-button>
    <mega-button class="button" slotd="action" primary ?hidden="${!this._userid}" @click=${this._logout}>Abmelden</mega-button>
  </mega-dialog>
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
        this._loginDialog.close();
        store.dispatch(showMessage("Du bist jetzt angemeldet!"))
      }
      else if (!this._userid && changedProps.get("_userid")) {
        this._loginDialog.close();
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

  _show() {
    this._loginDialog.open();
    setTimeout(() => this._loginId.focus(), 100);
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
