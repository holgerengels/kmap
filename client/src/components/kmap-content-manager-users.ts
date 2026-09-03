import {html, css} from 'lit';
import {customElement, state} from 'lit/decorators.js';
import {Connected} from "./connected";
import {State, store} from "../store";

import {resetStyles, colorStyles, fontStyles} from "./kmap-styles";

import '@material/mwc-icon';
import '@material/mwc-icon-button';
import '@material/mwc-list/mwc-list';
import '@material/mwc-list/mwc-list-item';
import '@material/mwc-textfield';
import '@material/mwc-button';
import {User} from "../models/users";

@customElement('kmap-content-manager-users')
export class KMapContentManagerUsers extends Connected {
  @state()
  private _users: User[] = [];
  @state()
  private _page: string = '';
  @state()
  private _selectedIndex: number = -1;
  @state()
  private _selected?: User = undefined;

  @state()
  private _working: boolean = false;

  @state()
  private _newUserid: string = '';
  @state()
  private _newEmail: string = '';
  @state()
  private _newDisplayName: string = '';
  @state()
  private _newPassword: string = '';

  @state()
  private _editEmail: string = '';
  @state()
  private _editDisplayName: string = '';
  @state()
  private _editRoles: string = '';

  @state()
  private _filter: string = '';

  mapState(state: State) {
    return {
      _users: state.users.users,
      _working: state.users.creating || state.users.deleting || state.users.editing,
    };
  }

  firstUpdated() {
    store.dispatch.users.load();
  }

  updated(changedProperties) {
    if (changedProperties.has('_selectedIndex')) {
      this._selected = this._filteredUsers[this._selectedIndex];
      this._editEmail = this._selected?.email || '';
      this._editDisplayName = this._selected?.displayName || '';
      this._editRoles = this._selected?.roles?.join(', ') || '';
    }

    if (changedProperties.has("_working") && !this._working)
      this._page = '';
  }

  get _filteredUsers(): User[] {
    if (!this._filter) return this._users;
    const f = this._filter.toLowerCase();
    return this._users.filter(u =>
      u.userid.toLowerCase().includes(f) ||
      (u.displayName && u.displayName.toLowerCase().includes(f)) ||
      (u.email && u.email.toLowerCase().includes(f))
    );
  }

  _select(index) {
    if (this._selectedIndex === index)
      this._selectedIndex = -1;
    else
      this._selectedIndex = index;
  }

  _showPage(page) {
    this._page = page;
  }

  _create() {
    store.dispatch.users.create({
      userid: this._newUserid,
      email: this._newEmail,
      password: this._newPassword,
      displayName: this._newDisplayName || this._newUserid,
    });
  }

  _edit() {
    if (this._selected === undefined) return;
    const roles = this._editRoles.split(',').map(r => r.trim()).filter(r => r.length > 0);
    store.dispatch.users.edit({
      userid: this._selected.userid,
      email: this._editEmail,
      displayName: this._editDisplayName,
      roles: roles,
    });
  }

  _delete() {
    if (this._selected === undefined) return;
    store.dispatch.users.deleteUser(this._selected.userid);
  }

  _resetPassword() {
    if (this._selected === undefined) return;
    store.dispatch.users.resetUserPassword(this._selected.userid);
  }

  static get styles() {
    // language=CSS
    return [
      resetStyles,
      fontStyles,
      colorStyles,
      css`
        :host {
          display: contents;
        }
        div.main {
          width: 700px;
          margin: 8px;
          display: flex;
        }
        .form {
          margin: 12px;
          flex: 0 1 50%;
          align-items: stretch;
        }
        .scroll {
          height: 232px;
          width: 326px;
          overflow-x: hidden;
          overflow-y: auto;
        }
        mwc-icon {
          pointer-events: all;
          cursor: default;
        }
        [disabled], [disabled] svg {
          color: gray;
          fill: gray;
          pointer-events: none;
        }
        .page {
          display: none;
          opacity: 0.0;
          transition: opacity .8s;
        }
        .page[active] {
          display: block;
          opacity: 1.0;
        }
        .page > * {
          display: flex;
          justify-content: space-between;
          margin: 8px;
        }
        mwc-textfield {
          width: 100%;
        }
        .filter {
          margin-bottom: 4px;
        }
        .secondary {
          font-size: 0.8em;
          color: gray;
        }
        `];
  }

  render() {
    const filteredUsers = this._filteredUsers;
    return html`
      <div class="main elevation-02">
        <div class="form">
          <label>Benutzer</label>
          <span style="float: right">
          <mwc-icon @click="${() => this._showPage('create')}" title="Benutzer anlegen">person_add</mwc-icon>
          <mwc-icon @click="${() => this._showPage('edit')}" ?disabled="${this._selectedIndex === -1}" title="Bearbeiten">edit</mwc-icon>
          <mwc-icon @click="${() => this._showPage('reset')}" ?disabled="${this._selectedIndex === -1}" title="Passwort zurücksetzen">lock_reset</mwc-icon>
          <mwc-icon @click="${() => this._showPage('delete')}" ?disabled="${this._selectedIndex === -1}" title="Löschen">delete</mwc-icon>
          </span>
          <br style="clear: right"/>
          <mwc-textfield class="filter" label="Filter" type="text" .value="${this._filter}" @input="${e => this._filter = e.target.value}" icon="search"></mwc-textfield>
          <div class="scroll">
          <mwc-list>
            ${filteredUsers.map((user, i) => html`
              <mwc-list-item ?activated="${this._selectedIndex === i}" @click="${() => this._select(i)}" graphic="icon">
                <span>${user.userid} <span class="secondary">${user.displayName || ''}</span></span>
                <mwc-icon slot="graphic">person</mwc-icon>
              </mwc-list-item>
            `)}
          </mwc-list>
          </div>
        </div>
        <div class="form">
          <div class="page" ?active="${this._page === 'create'}">
            <label>Benutzer anlegen</label>
            <mwc-textfield label="Benutzerkennung" type="text" .value="${this._newUserid}" @change="${e => this._newUserid = e.target.value}" required></mwc-textfield>
            <mwc-textfield label="E-Mail" type="email" .value="${this._newEmail}" @change="${e => this._newEmail = e.target.value}"></mwc-textfield>
            <mwc-textfield label="Anzeigename" type="text" .value="${this._newDisplayName}" @change="${e => this._newDisplayName = e.target.value}"></mwc-textfield>
            <mwc-textfield label="Passwort" type="password" .value="${this._newPassword}" @change="${e => this._newPassword = e.target.value}" required></mwc-textfield>
            <div>
              <mwc-button @click="${() => this._showPage('')}">Abbrechen</mwc-button>
              <mwc-button outlined @click="${this._create}">Anlegen</mwc-button>
            </div>
          </div>
          <div class="page" ?active="${this._page === 'edit'}">
            <label>Benutzer editieren</label>
            <mwc-textfield label="Benutzerkennung" type="text" .value="${this._selected ? this._selected.userid : ''}" disabled></mwc-textfield>
            <mwc-textfield label="E-Mail" type="email" .value="${this._editEmail}" @change="${e => this._editEmail = e.target.value}"></mwc-textfield>
            <mwc-textfield label="Anzeigename" type="text" .value="${this._editDisplayName}" @change="${e => this._editDisplayName = e.target.value}"></mwc-textfield>
            <mwc-textfield label="Rollen" type="text" .value="${this._editRoles}" @change="${e => this._editRoles = e.target.value}" helper="Kommagetrennt: user, student, teacher, admin"></mwc-textfield>
            <div>
              <mwc-button @click="${() => this._showPage('')}">Abbrechen</mwc-button>
              <mwc-button outlined @click="${this._edit}">Speichern</mwc-button>
            </div>
          </div>
          <div class="page" ?active="${this._page === 'reset'}">
            <label>Passwort zurücksetzen</label>
              ${this._selected
                ? html`<label secondary>Soll eine Reset-Mail an '${this._selected.email || 'keine E-Mail'}' gesendet werden?</label>`
                : ''}
            <div>
              <mwc-button @click="${() => this._showPage('')}">Abbrechen</mwc-button>
              <mwc-button outlined @click="${this._resetPassword}">Reset-Mail senden</mwc-button>
            </div>
          </div>
          <div class="page" ?active="${this._page === 'delete'}">
            <label>Benutzer löschen</label>
              ${this._selected
                ? html`<label secondary>Soll der Benutzer '${this._selected.userid}' wirklich gelöscht werden?</label>`
                : ''}
            <div>
              <mwc-button @click="${() => this._showPage('')}">Abbrechen</mwc-button>
              <mwc-button outlined @click="${this._delete}">Löschen</mwc-button>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}
