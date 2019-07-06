import { LitElement, html, css } from 'lit-element';
import {connect} from 'pwa-helpers/connect-mixin.js';
import {installMediaQueryWatcher} from 'pwa-helpers/media-query.js';
import {installOfflineWatcher} from 'pwa-helpers/network.js';
import {installRouter} from 'pwa-helpers/router.js';
import {updateMetadata} from 'pwa-helpers/metadata.js';

import {store} from './store.js';

import {
    navigate,
    updateOffline,
    login,
    showMessage,
} from './actions/app.js';

import 'mega-material/drawer';
import 'mega-material/icon-button';
import 'mega-material/snackbar';

import './components/kmap-login-popup'
import './components/kmap-subjects'

class KmapMain extends connect(store)(LitElement) {

  static get styles() {
    return [
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
      `,
    ];
  }

  render() {
    return html`
  <mwc-drawer id="drawer" hasheader dismissible>
    <span slot="title">KMap</span>
    <span slot="subtitle">Knowledge Map</span>
    <div class="drawer-content">
      <nav class="drawer-list">
        <a ?selected="${this._page === 'home'}" href="#home">Home</a>
        <a ?selected="${this._page === 'browser'}" href="#browser">Browser</a>
        <a ?selected="${this._page === 'test'}" href="#test">Test</a>
        <a ?selected="${this._page === 'content-mananer'}" ?disabled="${!this._roles || !this._roles.includes("teacher")}" href="#content-manager">Content Manager</a>
        <hr/>
        <a href="#browser/Hilfe/Hilfe">Hilfe</a>
      </nav>
    </div>
    <div slot="app-content">
    <main role="main" class="main-content">
        <kmap-login-popup></kmap-login-popup>

        <kmap-subjects ?active="${this._page === 'home'}" class="page" ></kmap-subjects>
        <kmap-browser ?active="${this._page === 'browser'}" class="page" ></kmap-browser>
        <kmap-test ?active="${this._page === 'test'}" class="page" ></kmap-test>
        <kmap-content-manager ?active="${this._page === 'content-manager'}" class="page" ></kmap-content-manager>
    </main>
      </div>
   </mwc-drawer>
   <mwc-snackbar id="snackbar">${this._renderMessages()}</mwc-snackbar>
`;
  }

  static get properties() {
    return {
      title: { type: String },
      _page: {type: String},
      _userid: {type: String},
      _roles: {type: Array},
      _messages: {type: Array},
    };
  }

  constructor() {
    super();
    this.title = 'KMap';
    this._page = "home";
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
            const pageTitle = this.appTitle + ' - ' + this._title;
            updateMetadata({
                title: pageTitle,
                description: pageTitle
                // This object also takes an image property, that points to an img src.
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
        this._page = state.app.page;
        this._title = state.app.title;
        this._userid = state.app.userid;
        this._roles = state.app.roles;
        this._messages = state.app.messages;
    }

    _renderMessages() {
      return html`
            ${this._messages.map((message, i) => html`
                <li>${message}</li>
            `)}
      `;
    }
}

customElements.define('kmap-main', KmapMain);
