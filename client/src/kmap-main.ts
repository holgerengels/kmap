import {LitElement, html, css, customElement, property, query} from 'lit-element';
import {installMediaQueryWatcher} from 'pwa-helpers/media-query.js';
import {installOfflineWatcher} from 'pwa-helpers/network.js';
import {updateMetadata} from 'pwa-helpers/metadata.js';
import "web-animations-js/web-animations.min";
import { connect } from '@captaincodeman/rdx'
import { RoutingState } from '@captaincodeman/rdx-model'
import { store, State } from './store'

import '@material/mwc-button';
import '@material/mwc-drawer';
import '@material/mwc-icon-button';
import '@material/mwc-snackbar';
import '@material/mwc-switch';
import 'pwa-helper-components/pwa-install-button';
import 'pwa-helper-components/pwa-update-available';

import './components/kmap-subjects';
import './components/kmap-browser';
import './components/kmap-test';
import './components/kmap-courses';
import './components/kmap-content-manager';
import './components/kmap-instance-popup';
import './components/kmap-login-popup';
import './components/kmap-module-selector';
import './components/kmap-set-selector';
import './components/kmap-course-selector';
import './components/kmap-editor-edit-dialog';
import './components/kmap-editor-rename-dialog';
import './components/kmap-editor-delete-dialog';
import './components/kmap-editor-add-fabs';
import './components/kmap-test-editor-add-fabs';
import './components/kmap-test-editor-edit-dialog';
import './components/kmap-test-editor-delete-dialog';

import {fontStyles, colorStyles} from "./components/kmap-styles";
import {Snackbar} from "@material/mwc-snackbar/mwc-snackbar";
import {KMapLoginPopup} from "./components/kmap-login-popup";
import {KMapInstancePopup} from "./components/kmap-instance-popup";

@customElement('kmap-main')
export class KmapMain extends connect(store, LitElement) {

  @property()
  private _page: string = '';
  @property()
  private _metaTitle: string = '';
  @property()
  private _metaDescription: string = '';
  @property()
  private _instance: string = '';
  @property()
  // @ts-ignore
  private _userid: string = '';
  @property()
  private _roles: string[] = [];
  @property()
  private _layers: string[] = [];

  @property()
  private _drawerOpen: boolean = false;
  @property()
  private _narrow: boolean = false;
  @property()
  private _messages: string[] = [];

  @query('#snackbar')
  // @ts-ignore
  private _snackbar: Snackbar;
  @query('#instance-popup')
  // @ts-ignore
  private _instancePopup: KMapInstancePopup;
  @query('#login-popup')
  // @ts-ignore
  private _loginPopup: KMapLoginPopup;

  @property()
  private _path: string = '';

  set route(val: RoutingState) {
    if (val.page !== this._page) {
      this._page = val.page;
      if (val.params.topic && val.params.chapter)
        this._path = val.params.subject + "/" + val.params.chapter + "/" + val.params.topic;
      else if (val.params.chapter)
        this._path = val.params.subject + "/" + val.params.chapter;
      else
        this._path = '';
    }
  }

  mapState(state: State) {
    return {
      // @ts-ignore
      route: state.routing,
      _instance: state.app.instance,
      _userid: state.app.userid,
      _roles: state.app.roles,
      _layers: state.shell.layers,
      _metaTitle: state.shell.title,
      _metaDescription: state.shell.description,
      //_drawerOpen: state.shell.drawerOpen,
      _narrow: state.shell.narrow,
      _messages: state.shell.messages,
    };
  }

  // @ts-ignore
  firstUpdated(changedProperties) {
    if (!window.location.host.includes("localhost")) {
      let pathComponent = window.location.pathname.split('/')[1];
      let cookie: string | null = this._getCookie("instance");
      if (pathComponent !== "app") {
        console.log("choose instance .. " + pathComponent);
        document.cookie = "instance=" + pathComponent + "; path=/";
        window.location.pathname = window.location.pathname.replace(pathComponent, "app");
      }
      else if (cookie) {
        console.log("instance from cookie .. " + cookie);
        document.cookie = "instance=" + cookie + "; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
        store.dispatch.app.chooseInstance(cookie);
      }
      else {
        if (!store.state.app.instance) {
          store.dispatch.app.chooseInstance("root");
        }
      }
    }
    else if (!store.state.app.instance)
      store.dispatch.app.chooseInstance("lala");

    installOfflineWatcher((offline) => store.dispatch.app.updateOffline(offline));
    installMediaQueryWatcher(`(max-width: 500px)`, (matches) => store.dispatch.shell.updateNarrow(matches));
  }

  updated(changedProps) {
    if (changedProps.has('_metaTitle')) {
      updateMetadata({
        title: this._metaTitle,
        description: this._metaDescription,
      });
    }

    if (changedProps.has('_page') && !this._layers.includes('editor'))
      this._drawerOpen = false;

    if (changedProps.has('_messages')) {
      if (this._messages.length > 0) {
        //this._snackbar.open();
        console.log(this._messages);
      }
    }
  }

  _renderPage() {
    switch (this._page) {
      case 'home':
        return html`<kmap-subjects class="page"></kmap-subjects>`;
      case 'browser':
        return html`<kmap-browser class="page"></kmap-browser>`;
      case 'test':
        return html`<kmap-test class="page"></kmap-test>`;
      case 'courses':
        return html`<kmap-courses class="page"></kmap-courses>`;
      case 'content-manager':
        return html`<kmap-content-manager class="page"></kmap-content-manager>`;
      default:
        return html`lala`;
    }
  }
  _renderMessages() {
    return this._messages.join("\n");
  }

  _switchLayer(layer, checked) {
    if (!checked && this._layers.includes(layer))
      store.dispatch.shell.removeLayer(layer);
    else if (checked && !this._layers.includes(layer))
      store.dispatch.shell.addLayer(layer);
  }

  _showLogin() {
    this._loginPopup.show();
  }

  _showChooseInstance() {
    this._instancePopup.show();
  }

  _getCookie(n) {
    let a = `; ${document.cookie}`.match(`;\\s*${n}=([^;]+)`);
    return a ? a[1] : null;
  }

  static get styles() {
    // language=CSS
    return [
      fontStyles,
      colorStyles,
      css`
      :host {
        display: contents;
        --app-drawer-background-color: var(--app-secondary-color);
        --app-drawer-text-color: var(--app-light-text-color);
        --app-drawer-selected-color: #c67100;
      }
      .drawer-content {
        padding: 0px 16px 0 16px;
      }
      .drawer-list {
        padding: 16px;
      }
      .drawer-list > * {
          display: block;
          margin: 4px 0px;
      }
      .drawer-list > a {
        line-height: 32px;
        color: var(--app-drawer-text-color);
      }
      .drawer-list > a[selected] {
        color: var(--app-drawer-selected-color);
      }
      .drawer-list > mwc-formfield {
        margin: 16px 0px;
      }
      .main-content {
          width: 100% !important;
      }
      [hidden] {
        display: none !important;
      }
        span[slot=subtitle] {
          display: flex;
          align-content: center;
        }
        span[slot=subtitle] > * {
          margin-right: 8px;
        }
      mwc-icon-button[icon="polymer"] {
        --mdc-icon-size: 18px;
        --mdc-icon-button-size: 18px;
        transition: color ease-in-out .3s;
      }
      span:hover mwc-icon-button[icon="polymer"] {
        color: var(--color-primary-dark);
      }
      `,
    ];
  }

  render() {
    // language=HTML
    return html`
  <mwc-drawer id="drawer" hasheader type="${this._narrow ? 'modal' : 'dismissible'}" ?open="${this._drawerOpen}">
    <span slot="title">Knowledge Map</span>
    <span slot="subtitle">[<span>&nbsp;<b>Instanz:</b> ${this._instance}</span>
        <mwc-icon-button icon="polymer" class="secondary" @click="${this._showChooseInstance}" title="Instanz wechseln"></mwc-icon-button>
    ]</span>
    <div class="drawer-content">
      <nav class="drawer-list">
        <a ?selected="${this._page === 'home'}" href="/app/">Home</a>
        <a ?selected="${this._page === 'browser'}" href="/app/browser/${this._path}" ?disabled="${!this._path}">Browser</a>
        ${this._roles.includes("teacher") ? html`
          <a ?selected="${this._page === 'test'}" href="/app/test">Test</a>
        ` : ''}
        <a ?selected="${this._page === 'courses'}" ?disabled="${!this._roles.includes("teacher")}" href="/app/courses">Kurse</a>
        <a ?selected="${this._page === 'content-mananer'}" ?disabled="${!this._roles.includes("teacher")}" href="/app/content-manager">Content Manager</a>
        <a href="/app/browser/Hilfe/Hilfe">Hilfe</a>
        <a href="/app/browser/Hilfe/Hilfe/Impressum">Impressum</a>

        <pwa-install-button><mwc-button outlined style="--mdc-theme-primary: var(--color-secondary-dark);">App installieren</mwc-button></pwa-install-button>
        <pwa-update-available><mwc-button outlined style="--mdc-theme-primary: var(--color-secondary-dark);">App aktualisieren</mwc-button></pwa-update-available>
      </nav>
      <!--googleoff: all-->
      <nav class="drawer-list">
        <hr/><br/>
        <label section>Layer ein-/ausblenden</label>
        <mwc-formfield label="Kurztexte">
          <mwc-switch ?checked="${this._layers.includes('summaries')}" @change="${e => this._switchLayer('summaries', e.target.checked)}"></mwc-switch>
        </mwc-formfield>
        ${this._roles.includes("teacher") ? html`
          <mwc-formfield label="Mittelwerte">
            <mwc-switch ?checked="${this._layers.includes('averages')}" @change="${e => this._switchLayer('averages', e.target.checked)}"></mwc-switch>
          </mwc-formfield>
          ${this._layers.includes('averages') ? html`<kmap-course-selector></kmap-course-selector>` : ''}
          <mwc-formfield label="Editor">
            <mwc-switch ?checked="${this._layers.includes('editor')}" @change="${e => this._switchLayer('editor', e.target.checked)}"></mwc-switch>
          </mwc-formfield>
          ${this._layers.includes('editor') ? html`
            ${this._page === 'home' || this._page === 'browser' ? html`<kmap-module-selector></kmap-module-selector>` : ''}
            ${this._page === 'test' ? html`<kmap-set-selector></kmap-set-selector>` : ''}
          ` : ''}
        ` : ''}
      </nav>
      <!--googleon: all-->
    </div>

    <div slot="appContent" class="main-content" role="main" @toggleDrawer="${() => this._drawerOpen = !this._drawerOpen}" @lclick="${this._showLogin}">
    ${this._instance ? html`
      ${this._renderPage()}

      ${this._page === 'home' || this._page === 'browser' ? html`
          ${this._layers.includes('editor') ? html`<kmap-editor-edit-dialog></kmap-editor-edit-dialog>` : ''}
          ${this._layers.includes('editor') ? html`<kmap-editor-rename-dialog></kmap-editor-rename-dialog>` : ''}
          ${this._layers.includes('editor') ? html`<kmap-editor-delete-dialog></kmap-editor-delete-dialog>` : ''}
          ${this._layers.includes('editor') ? html`<kmap-editor-add-fabs></kmap-editor-add-fabs>` : ''}
        ` : ''}
      ${this._page === 'test' ? html`
        ${this._layers.includes('editor') ? html`<kmap-test-editor-edit-dialog></kmap-test-editor-edit-dialog>` : ''}
        ${this._layers.includes('editor') ? html`<kmap-test-editor-delete-dialog></kmap-test-editor-delete-dialog>` : ''}
        ${this._layers.includes('editor') ? html`<kmap-test-editor-add-fabs></kmap-test-editor-add-fabs>` : ''}
      ` : ''}
    ` : ''}
    </div>
  </mwc-drawer>

  <kmap-instance-popup id="instance-popup"></kmap-instance-popup>
  <kmap-login-popup id="login-popup"></kmap-login-popup>

  ${this._messages.map((message, i) => html`
      <mwc-snackbar id="snackbar" labeltext="${message}" ?isOpen="${i === 0}" style="bottom: 100px"></mwc-snackbar>
`)}
`;
  }
}
