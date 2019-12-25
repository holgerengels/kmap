import {LitElement, html, css, customElement, property, query} from 'lit-element';
import { get, set } from 'idb-keyval';
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
import 'pwa-helper-components/pwa-install-button';
import 'pwa-helper-components/pwa-update-available';

import './components/kmap-browser';
import './components/kmap-login-popup';
import './components/kmap-subjects';
import './components/kmap-test';
import './components/kmap-editor';
import './components/kmap-test-editor';
import './components/kmap-summaries';
import './components/kmap-averages';
import './components/kmap-editor-edit-dialog';
import './components/kmap-editor-rename-dialog';
import './components/kmap-editor-delete-dialog';
import './components/kmap-editor-add-fabs';
import './components/kmap-test-editor-add-fabs';
import './components/kmap-test-editor-edit-dialog';
import './components/kmap-test-editor-delete-dialog';

import {fontStyles, colorStyles} from "./components/kmap-styles";
import {Snackbar} from "@material/mwc-snackbar/mwc-snackbar";
import {Dialog} from "@material/mwc-dialog/mwc-dialog";

@customElement('kmap-main')
class KmapMain extends connect(store, LitElement) {

  @property()
  private _page: string = '';
  @property()
  private _title: string = '';
  @property()
  private _instance: string = '';
  @property()
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
  private _snackbar: Snackbar;
  @query('#instanceDialog')
  private _instanceDialog: Dialog;
  @query('#login-popup')
  private _loginPopup: Element;

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
      _title: state.shell.title,
      _drawerOpen: state.shell.drawerOpen,
      _narrow: state.shell.narrow,
      _messages: state.shell.messages,
    };
  }

  firstUpdated(changedProperties) {
    if (!window.location.host.includes("localhost")) {
      let pathComponent = window.location.pathname.split('/')[1];
      let cookie:string = this._getCookie("instance");
      if (pathComponent !== "app") {
        console.log("choose instance .. " + pathComponent);
        document.cookie = "instance=" + pathComponent + "; path=/";
        window.location.pathname = window.location.pathname.replace(pathComponent, "app");
      }
      else if (cookie) {
        console.log("instance from cookie .. " + cookie);
        document.cookie = "instance=" + cookie + "; path=/; expires=0";
        set("instance", cookie)
          .then(() => store.dispatch.app.chooseInstance(cookie));
      }
      else {
        get('instance').then((instance: string) => {
          if (instance) {
            console.log("instance from idb .. " + instance);
            store.dispatch.app.chooseInstance(instance);
          }
          else
            this._instanceDialog.show();
        });
      }
    }
    else
      store.dispatch.app.chooseInstance("lala");

    installOfflineWatcher((offline) => store.dispatch.app.updateOffline(offline));
    installMediaQueryWatcher(`(max-width: 500px)`, (matches) => store.dispatch.shell.updateNarrow(matches));
  }

  updated(changedProps) {
    if (changedProps.has('_title')) {
      const pageTitle = 'KMap - ' + this._title;
      updateMetadata({
        title: pageTitle,
        description: pageTitle
      });
    }

    if (changedProps.has('_page') && !this._layers.includes('editor'))
      this._drawerOpen = false;

    if (changedProps.has('_messages')) {
      if (this._messages.length > 0) {
        this._snackbar.open();
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

  _toggleLayer(layer) {
    if (this._layers.includes(layer))
      store.dispatch.shell.removeLayer(layer);
    else {
      if (layer === 'summaries' && this._layers.includes('averages'))
        store.dispatch.shell.removeLayer('averages');
      else if (layer === 'averages' && this._layers.includes('summaries'))
        store.dispatch.shell.removeLayer('summaries');
      else if (layer === 'averages' && this._layers.includes('editor'))
        store.dispatch.shell.removeLayer('editor');
      else if (layer === 'editor' && this._layers.includes('averages'))
        store.dispatch.shell.removeLayer('averages');

      store.dispatch.shell.addLayer(layer);
    }
  }

  _showLogin() {
    this._loginPopup.show();
  }

  _chooseInstance() {
    let textfield =  this.shadowRoot.getElementById('instance');
    let instance = textfield.value;
    set("instance", instance)
      .then(() => store.dispatch.app.chooseInstance(instance));
    this._instanceDialog.close();
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
      .main-content {
          width: 100% !important;
      }
      [hidden] {
        display: none !important;
      }
      `,
    ];
  }

  render() {
    // language=HTML
    return html`
  <mwc-drawer id="drawer" hasheader type="${this._narrow ? 'modal' : 'dismissible'}" ?open="${this._drawerOpen}">
    <span slot="title">KMap <span class="secondary" style="vertical-align: middle">[${this._instance}]</span></span>
    <span slot="subtitle">Knowledge Map</span>
    <div class="drawer-content">
      <nav class="drawer-list">
        <a ?selected="${this._page === 'home'}" href="/:app">Home</a>
        <a ?selected="${this._page === 'browser'}" href="/:app/browser/${this._path}" ?disabled="${!this._path}">Browser</a>
        <a ?selected="${this._page === 'test'}" href="/:app/test">Test</a>
        <a ?selected="${this._page === 'courses'}" ?disabled="${!this._roles.includes("teacher")}" href="/:app/courses">Kurse</a>
        <a ?selected="${this._page === 'content-mananer'}" ?disabled="${!this._roles.includes("teacher")}" href="/:app/content-manager">Content Manager</a>
        <a href="#browser/Hilfe/Hilfe">Hilfe</a>

        <pwa-install-button><mwc-button>App installieren</mwc-button></pwa-install-button>
        <pwa-update-available><mwc-button>App aktualisieren</mwc-button></pwa-update-available>
      </nav>
      <hr/>
      <nav class="drawer-list">
        <label section>Layer ein-/ausblenden</label>
        <mwc-button @click="${() => this._toggleLayer('summaries')}" icon="short_text" outlined ?raised="${this._layers.includes('summaries')}">Kurztexte</mwc-button>
        ${this._layers.includes('summaries') ? html`<kmap-summaries></kmap-summaries>` : ''}
        <mwc-button @click="${() => this._toggleLayer('averages')}" icon="group_work" outlined ?raised="${this._layers.includes('averages')}" ?disabled="${!this._roles.includes("teacher")}" title="Erfordert die Rolle 'Lehrer'">Mittelwerte</mwc-button>
        ${this._layers.includes('averages') ? html`<kmap-averages></kmap-averages>` : ''}
        <mwc-button @click="${() => this._toggleLayer('editor')}" icon="edit" outlined ?raised="${this._layers.includes('editor')}" ?disabled="${!this._roles.includes("teacher")}" title="Erfordert die Rolle 'Lehrer'">editor</mwc-button>
        ${this._layers.includes('editor') ? html`
          ${this._page === 'home' || this._page === 'browser' ? html`<kmap-editor></kmap-editor>` : ''}
          ${this._page === 'test' ? html`<kmap-test-editor></kmap-test-editor>` : ''}
        ` : ''}
      </nav>
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
    <mwc-dialog id="instanceDialog" title="Instanz wählen">
      <mwc-textfield id="instance" name="instance" label="Instanz" type="text" required dialogInitialFocus></mwc-textfield>
      <mwc-button slot="primaryAction" @click=${this._chooseInstance}>Auswählen</mwc-button>
   </mwc-dialog>
     <kmap-login-popup id="login-popup"></kmap-login-popup>
  <mwc-snackbar id="snackbar" labeltext="${this._renderMessages()}"></mwc-snackbar>
`;
  }
}
