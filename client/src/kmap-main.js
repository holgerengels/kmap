import { LitElement, html, css } from 'lit-element';
import {connect} from 'pwa-helpers/connect-mixin.js';
import {installMediaQueryWatcher} from 'pwa-helpers/media-query.js';
import {installOfflineWatcher} from 'pwa-helpers/network.js';
import {installRouter} from 'pwa-helpers/router.js';
import {updateMetadata} from 'pwa-helpers/metadata.js';
import {fontStyles, colorStyles} from "./components/kmap-styles";

import {store} from './store.js';

import {
    navigate,
    updateOffline,
    login,
    showMessage,
    addLayer, removeLayer
} from './actions/app.js';

import 'mega-material/button';
import 'mega-material/drawer';
import 'mega-material/icon-button';
import 'mega-material/snackbar';

import './components/kmap-login-popup';
import './components/kmap-subjects';
import './components/kmap-editor';
import './components/kmap-summaries'
import './components/kmap-averages'
import './components/kmap-editor-edit-dialog'

class KmapMain extends connect(store)(LitElement) {

  static get styles() {
    // language=CSS
    return [
      fontStyles,
      colorStyles,
      css`
      :host {
        --app-drawer-background-color: var(--app-secondary-color);
        --app-drawer-text-color: var(--app-light-text-color);
        --app-drawer-selected-color: #c67100;
      }

      :host {
        position: absolute;
        top: 0px;
        left: 0px;
        right: 0px;
        bottom: 0px;
      }
      kmap-login-popup {
        position: absolute;
        top: 16px;
        right: 16px;
        z-index: 1000;
      }
      .drawer-content {
        padding: 0px 16px 0 16px;
      }
      .drawer-list {
        box-sizing: border-box;
        width: 100%;
        height: 100%;
        padding-top: 24px;
        background: var(--app-drawer-background-color);
        position: relative;
      }
      .drawer-list > a {
        display: block;
        text-decoration: none;
        color: var(--app-drawer-text-color);
        line-height: 40px;
        padding: 0 24px;
      }

      .drawer-list > a[selected] {
        color: var(--app-drawer-selected-color);
      }

      .page {
        display: none;
      }

      .page[active] {
        display: block;
      }
      a[disabled] {
        pointer-events: none;
        color: var(--color-mediumgray);
      }
      mwc-button[disabled] {
         --mdc-theme-primary: var(--color-mediumgray);
         pointer-events: none;
      }
      `,
    ];
  }

  render() {
    // language=HTML
    return html`
  <mwc-drawer id="drawer" hasheader dismissible>
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
      </nav>
      <hr/>
      <br/>
      <label section>Layer</label><br/><br/>
      <mwc-button @click="${e => this._toggleLayer('summaries')}" icon="short_text" outlined ?raised="${this._layers.includes('summaries')}">Kurztexte</mwc-button>
      ${this._layers.includes('summaries') ? html`<kmap-summaries></kmap-summaries>` : ''}
      <mwc-button @click="${e => this._toggleLayer('averages')}" icon="group_work" outlined ?raised="${this._layers.includes('averages')}" ?disabled="${!this._roles.includes("teacher")}">Mittelwerte</mwc-button>
      ${this._layers.includes('averages') ? html`<kmap-averages></kmap-averages>` : ''}
      <mwc-button @click="${e => this._toggleLayer('editor')}" icon="edit" outlined ?raised="${this._layers.includes('editor')}" ?disabled="${!this._roles.includes("teacher")}">editor</mwc-button>
      ${this._layers.includes('editor') ? html`<kmap-editor></kmap-editor>` : ''}
    </div>
    <div slot="app-content">
      <main role="main" class="main-content">
        <kmap-login-popup></kmap-login-popup>

        <kmap-subjects ?active="${this._page === 'home'}" class="page" ></kmap-subjects>
        <kmap-browser ?active="${this._page === 'browser'}" class="page" ></kmap-browser>
        <kmap-test ?active="${this._page === 'test'}" class="page" ></kmap-test>
        <kmap-courses ?active="${this._page === 'courses'}" class="page" ></kmap-courses>
        <kmap-content-manager ?active="${this._page === 'content-manager'}" class="page" ></kmap-content-manager>
      </main>
      ${this._layers.includes('editor') ? html`<kmap-editor-edit-dialog></kmap-editor-edit-dialog>` : ''}
    </div>
  </mwc-drawer>
  <mwc-snackbar id="snackbar">${this._renderMessages()}</mwc-snackbar>
`;
  }

  static get properties() {
    return {
      _userid: {type: String},
      _roles: {type: Array},
      _page: {type: String},
      _title: {type: String},
      _messages: {type: Array},
      _layers: {type: Array},
    };
  }

  constructor() {
    super();
    this._roles = [];
    this._page = "home";
    this._title = 'KMap';
    this._layers = [];
  }

  firstUpdated(changedProperties) {
    installRouter((location) => store.dispatch(navigate(decodeURIComponent(location.hash))));
    installOfflineWatcher((offline) => store.dispatch(updateOffline(offline)));
    installMediaQueryWatcher(`(min-width: 460px)`, () => {});
    this._drawer = this.shadowRoot.getElementById('drawer');
    this._snackbar = this.shadowRoot.getElementById('snackbar');
  }

  updated(changedProps) {
    if (changedProps.has('_title')) {
      const pageTitle = 'KMap - ' + this._title;
      updateMetadata({
        title: pageTitle,
        description: pageTitle
      });
    }

    if (changedProps.has('_page'))
      this._drawer.close();

    if (changedProps.has('_messages')) {
      if (this._messages.length > 0) {
        this._snackbar.open();
        console.log(this._messages);
      }
    }
  }

  stateChanged(state) {
    console.log(state);

    this._userid = state.app.userid;
    this._roles = state.app.roles;
    this._page = state.app.page;
    this._title = state.app.title;
    this._messages = state.app.messages;
    this._layers = state.app.layers;
  }

  _renderMessages() {
    return html`
            ${this._messages.map((message, i) => html`
                <li>${message}</li>
            `)}
      `;
  }

  _toggleLayer(layer) {
    if (this._layers.includes(layer))
      store.dispatch(removeLayer(layer));
    else {
      if (layer === 'summaries' && this._layers.includes('averages'))
        store.dispatch(removeLayer('averages'));
      else if (layer === 'averages' && this._layers.includes('summaries'))
        store.dispatch(removeLayer('summaries'));
      else if (layer === 'summaries' && this._layers.includes('editor'))
        store.dispatch(removeLayer('editor'));
      else if (layer === 'editor' && this._layers.includes('summaries'))
        store.dispatch(removeLayer('summaries'));

      store.dispatch(addLayer(layer));
    }
  }
}

customElements.define('kmap-main', KmapMain);
