import {css, html, LitElement, PropertyValues} from 'lit';
import {customElement, property, state, query} from 'lit/decorators.js';
import {installMediaQueryWatcher} from 'pwa-helpers/media-query.js';
import {installOfflineWatcher} from 'pwa-helpers/network.js';
import "web-animations-js/web-animations.min";
import {connect, RoutingState} from '@captaincodeman/rdx'
import {State, store} from './store'

import '@material/mwc-button';
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

import {KmapTermTree} from "kmap-term-tree";
window.customElements.define('kmap-term-tree', KmapTermTree);
import {KmapAsciiMath} from "kmap-ascii-math";
window.customElements.define('kmap-ascii-math', KmapAsciiMath);
import {KmapSolveTree} from "kmap-solve-tree";
window.customElements.define('kmap-solve-tree', KmapSolveTree);
import {KmapJsxGraph} from "kmap-jsxgraph";
window.customElements.define('kmap-jsxgraph', KmapJsxGraph);

// @ts-ignore
//const _standalone = (window.matchMedia('(display-mode: standalone)').matches) || (window.navigator.standalone) || document.referrer.includes('android-app://');

@customElement('kmap-main')
export class KmapMain extends connect(store, LitElement) {
  @state()
  private _page: string = '';
  @state()
  private _currentRoutingStateParams: { [p: string]: any } = {};
  @state()
  private _scrollToTop = false;
  @state()
  private _meta: Meta = {};
  @state()
  private _barTitle: string = '';
  @state()
  private _instance: string = '';
  @property()
  // @ts-ignore
  private _userid: string = '';
  @state()
  private _roles: string[] = [];
  @state()
  private _layers: string[] = [];

  @state()
  private _timelines: Timeline[] = [];

  @state()
  private _selectedTimeline?: Timeline;

  @state()
  private _order: "shuffled" | "increasing difficulty" = "shuffled";

  @state()
  private _drawerOpen: boolean = false;
  @state()
  private _narrow: boolean = false;
  @state()
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

  set route(routingState: RoutingState<string>) {
    if (routingState.page !== this._page) {
      this._page = routingState.page
    }
    if (routingState.page === "browser" && routingState.params !== this._currentRoutingStateParams) {
      this._currentRoutingStateParams = routingState.params;
      this._scrollToTop = true;
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
      _order: state.tests.order,
      _timelines: state.courses.timelines,
      _selectedTimeline: state.courses.selectedTimeline,
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
    installMediaQueryWatcher(`(min-width: 1600px)`, (matches) => store.dispatch.shell.updateWide(matches));
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

  willUpdate(changedProps: PropertyValues) {
    if (changedProps.has('_meta')) {
      console.log(this._meta);

      this._barTitle = this._meta.title || _title.get(this._page) || "KMap";
    }

    if (this._scrollToTop && this._main !== null) {
      this._scrollToTop = false;
      this._main.scrollTo({top: 0, left: 0, behavior: "smooth"})
    }

    if (changedProps.has('_page') && !this._layers.includes('editor'))
      this._drawerOpen = false;
  }

  updated(changedProps) {
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

  _switchLayer(layer, selected) {
    if (!selected && this._layers.includes(layer))
      store.dispatch.shell.removeLayer(layer);
    else if (selected && !this._layers.includes(layer))
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
        padding-top: 8px;
        padding-bottom: 8px;
        border-top: 1px solid rgba(0, 0, 0, 0.12);
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
      mwc-radio {
        margin: -16px -1px;
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
    <span slot="subtitle">[<span>&nbsp;<b>Instanz:</b> ${this._instance}</span><mwc-icon-button aria-haspopup="dialog" icon="polymer" @click="${this._showChooseInstance}" title="Instanz wechseln"></mwc-icon-button>]<br/><br/></span>
    ${this._renderDrawer()}

    <main id="main" slot="appContent" role="main">
      <mwc-top-app-bar id="bar" dense>
        <mwc-icon-button style="color: white" icon="menu" slot="navigationIcon" @click="${() => this._drawerOpen = !this._drawerOpen}"></mwc-icon-button>
        <h1 slot="title">${this._barTitle}</h1>
        <mwc-icon-button-toggle slot="actionItems" @click="${this._toggleTimeline}" ?hidden="${this._timelines.length !== 1 || this._page !== 'browser'}" ?on="${this._selectedTimeline}" title="Wochenplan">${timelineOpen}${timelineClosed}</mwc-icon-button-toggle>
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

      ${this._page === 'test' ? html`
        <nav class="drawer-list">
          <label>Aufgaben Schwierigkeit</label>
          <mwc-formfield label="aufsteigend">
            <mwc-radio name="order" value="increasing difficulty" ?checked="${this._order === "increasing difficulty"}" @change="${() => this._switchOrder('increasing difficulty')}"></mwc-radio>
          </mwc-formfield>
          <mwc-formfield label="zufällig">
            <mwc-radio name="order" value="shuffled" ?checked="${this._order === "shuffled"}" @change="${() => this._switchOrder('shuffled')}"></mwc-radio>
          </mwc-formfield>
        </nav>
        <hr/>
      ` : ''}
      <nav class="drawer-list">
        <label section>Layer ein-/ausblenden</label>
        <mwc-formfield label="Kurztexte">
          <mwc-switch ?selected="${this._layers.includes('summaries')}" @click="${e => this._switchLayer('summaries', e.target.selected)}"></mwc-switch>
        </mwc-formfield>
        <mwc-formfield label="Selbsteinschätzungen">
          <mwc-switch ?selected="${this._layers.includes('ratings')}" @click="${e => this._switchLayer('ratings', e.target.selected)}"></mwc-switch>
        </mwc-formfield>
        <mwc-formfield label="Pfeile">
          <mwc-switch ?selected="${this._layers.includes('dependencies')}" @click="${e => this._switchLayer('dependencies', e.target.selected)}"></mwc-switch>
        </mwc-formfield>
        ${this._roles.includes("teacher") ? html`
          <mwc-formfield label="Wochenplan">
            <mwc-switch ?selected="${this._layers.includes('timeline')}" @click="${e => this._switchLayer('timeline', e.target.selected)}"></mwc-switch>
          </mwc-formfield>
          ${this._layers.includes('timeline') ? html`<kmap-timeline-selector class="nomargin"></kmap-timeline-selector>` : ''}
          <mwc-formfield label="Mittelwerte">
            <mwc-switch ?selected="${this._layers.includes('averages')}" @click="${e => this._switchLayer('averages', e.target.selected)}"></mwc-switch>
          </mwc-formfield>
          ${this._layers.includes('averages') ? html`<kmap-course-selector class="nomargin"></kmap-course-selector>` : ''}
          <mwc-formfield label="Editor">
            <mwc-switch ?selected="${this._layers.includes('editor')}" @click="${e => this._switchLayer('editor', e.target.selected)}"></mwc-switch>
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

  private _switchOrder(order) {
    store.dispatch.tests.setOrder(order);
  }
}

const _title = new Map([
  ['home', "Start"],
  ['browser', "Browser"],
  ['test', "Test"],
  ['courses', "Kurse"],
  ['content-manager', "Content Manager"],
]);
