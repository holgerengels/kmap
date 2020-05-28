import {LitElement, html, css, customElement, property, query} from 'lit-element';
import {installMediaQueryWatcher} from 'pwa-helpers/media-query.js';
import {installOfflineWatcher} from 'pwa-helpers/network.js';
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
import './components/share-facebook';

import {fontStyles, colorStyles} from "./components/kmap-styles";
import {Snackbar} from "@material/mwc-snackbar/mwc-snackbar";
import {KMapLoginPopup} from "./components/kmap-login-popup";
import {KMapInstancePopup} from "./components/kmap-instance-popup";
import {TopAppBar} from "@material/mwc-top-app-bar/mwc-top-app-bar";
import {Meta} from "./models/shell";

// @ts-ignore
const _standalone = (window.matchMedia('(display-mode: standalone)').matches) || (window.navigator.standalone) || document.referrer.includes('android-app://');

@customElement('kmap-main')
export class KmapMain extends connect(store, LitElement) {

  @property()
  private _page: string = '';
  @property()
  private _meta: Meta = {};
  @property()
  private _barTitle: string = '';
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
      _meta: state.shell.meta,
      _narrow: state.shell.narrow,
      _messages: state.shell.messages,
    };
  }

  // @ts-ignore
  firstUpdated(changedProperties) {
    updateMetadata({ title: "KMap", description: "KMap kartographiert Wissen mit Zusammenhang", image: window.location.origin + "/app/KMap-Logo.png" });

    if (this.shadowRoot) {
      const bar: TopAppBar | null = this.shadowRoot.querySelector("mwc-top-app-bar");
      const main: HTMLElement | null = this.shadowRoot.querySelector(".main-content");
      if (bar && main)
        bar.scrollTarget = main;
    }

    store.dispatch.shell.clearMessages();
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
      store.dispatch.app.chooseInstance("root");

    installOfflineWatcher((offline) => store.dispatch.app.updateOffline(offline));
    installMediaQueryWatcher(`(max-width: 500px)`, (matches) => store.dispatch.shell.updateNarrow(matches));
    this.installOnErrorHandler();
  }

  updated(changedProps) {
    if (changedProps.has('_meta')) {
      const barTitle = this._meta.title || _title.get(this._page);
      const docTitle = this._meta.detail || this._meta.title || _title.get(this._page);
      const title = this._meta.detail ? this._meta.title  + " - " + this._meta.detail : this._meta.title;
      const description = this._meta.description || "KMap kartographiert Wissen mit Zusammenhang";
      this._barTitle = barTitle || "KMap";
      document.title = docTitle ? docTitle + " - KMap" : "KMap";
      updateMetadata({ title: title, description: description, image: undefined });
      updateLd({
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": title,
        "name": title,
        "description": description,
        "image": this._meta.image ? [this._meta.image] : undefined,
        "dateModified": this._meta.modified ? new Date(this._meta.modified) : undefined,
        "author": this._meta.author ? {
          "@type": "Person",
          "name": this._meta.author
        } : {
          "@type": "Organization",
          "name": "KMap Team"
        },
        "provider": {
          "@type": "Organization",
          "name": "KMap Team",
          "email": "hengels@gmail.com",
          "logo": {
            "@type": "ImageObject",
            "url": "https://kmap.eu/app/KMap-Logo.png"
          }
        }
      })
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

  private installOnErrorHandler() {
    window.onerror = function (message, source, lineno, colno, error) {
      if (error)
        store.dispatch.feedback.bug({message: error.name + ": " + error.message, detail: error.stack as string});
      else {
        store.dispatch.feedback.bug({message: message as string, detail: source + " (" + lineno + ":" + colno + ")"});
      }
      return false;
    };
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
        line-height: 30px;
        color: var(--app-drawer-text-color);
      }
      .drawer-list > a[selected] {
        color: var(--app-drawer-selected-color);
      }
      .drawer-list > mwc-formfield {
        margin: 16px 0px;
      }
      .main-content {
        width: 100%;
        height: 100%;
        overflow: auto;
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
        h1 {
          margin: unset; color: unset;
        }
      mwc-icon-button[icon="polymer"] {
        --mdc-icon-size: 18px;
        --mdc-icon-button-size: 18px;
        transition: color ease-in-out .3s;
      }
      span:hover mwc-icon-button[icon="polymer"] {
        color: var(--color-primary-dark);
      }
        share-facebook, a[rel=license] {
          padding-left: 16px;
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
        <a ?selected="${this._page === 'home'}" href="/app/">Start</a>
        <a ?selected="${this._page === 'browser'}" href="/app/browser/${this._path}" ?disabled="${!this._path}">Browser</a>
        ${this._roles.includes("teacher") ? html`
          <a ?selected="${this._page === 'test'}" href="/app/test">Test</a>
        ` : ''}
        <a ?selected="${this._page === 'courses'}" ?disabled="${!this._roles.includes("teacher")}" href="/app/courses">Kurse</a>
        <a ?selected="${this._page === 'content-manager'}" ?disabled="${!this._roles.includes("teacher")}" href="/app/content-manager">Content Manager</a>
        <a href="/app/browser/Hilfe/Hilfe">Hilfe</a>
        <a href="/app/browser/Hilfe/Hilfe/Impressum">Impressum</a>
        <pwa-install-button><mwc-button outlined style="--mdc-theme-primary: var(--color-secondary-dark);">App installieren</mwc-button></pwa-install-button>
        <pwa-update-available><mwc-button outlined style="--mdc-theme-primary: var(--color-secondary-dark);">App aktualisieren</mwc-button></pwa-update-available>
      </nav>
      <!--googleoff: all-->
        <share-facebook></share-facebook>
      <nav class="drawer-list">
        <hr/><br/>
        <label section>Layer ein-/ausblenden</label>
        <mwc-formfield label="Kurztexte">
          <mwc-switch ?checked="${this._layers.includes('summaries')}" @change="${e => this._switchLayer('summaries', e.target.checked)}"></mwc-switch>
        </mwc-formfield>
        <mwc-formfield label="Pfeile">
          <mwc-switch ?checked="${this._layers.includes('dependencies')}" @change="${e => this._switchLayer('dependencies', e.target.checked)}"></mwc-switch>
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
      <a style="display: inline-block" rel="license" href="http://creativecommons.org/licenses/by-sa/4.0/deed.de"><img src="//i.creativecommons.org/l/by-sa/4.0/88x31.png" alt="CC BY-SA 4.0"></a>
    </div>

    <div slot="appContent" class="main-content" role="main">
    ${this._instance ? html`
      <mwc-top-app-bar id="bar" dense>
        <mwc-icon-button icon="menu" slot="navigationIcon" @click="${() => this._drawerOpen = !this._drawerOpen}"></mwc-icon-button>
        <mwc-icon-button icon="arrow_back" slot="navigationIcon" @click="${() => history.back()}" ?hidden="${!_standalone}"></mwc-icon-button>
        <h1 slot="title">${this._barTitle}</h1>
        <kmap-login-button slot="actionItems" @click="${this._showLogin}"></kmap-login-button>
      </mwc-top-app-bar>

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

const _title = new Map([
  ['home', "Start"],
  ['browser', "Browser"],
  ['test', "Test"],
  ['courses', "Kurse"],
  ['content-manager', "Content Manager"],
]);

const updateMetadata = ({ title, description, image }) => {
  if (title) {
    setMetaTag('property', 'og:title', title);
  }
  if (description) {
    setMetaTag('name', 'description', description);
    setMetaTag('property', 'og:description', description);
  }
  if (image) {
    setMetaTag('property', 'og:image', image);
  }
  setMetaTag('property', 'og:url', window.location.href);
};

function setMetaTag(attrName, attrValue, content) {
  let element = document.head.querySelector(`meta[${attrName}="${attrValue}"]`);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attrName, attrValue);
    document.head.appendChild(element);
  }
  element.setAttribute('content', content || '');
}

const updateLd = (ld) => {
  const element: HTMLScriptElement = document.getElementById("ld") as HTMLScriptElement;
  element.innerText = JSON.stringify(ld);
};
