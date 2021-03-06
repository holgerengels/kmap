import {css, customElement, html, LitElement, property, query} from 'lit-element';
import {installMediaQueryWatcher} from 'pwa-helpers/media-query.js';
import {installOfflineWatcher} from 'pwa-helpers/network.js';
import "web-animations-js/web-animations.min";
import {connect, RoutingState} from '@captaincodeman/rdx'
import {State, store} from './store'

import '@material/mwc-button';
import '@material/mwc-drawer';
import '@material/mwc-icon-button';
import '@material/mwc-icon-button-toggle';
import '@material/mwc-snackbar';
import '@material/mwc-switch';
import 'pwa-helper-components/pwa-install-button';
import 'pwa-helper-components/pwa-update-available';

import './components/kmap-subjects';
import './components/kmap-browser';
import './components/kmap-test';
import './components/kmap-exercise';
import './components/kmap-timeline-selector';
import './components/share-facebook';

import {colorStyles, fontStyles} from "./components/kmap-styles";
import {Snackbar} from "@material/mwc-snackbar/mwc-snackbar";
import {TopAppBar} from "@material/mwc-top-app-bar/mwc-top-app-bar";
import {Meta} from "./models/shell";
import {Timeline} from "./models/courses";
import {timelineClosed, timelineOpen} from "./components/icons";

// @ts-ignore
//const _standalone = (window.matchMedia('(display-mode: standalone)').matches) || (window.navigator.standalone) || document.referrer.includes('android-app://');

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
  private _timelines: Timeline[] = [];

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

  @query('#bar')
  private _bar: TopAppBar;
  @query('#main')
  private _main: HTMLElement;

  set route(val: RoutingState<string>) {
    if (val.page !== this._page) {
      this._page = val.page
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
      _timelines: state.courses.timelines,
      _meta: state.shell.meta,
      _narrow: state.shell.narrow,
      _messages: state.shell.messages,
    };
  }

  // @ts-ignore
  firstUpdated(changedProperties) {
    if ((window as any).compactCards) {
      store.dispatch.shell.updateCompactCards(true);
    }

    this._bar.scrollTarget = this._main;

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

    var supportsPassive = false;
    try {
      var opts = Object.defineProperty({}, 'passive', { get: function() { supportsPassive = true; } });
      // @ts-ignore
      window.addEventListener("testPassive", null, opts);
      // @ts-ignore
      window.removeEventListener("testPassive", null, opts);
    } catch (e) {}
    console.log("passive eventlisteners supported: " + supportsPassive);
    store.dispatch.shell.updatePassiveEventListeners(supportsPassive);
  }

  updated(changedProps) {
    if (changedProps.has('_meta')) {
      console.log(this._meta);

      this._barTitle = this._meta.title || _title.get(this._page) || "KMap";
    }

    if (changedProps.has('_page') && !this._layers.includes('editor'))
      this._drawerOpen = false;

    if (changedProps.has('_messages')) {
      if (this._messages.length > 0) {
        //this._snackbar.open();
        console.log(this._messages);
      }
    }

    if (changedProps.has("_drawerOpen")) {
      store.dispatch.shell.updateDrawerOpen(this._drawerOpen);
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
    if (!this._instance)
      return '';

    switch (this._page) {
      case 'home':
        return html`<kmap-subjects class="page"></kmap-subjects>`;
      case 'browser':
        return html`<kmap-browser class="page"></kmap-browser>`;
      case 'exercise':
        return html`<kmap-exercise class="page"></kmap-exercise>`;
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

  _toggleTimeline() {
    if (store.state.courses.selectedTimeline)
      store.dispatch.courses.unselectTimeline();
    else
      store.dispatch.courses.selectTimeline(this._timelines[0]);
  }

  async _showLogin() {
    if (customElements.get('kmap-login-popup') === undefined) {
      await import('./components/kmap-login-popup');
    }
    this._loginPopup.show();
  }

  async _showChooseInstance() {
    if (customElements.get('kmap-instance-popup') === undefined) {
      await import('./components/kmap-instance-popup');
    }
    this._instancePopup.show();
  }

  _getCookie(n) {
    let a = `; ${document.cookie}`.match(`;\\s*${n}=([^;]+)`);
    return a ? a[1] : null;
  }

  _updateAvailable() {
    this._drawerOpen = true;
    store.dispatch.shell.showMessage('Bitte aktualisiere die KMap App, indem Du im Menü auf "APP AKTUALISIEREN" klickst!');
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
      mwc-drawer {
        --mdc-theme-surface: white;
      }
      .drawer-list {
        display: flex;
        flex-direction: column;
      }
      .drawer-list > * {
        margin: 8px 16px;
      }
      .drawer-list > .nomargin {
        margin: 8px 0px;
      }
      .drawer-lists > :first-child {
        margin-top: 0;
      }
      .drawer-list > a {
        color: var(--app-drawer-text-color);
      }
      .drawer-list > a[selected] {
        color: var(--app-drawer-selected-color);
      }
      .cc-fb {
        margin: 16px;
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: space-evenly;
      }
      span[slot=subtitle] {
        display: flex;
        align-content: center;
      }
      span[slot=subtitle] > * {
        margin-right: 8px;
      }
      hr {
        height: 0;
        margin: 8px 0px;
        border-top: none;
        border-right: none;
        border-left: none;
        border-bottom: 1px solid rgba(0, 0, 0, 0.12);
      }
      mwc-icon-button[icon="polymer"] {
        --mdc-icon-size: 18px;
        --mdc-icon-button-size: 18px;
        transition: color ease-in-out .3s;
      }
      span:hover mwc-icon-button[icon="polymer"] {
        color: var(--color-primary-dark);
      }

      main {
        width: 100%;
        height: 100%;
        box-sizing: border-box;
        overflow: auto;
        scrollbar-color: var(--color-mediumgray);
        scrollbar-width: thin;
        scroll-behavior: smooth;
        scroll-snap-type: y mandatory;
      }
      [hidden] {
        display: none !important;
      }
        h1 {
          margin: unset; color: unset;
        }
      `,
    ];
  }

  render() {
    // language=HTML
    return html`
  <mwc-drawer id="drawer" hasheader type="${this._narrow ? 'modal' : 'dismissible'}" ?open="${this._drawerOpen}" @MDCDrawer:closed="${() => this._drawerOpen = false}">
    <span slot="title">Knowledge Map</span>
    <span slot="subtitle">[<span>&nbsp;<b>Instanz:</b> ${this._instance}</span><mwc-icon-button icon="polymer" @click="${this._showChooseInstance}" title="Instanz wechseln"></mwc-icon-button>]</span>
    ${this._renderDrawer()}

    <main id="main" slot="appContent" role="main">
      <mwc-top-app-bar id="bar" dense>
        <mwc-icon-button style="color: white" icon="menu" slot="navigationIcon" @click="${() => this._drawerOpen = !this._drawerOpen}"></mwc-icon-button>
        <h1 slot="title">${this._barTitle}</h1>
        <mwc-icon-button-toggle slot="actionItems" @click="${this._toggleTimeline}" ?hidden="${this._timelines.length !== 1 || this._page !== 'browser'}" title="Wochenplan">${timelineOpen}${timelineClosed}</mwc-icon-button-toggle>
        <kmap-login-button slot="actionItems" @click="${this._showLogin}" title="Anmeldung"></kmap-login-button>
      </mwc-top-app-bar>

      ${this._renderPage()}
    </main>
  </mwc-drawer>

  ${this._page === 'home' || this._page === 'browser' ? html`
      ${this._layers.includes('editor') ? html`<kmap-editor-edit-dialog></kmap-editor-edit-dialog>` : ''}
      ${this._layers.includes('editor') ? html`<kmap-editor-rename-dialog></kmap-editor-rename-dialog>` : ''}
      ${this._layers.includes('editor') ? html`<kmap-editor-move-dialog></kmap-editor-move-dialog>` : ''}
      ${this._layers.includes('editor') ? html`<kmap-editor-delete-dialog></kmap-editor-delete-dialog>` : ''}
      ${this._layers.includes('editor') ? html`<kmap-editor-add-fabs></kmap-editor-add-fabs>` : ''}
  ` : ''}
  ${this._page === 'test' ? html`
    ${this._layers.includes('editor') ? html`<kmap-test-editor-edit-dialog></kmap-test-editor-edit-dialog>` : ''}
    ${this._layers.includes('editor') ? html`<kmap-test-editor-rename-dialog></kmap-test-editor-rename-dialog>` : ''}
    ${this._layers.includes('editor') ? html`<kmap-test-editor-delete-dialog></kmap-test-editor-delete-dialog>` : ''}
    ${this._layers.includes('editor') ? html`<kmap-test-editor-add-fabs></kmap-test-editor-add-fabs>` : ''}
  ` : ''}

  <kmap-instance-popup id="instance-popup"></kmap-instance-popup>
  <kmap-login-popup id="login-popup"></kmap-login-popup>

  ${this._messages.map((message, i) => html`
      <mwc-snackbar id="snackbar" labeltext="${message}" ?open="${i === 0}" style="bottom: 100px"></mwc-snackbar>
  `)}
`;
  }

  _renderDrawer() {
    return html`
      <nav class="drawer-list">
        <a ?selected="${this._page === 'home'}" href="/app/">Startseite</a>
        ${this._roles.includes("teacher") ? html`
          <a ?selected="${this._page === 'test'}" href="/app/test">Test</a>
        ` : ''}
        <a ?selected="${this._page === 'courses'}" ?disabled="${!this._roles.includes("teacher")}" href="/app/courses">Kurse</a>
        <a ?selected="${this._page === 'content-manager'}" ?disabled="${!this._roles.includes("teacher")}" href="/app/content-manager">Content Manager</a>
        <a href="/app/browser/Hilfe/Hilfe">Hilfe</a>
        <a href="/app/browser/Hilfe/Hilfe/Impressum">Impressum</a>
        <pwa-install-button><mwc-button outlined style="--mdc-theme-primary: var(--color-secondary-dark);">App installieren</mwc-button></pwa-install-button>
        <pwa-update-available @pwa-update-available="${this._updateAvailable}"><mwc-button outlined style="--mdc-theme-primary: var(--color-secondary-dark);">App aktualisieren</mwc-button></pwa-update-available>
      </nav>
      <!--googleoff: all-->
      <hr/>
      <nav class="drawer-list">
        <label section>Layer ein-/ausblenden</label>
        <mwc-formfield label="Kurztexte">
          <mwc-switch ?checked="${this._layers.includes('summaries')}" @change="${e => this._switchLayer('summaries', e.target.checked)}"></mwc-switch>
        </mwc-formfield>
        <mwc-formfield label="Selbsteinschätzungen">
          <mwc-switch ?checked="${this._layers.includes('ratings')}" @change="${e => this._switchLayer('ratings', e.target.checked)}"></mwc-switch>
        </mwc-formfield>
        <mwc-formfield label="Pfeile">
          <mwc-switch ?checked="${this._layers.includes('dependencies')}" @change="${e => this._switchLayer('dependencies', e.target.checked)}"></mwc-switch>
        </mwc-formfield>
        ${this._roles.includes("teacher") ? html`
          <mwc-formfield label="Wochenplan">
            <mwc-switch ?checked="${this._layers.includes('timeline')}" @change="${e => this._switchLayer('timeline', e.target.checked)}"></mwc-switch>
          </mwc-formfield>
          ${this._layers.includes('timeline') ? html`<kmap-timeline-selector class="nomargin"></kmap-timeline-selector>` : ''}
          <mwc-formfield label="Mittelwerte">
            <mwc-switch ?checked="${this._layers.includes('averages')}" @change="${e => this._switchLayer('averages', e.target.checked)}"></mwc-switch>
          </mwc-formfield>
          ${this._layers.includes('averages') ? html`<kmap-course-selector class="nomargin"></kmap-course-selector>` : ''}
          <mwc-formfield label="Editor">
            <mwc-switch ?checked="${this._layers.includes('editor')}" @change="${e => this._switchLayer('editor', e.target.checked)}"></mwc-switch>
          </mwc-formfield>
          ${this._layers.includes('editor') ? html`
            ${this._page === 'home' || this._page === 'browser' ? html`<kmap-module-selector class="nomargin"></kmap-module-selector>` : ''}
            ${this._page === 'test' ? html`<kmap-set-selector class="nomargin"></kmap-set-selector>` : ''}
          ` : ''}
        ` : ''}
      </nav>
      <hr/>
      <!--googleon: all-->
      <div class="cc-fb">
        <a class="license" rel="license" href="http://creativecommons.org/licenses/by-sa/4.0/deed.de"><img width="88" height="31" src="icons/cc-by-sa.png" alt="CC BY-SA 4.0"></a>
        <share-facebook></share-facebook>
      </div>
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
