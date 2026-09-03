import {html, css} from 'lit';
import {customElement, query, state} from 'lit/decorators.js';
import {Connected} from "./connected";
import {State, store} from "../store";

import '@material/mwc-button';
import '@material/mwc-dialog';
import '@material/mwc-textfield';
import 'pwa-helper-components/pwa-install-button';
import 'pwa-helper-components/pwa-update-available';
import './datalist-textfield';
import './validating-form';
import {Dialog} from "@material/mwc-dialog/mwc-dialog";
import {resetStyles, colorStyles, fontStyles} from "./kmap-styles";
import {Instance} from "../models/instances";
import {DatalistTextField} from "./datalist-textfield";

type DialogView = 'login' | 'register' | 'reset-password' | 'reset-password-confirm' | 'change-password';

@customElement('kmap-login-popup')
export class KMapLoginPopup extends Connected {
  @state()
  private _instances: Instance[] = [];
  @state()
  private _showInstanceChooser: boolean = false;

  @state()
  private _instance: string = '';
  @state()
  private _userid: string = '';
  @state()
  private _username?: string;
  @state()
  private _message: string = '';

  @state()
  private _valid: boolean = false;
  @state()
  private _instanceValid: boolean = true;
  @state()
  private _formValid: boolean = false;

  @state()
  private _deleting: boolean = false;
  @state()
  private _changingPassword: boolean = false;

  @state()
  private _view: DialogView = 'login';

  @state()
  private _resetToken: string = '';

  @query('#loginDialog')
  // @ts-ignore
  private _loginDialog: Dialog;
  @query('#instance')
  // @ts-ignore
  private _loginInstance: DatalistTextField;

  declare shadowRoot: ShadowRoot;

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
    this._view = 'login';
    this._deleting = false;
    this._loginDialog.show();
  }

  showResetPasswordConfirm(token: string) {
    store.dispatch.app.clearLoginResponse();
    this._resetToken = token;
    this._view = 'reset-password-confirm';
    this._deleting = false;
    this._loginDialog.show();
  }

  _login() {
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

  _register() {
    const regId = this.shadowRoot.getElementById("regId") as HTMLInputElement;
    const regEmail = this.shadowRoot.getElementById("regEmail") as HTMLInputElement;
    const regPassword = this.shadowRoot.getElementById("regPassword") as HTMLInputElement;
    const regPasswordRepeat = this.shadowRoot.getElementById("regPasswordRepeat") as HTMLInputElement;

    if (regId && regEmail && regPassword && regPasswordRepeat) {
      if (regPassword.value !== regPasswordRepeat.value) {
        store.dispatch.app.loginResponse("Passwörter stimmen nicht überein");
        return;
      }
      store.dispatch.app.register({
        userid: regId.value.toLowerCase(),
        email: regEmail.value,
        password: regPassword.value,
        displayName: regId.value,
      });
    }
  }

  _resetPassword() {
    const resetEmail = this.shadowRoot.getElementById("resetEmail") as HTMLInputElement;
    if (resetEmail) {
      store.dispatch.app.resetPassword(resetEmail.value);
    }
  }

  _confirmResetPassword() {
    const newPassword = this.shadowRoot.getElementById("newPassword") as HTMLInputElement;
    const newPasswordRepeat = this.shadowRoot.getElementById("newPasswordRepeat") as HTMLInputElement;
    if (newPassword && newPasswordRepeat) {
      if (newPassword.value !== newPasswordRepeat.value) {
        store.dispatch.app.loginResponse("Passwörter stimmen nicht überein");
        return;
      }
      store.dispatch.app.resetPasswordConfirm({token: this._resetToken, password: newPassword.value});
      // After successful reset, clean up URL
      const url = new URL(window.location.href);
      url.searchParams.delete('reset-token');
      window.history.replaceState({}, '', url.toString());
    }
  }

  _changePassword() {
    const oldPw = this.shadowRoot.getElementById("oldPassword") as HTMLInputElement;
    const newPw = this.shadowRoot.getElementById("changeNewPassword") as HTMLInputElement;
    const newPwRepeat = this.shadowRoot.getElementById("changeNewPasswordRepeat") as HTMLInputElement;
    if (oldPw && newPw && newPwRepeat) {
      if (newPw.value !== newPwRepeat.value) {
        store.dispatch.app.loginResponse("Passwörter stimmen nicht überein");
        return;
      }
      store.dispatch.app.changePassword({oldPassword: oldPw.value, newPassword: newPw.value});
      this._changingPassword = false;
    }
  }

  _delete() {
    this._deleting = true;
  }

  _deleteData() {
    this._deleting = false;
    store.dispatch.app.deleteData();
  }

  _deleteAccount() {
    this._deleting = false;
    store.dispatch.app.deleteAccount();
  }

  _maybeEnter(event) {
    if (event.key === "Enter" && this._valid) {
      event.preventDefault();
      if (this._view === 'login') this._login();
      else if (this._view === 'register') this._register();
      else if (this._view === 'reset-password') this._resetPassword();
      else if (this._view === 'reset-password-confirm') this._confirmResetPassword();
      else if (this._view === 'change-password') this._changePassword();
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

  _switchView(view: DialogView) {
    store.dispatch.app.clearLoginResponse();
    this._view = view;
  }

  static get styles() {
    // language=CSS
    return [
      resetStyles,
      fontStyles,
      colorStyles,
      css`
        form {
          width: 300px;
          display: block;
        }
        .deleting > div {
          margin: 16px 0px;
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
        .link {
          cursor: pointer;
          color: var(--color-primary-dark);
          text-decoration: underline;
          font-size: 0.875rem;
        }
        .links {
          margin-top: 8px;
          display: flex;
          justify-content: space-between;
        }
      `];
  }

  render() {
    const dialogTitle = this._userid
      ? (this._changingPassword ? "Passwort ändern" : "Angemeldet")
      : this._view === 'register' ? "Registrieren"
      : this._view === 'reset-password' ? "Passwort vergessen?"
      : this._view === 'reset-password-confirm' ? "Neues Passwort setzen"
      : "Anmelden";

    // language=HTML
    return html`
  <!--googleoff: all-->
  <mwc-dialog id="loginDialog" heading="${dialogTitle}">
    ${!this._userid ? this._renderUnauthenticated() : this._renderAuthenticated()}
    <div class="layout horizontal">
      <div id="message" style="height: 32px; padding-top: 10px">${this._message}</div>
    </div>
    ${this._renderActions()}
  </mwc-dialog>
  <!--googleon: all-->
    `;
  }

  _renderUnauthenticated() {
    if (this._view === 'register') {
      return html`
        <validating-form id="registerForm" @keyup="${this._maybeEnter}" @validity="${e => this._formValid = e.target.valid}">
          <mwc-textfield id="regId" name="userid" label="Benutzerkennung" type="text" dialogInitialFocus required pattern="[a-z0-9.]*" helper="Nur kleine Buchstaben, Ziffern und Punkt"></mwc-textfield>
          <br/>
          <mwc-textfield id="regEmail" name="email" label="E-Mail" type="email" required></mwc-textfield>
          <br/>
          <mwc-textfield id="regPassword" name="password" label="Passwort" type="password" required minlength="8" helper="Mindestens 8 Zeichen"></mwc-textfield>
          <br/>
          <mwc-textfield id="regPasswordRepeat" name="passwordRepeat" label="Passwort wiederholen" type="password" required minlength="8"></mwc-textfield>
          <div class="links">
            <span class="link" @click="${() => this._switchView('login')}">Zurück zur Anmeldung</span>
          </div>
        </validating-form>
      `;
    }
    if (this._view === 'reset-password') {
      return html`
        <validating-form id="resetForm" @keyup="${this._maybeEnter}" @validity="${e => this._formValid = e.target.valid}">
          <mwc-textfield id="resetEmail" name="email" label="E-Mail" type="email" dialogInitialFocus required></mwc-textfield>
          <br/>
          <span secondary>Wir senden dir einen Link zum Zurücksetzen deines Passworts.</span>
          <div class="links">
            <span class="link" @click="${() => this._switchView('login')}">Zurück zur Anmeldung</span>
          </div>
        </validating-form>
      `;
    }
    if (this._view === 'reset-password-confirm') {
      return html`
        <validating-form id="confirmResetForm" @keyup="${this._maybeEnter}" @validity="${e => this._formValid = e.target.valid}">
          <mwc-textfield id="newPassword" name="password" label="Neues Passwort" type="password" dialogInitialFocus required minlength="8" helper="Mindestens 8 Zeichen"></mwc-textfield>
          <br/>
          <mwc-textfield id="newPasswordRepeat" name="passwordRepeat" label="Passwort wiederholen" type="password" required minlength="8"></mwc-textfield>
        </validating-form>
      `;
    }
    // Default: login view
    return html`
      <validating-form id="loginForm" @keyup="${this._maybeEnter}" @validity="${e => this._formValid = e.target.valid}">
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
        <mwc-textfield id="loginId" name="user" label="Benutzerkennung" type="text" dialogInitialFocus required pattern="[a-z0-9.]*" helper="Nur kleine Buchstaben, Ziffern und Punkt"></mwc-textfield>
        <br/>
        <mwc-textfield id="loginPassword" name="password" label="Passwort" type="password" required></mwc-textfield>
        <div class="links">
          ${this._instance === 'root' ? html`
            <span class="link" @click="${() => this._switchView('register')}">Registrieren</span>
            <span class="link" @click="${() => this._switchView('reset-password')}">Passwort vergessen?</span>
          ` : ''}
        </div>
      </validating-form>
    `;
  }

  _renderAuthenticated() {
    if (this._changingPassword) {
      return html`
        <validating-form id="changePasswordForm" @keyup="${this._maybeEnter}" @validity="${e => this._formValid = e.target.valid}">
          <mwc-textfield id="oldPassword" name="oldPassword" label="Aktuelles Passwort" type="password" dialogInitialFocus required></mwc-textfield>
          <br/>
          <mwc-textfield id="changeNewPassword" name="newPassword" label="Neues Passwort" type="password" required minlength="8" helper="Mindestens 8 Zeichen"></mwc-textfield>
          <br/>
          <mwc-textfield id="changeNewPasswordRepeat" name="newPasswordRepeat" label="Neues Passwort wiederholen" type="password" required minlength="8"></mwc-textfield>
        </validating-form>
      `;
    }
    return html`
      <form id="logoutForm">
        Angemeldet als ${this._username} ..
      </form>
      <div class="deleting">
        <div ?hidden="${!this._deleting}">
          ${this._instance === 'root'
            ? html`Möchtest du wirklich dein Konto und alle persönlichen Daten unwiederbringlich löschen?`
            : html`Möchtest du wirklich alle persönlichen Daten unwiederbringlich löschen?`
          }
        </div>
        <div ?hidden="${!this._deleting}">
          ${this._instance === 'root'
            ? html`<mwc-button outlined @click=${this._deleteAccount} style="--mdc-theme-primary: var(--color-red)">Konto und Daten löschen</mwc-button>`
            : html`<mwc-button outlined @click=${this._deleteData} style="--mdc-theme-primary: var(--color-red)">Daten löschen</mwc-button>`
          }
          <mwc-button outlined @click="${() => this._deleting = false}">Abbrechen</mwc-button>
        </div>
      </div>
    `;
  }

  _renderActions() {
    if (this._userid && this._changingPassword) {
      return html`
        <mwc-button slot="secondaryAction" @click=${() => this._changingPassword = false}>Abbrechen</mwc-button>
        <mwc-button slot="primaryAction" @click=${this._changePassword}>Passwort ändern</mwc-button>
      `;
    }
    if (this._userid) {
      return html`
        <mwc-button slot="secondaryAction" @click=${this._delete}>${this._instance === 'root' ? 'Konto löschen' : 'Daten löschen'}</mwc-button>
        <mwc-button slot="secondaryAction" @click=${() => this._changingPassword = true}>Passwort ändern</mwc-button>
        <mwc-button slot="primaryAction" @click=${this._logout}>Abmelden</mwc-button>
      `;
    }
    if (this._view === 'register') {
      return html`
        <mwc-button slot="primaryAction" @click=${this._register}>Registrieren</mwc-button>
      `;
    }
    if (this._view === 'reset-password') {
      return html`
        <mwc-button slot="primaryAction" @click=${this._resetPassword}>Zurücksetzen</mwc-button>
      `;
    }
    if (this._view === 'reset-password-confirm') {
      return html`
        <mwc-button slot="primaryAction" @click=${this._confirmResetPassword}>Passwort setzen</mwc-button>
      `;
    }
    return html`
      <mwc-button slot="primaryAction" @click=${this._login} ?disabled="${!this._valid}">Anmelden</mwc-button>
    `;
  }
}
