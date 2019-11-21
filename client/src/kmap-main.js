import { LitElement, html, css } from 'lit-element';
import { get, set } from 'idb-keyval';
import {connect} from 'pwa-helpers/connect-mixin.js';
import {installMediaQueryWatcher} from 'pwa-helpers/media-query.js';
import {installOfflineWatcher} from 'pwa-helpers/network.js';
import {installRouter} from 'pwa-helpers/router.js';
import {updateMetadata} from 'pwa-helpers/metadata.js';
import {fontStyles, colorStyles} from "./components/kmap-styles";
import "web-animations-js/web-animations.min";

import {store} from './store.js';

import {
    navigate,
    updateOffline,
    addLayer, removeLayer
} from './actions/app.js';

import '@material/mwc-button';
import '@material/mwc-drawer';
import '@material/mwc-icon-button';
import '@material/mwc-snackbar';
import 'pwa-helper-components/pwa-install-button';
import 'pwa-helper-components/pwa-update-available';

import './components/kmap-login-popup';
import './components/kmap-subjects';
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
import {chooseInstance} from "./actions/app";

class KmapMain extends connect(store)(LitElement) {

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
          margin: 8px 0px;
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
  <mwc-drawer id="drawer" hasheader type="dismissible" ?open="${this._drawerOpen}">
    <span slot="title">KMap</span>
    <span slot="subtitle">Knowledge Map</span>
    <div class="drawer-content">
      <nav class="drawer-list">
        <a ?selected="${this._page === 'home'}" href="#home">Home</a>
        <a ?selected="${this._page === 'browser'}" href="#browser">Browser</a>
        <a ?selected="${this._page === 'test'}" href="#test">Test</a>
        <a ?selected="${this._page === 'courses'}" ?disabled="${!this._roles.includes("teacher")}" href="#courses">Kurse</a>
        <a ?selected="${this._page === 'content-mananer'}" ?disabled="${!this._roles.includes("teacher")}" href="#content-manager">Content Manager</a>
        <a href="#browser/Hilfe/Hilfe">Hilfe</a>

        <pwa-install-button><mwc-button>App installieren</mwc-button></pwa-install-button>
        <pwa-update-available><mwc-button>App aktualisieren</mwc-button></pwa-update-available>
      </nav>
      <hr/>
      <nav class="drawer-list">
        <label section>Layer ein-/ausblenden</label>
        <mwc-button @click="${e => this._toggleLayer('summaries')}" icon="short_text" outlined ?raised="${this._layers.includes('summaries')}">Kurztexte</mwc-button>
        ${this._layers.includes('summaries') ? html`<kmap-summaries></kmap-summaries>` : ''}
        <mwc-button @click="${e => this._toggleLayer('averages')}" icon="group_work" outlined ?raised="${this._layers.includes('averages')}" ?disabled="${!this._roles.includes("teacher")}" title="Erfordert die Rolle 'Lehrer'">Mittelwerte</mwc-button>
        ${this._layers.includes('averages') ? html`<kmap-averages></kmap-averages>` : ''}
        <mwc-button @click="${e => this._toggleLayer('editor')}" icon="edit" outlined ?raised="${this._layers.includes('editor')}" ?disabled="${!this._roles.includes("teacher")}" title="Erfordert die Rolle 'Lehrer'">editor</mwc-button>
        ${this._layers.includes('editor') ? html`
          ${this._page === 'home' || this._page === 'browser' ? html`<kmap-editor></kmap-editor>` : ''}
          ${this._page === 'test' ? html`<kmap-test-editor></kmap-test-editor>` : ''}
        ` : ''}
      </nav>
    </div>
    
    <div slot="appContent" class="main-content" role="main" @toggleDrawer="${e => this._drawerOpen = !this._drawerOpen}" @lclick="${this._showLogin}">
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

  static get properties() {
    return {
      _instance: {type: String},
      _userid: {type: String},
      _roles: {type: Array},
      _page: {type: String},
      _title: {type: String},
      _messages: {type: Array},
      _layers: {type: Array},
      _drawerOpen: {type: Boolean},
    };
  }

  constructor() {
    super();
    this._instance = null;
    this._roles = [];
    this._page = "home";
    this._title = 'KMap';
    this._layers = [];
    this._drawerOpen = false;
  }

  firstUpdated(changedProperties) {
    get('instance').then(instance => {
      if (instance) {
        console.log("instance from idb: " + instance);
        store.dispatch(chooseInstance(instance));
      }
      else if((instance = getCookie("instance"))) {
        console.log("instance from cookie: " + instance);
        set("instance", instance);
        store.dispatch(chooseInstance(instance));
      }
      else
        this.shadowRoot.getElementById('instanceDialog').open = true;
    });

    installRouter((location) => store.dispatch(navigate(decodeURIComponent(location.hash))));
    installOfflineWatcher((offline) => store.dispatch(updateOffline(offline)));
    installMediaQueryWatcher(`(min-width: 460px)`, () => {});
    this._snackbar = this.shadowRoot.getElementById('snackbar');
    this._loginPopup = this.shadowRoot.getElementById('login-popup');
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

  stateChanged(state) {
    console.log(state);

    this._instance = state.app.instance;
    this._userid = state.app.userid;
    this._roles = state.app.roles;
    this._page = state.app.page;
    this._title = state.app.title;
    this._messages = state.app.messages;
    this._layers = state.app.layers;
  }

  _renderPage() {
    switch (this._page) {
      case 'home':
        return html`<kmap-subjects class="page" ></kmap-subjects>`;
      case 'browser':
        return html`<kmap-browser class="page" ></kmap-browser>`;
      case 'test':
        return html`<kmap-test class="page" ></kmap-test>`;
      case 'courses':
        return html`<kmap-courses class="page" ></kmap-courses>`;
      case 'content-manager':
        return html`<kmap-content-manager class="page" ></kmap-content-manager>`;
      default:
        return html`lala`;
    }
  }
  _renderMessages() {
    return this._messages.join("\n");
  }

  _toggleLayer(layer) {
    if (this._layers.includes(layer))
      store.dispatch(removeLayer(layer));
    else {
      if (layer === 'summaries' && this._layers.includes('averages'))
        store.dispatch(removeLayer('averages'));
      else if (layer === 'averages' && this._layers.includes('summaries'))
        store.dispatch(removeLayer('summaries'));
      else if (layer === 'averages' && this._layers.includes('editor'))
        store.dispatch(removeLayer('editor'));
      else if (layer === 'editor' && this._layers.includes('averages'))
        store.dispatch(removeLayer('averages'));

      store.dispatch(addLayer(layer));
    }
  }

  _showLogin() {
    this._loginPopup.show();
  }

  _chooseInstance() {
    let textfield =  this.shadowRoot.getElementById('instance');
    let instance = textfield.value;
    set("instance", instance);
    store.dispatch(chooseInstance(instance));
    this.shadowRoot.getElementById('instanceDialog').open = false;
  }
}

function getCookie(n) {
  let a = `; ${document.cookie}`.match(`;\\s*${n}=([^;]+)`);
  return a ? a[1] : null;
}

customElements.define('kmap-main', KmapMain);
