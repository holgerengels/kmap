import {html, css, customElement, query, property} from 'lit-element';
import {Connected} from "./connected";
import {State, store} from "../store";

import '@material/mwc-button';
import '@material/mwc-dialog';
import '@material/mwc-textfield';
import 'pwa-helper-components/pwa-install-button';
import 'pwa-helper-components/pwa-update-available';
import './validating-form';
import {Dialog} from "@material/mwc-dialog/mwc-dialog";
import {colorStyles, fontStyles} from "./kmap-styles";
import {Instance} from "../models/instances";
import {DatalistTextField} from "./datalist-textfield";

@customElement('kmap-login-popup')
export class KMapLoginPopup extends Connected {
  @property()
  private _instances: Instance[] = [];
  @property()
  private _showInstanceChooser: boolean = false;

  @property()
  private _instance: string = '';
  @property()
  private _userid: string = '';
  @property()
  private _username?: string;
  @property()
  private _message: string = '';

  @property()
  private _valid: boolean = false;
  @property()
  private _instanceValid: boolean = true;
  @property()
  private _formValid: boolean = false;

  @query('#loginDialog')
  // @ts-ignore
  private _loginDialog: Dialog;
  @query('#instance')
  // @ts-ignore
  private _loginInstance: DatalistTextField;

  mapState(state: State) {
    return {
      _instances: state.instances.instances,
      _instance: state.app.instance,
      _userid: state.app.userid,
      _username: state.app.username,
      _message: state.app.loginResponse,
    };
  }

  updated(changedProps) {
    if (changedProps.has('_userid')) {
      if (this._userid && !changedProps.get("_userid") && this._loginDialog.open) {
        this._loginDialog.close();
        store.dispatch.shell.showMessage("Du bist jetzt angemeldet!");
      }
      else if (!this._userid && changedProps.get("_userid")) {
        this._loginDialog.close();
        store.dispatch.shell.showMessage("Du bist jetzt abgemeldet!");
      }
    }
    if (changedProps.has("_formValid") || changedProps.has("_instanceValid"))
      this._valid = this._formValid && this._instanceValid;
  }

  show() {
    store.dispatch.app.clearLoginResponse();
    this._showInstanceChooser = false;
    this._loginDialog.show();
  }

  _signIn(event) {
    store.dispatch.auth.signinProvider(event.target.id);
  }

  _signOut() {
    store.dispatch.auth.signout();
  }

  _login() {
    if (!this.shadowRoot)
      return;
    const loginId = this.shadowRoot.getElementById("loginId") as HTMLInputElement;
    const loginPassword = this.shadowRoot.getElementById("loginPassword") as HTMLInputElement;

    if (this._instanceValid && loginId && loginPassword) {
      if (!/^[a-z0-9.]*$/.test(loginId.value)) {
        loginId.value = loginId.value.toLowerCase();
      }
      if (/^[a-z0-9.]*$/.test(loginId.value)) {
        store.dispatch.app.login({userid: loginId.value, password: loginPassword.value});
      }
    }
  }

  _logout() {
    store.dispatch.app.logout();
  }

  _maybeEnter(event) {
    if (event.key === "Enter" && this._valid) {
      event.preventDefault();
      this._login();
    }
  }

  _showChooseInstance() {
    store.dispatch.instances.load();
    this._showInstanceChooser = true;
  }

  _chooseInstance(e) {
    const instance: string = e.target.value;

    if (this._instances.find(i => i.name === instance) === undefined) {
      store.dispatch.shell.showMessage("Ungültige Instanz!");
      this._instanceValid = false;
    }
    else {
      store.dispatch.app.chooseInstance(instance);
      this._instanceValid = true;
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
        }
        mwc-icon-button[icon="polymer"] {
          vertical-align: middle;
          --mdc-icon-size: 18px;
          --mdc-icon-button-size: 18px;
          transition: color ease-in-out .3s;
        }
        span:hover mwc-icon-button[icon="polymer"] {
          color: var(--color-primary-dark);
        }
        .auth {
          min-width: 240px;
          margin: 8px 0;
          width: 100%;
        }
        .auth img {
          margin-right: 0.5em;
        }
        .auth img, auth svg {
          width: 24px;
          height: 24px;
          vertical-align: middle;
          margin-right: 10px;
        }
      `];
  }

  render() {
    // language=HTML
    return html`
  <!--googleoff: all-->
  <mwc-dialog id="loginDialog" heading="Anmelden">
    <validating-form id="loginForm" ?hidden="${this._userid}" @keyup="${this._maybeEnter}" @validity="${e => this._formValid = e.target.valid}">
      ${!this._showInstanceChooser ? html`
        <span secondary>Anmelden an Instanz: ${this._instance}&nbsp;
          <mwc-icon-button icon="polymer" class="secondary" @click="${this._showChooseInstance}" title="Instanz wechseln"></mwc-icon-button>
        </span>
      ` : html`
        <datalist-textfield id="instance" name="instance" label="Instanz" type="text" required @change="${this._chooseInstance}"
          .datalist="${this._instances.map(instance => {return {value: instance.name, label: instance.description}})}"
          pattern="[a-z-]*" helper="Nur kleine Buchstaben">
        </datalist-textfield>
      `}
      <br/><br/>
      ${this._instance !== 'root' ? html`
      <mwc-textfield id="loginId" name="user" label="Benutzerkennung" type="text" dialogInitialFocus required pattern="[a-z0-9.]*" helper="Nur kleine Buchstaben, Ziffern und Punkt"></mwc-textfield>
      <br/>
      <mwc-textfield id="loginPassword" name="password" label="Passwort" type="password" required></mwc-textfield>
      ` : html`
        <mwc-button class="auth" outlined @click=${this._signIn} id="google"><img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg">Anmelden mit Google</mwc-button><br/>
        <mwc-button class="auth" raised style="--mdc-theme-primary: #4267B2" @click=${this._signIn} id="facebook"><img src="icons/facebook.svg">Anmelden mit Facebook</mwc-button>
        <!--br/><span class="secondary">(Die Facebook-Anmeldung ist noch experimentell)</span-->
      `}
    </validating-form>
    <form id="logoutForm" ?hidden="${!this._userid}">
      Angemeldet als ${this._username} ..
    </form>
    <div class="layout horizontal">
      <div id="message" style="height: 32px; padding-top: 10px">${this._message}</div>
    </div>
    <pwa-install-button slot="secondaryAction"><mwc-button outlined style="--mdc-theme-primary: var(--color-secondary-dark);">App installieren</mwc-button></pwa-install-button>
    <pwa-update-available slot="secondaryAction"><mwc-button outlined style="--mdc-theme-primary: var(--color-secondary-dark);">App aktualisieren</mwc-button></pwa-update-available>
    <mwc-button slot="primaryAction" ?hidden="${this._userid}" @click=${this._login} ?disabled="${!this._valid}">Anmelden</mwc-button>
    ${this._instance !== 'root' ? html`
      <mwc-button slot="secondaryAction" ?hidden="${!this._userid}" @click=${this._logout}>Abmelden</mwc-button>
    ` : html`
      <mwc-button slot="secondaryAction" ?hidden="${!this._userid}" @click=${this._signOut}>Abmelden</mwc-button>
    `}
  </mwc-dialog>
  <!--googleon: all-->
    `;
  }
}
