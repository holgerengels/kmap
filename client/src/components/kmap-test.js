import {LitElement, html, css} from 'lit-element';
import {updateTitle, showMessage, updateLocation} from "../actions/app";
import {store} from "../store";
import {fetchSubjectsIfNeeded, fetchChaptersIfNeeded, fetchTreeIfNeeded, fetchChapterIfNeeded} from "../actions/tests";
import {connect} from "pwa-helpers/connect-mixin";
import {storeState} from "../actions/states";

import {colorStyles, fontStyles} from "./kmap-styles";
import '@material/mwc-button';
import '@material/mwc-icon';
import '@material/mwc-icon-button';
import '@material/mwc-formfield';
import '@material/mwc-slider';
import '@material/mwc-top-app-bar';
import './kmap-test-chooser';
import './kmap-test-exercise';
import './kmap-test-results';
import './kmap-test-editor-scroller';

class KmapTest extends connect(store)(LitElement) {
  static get styles() {
    // language=CSS
    return [
      fontStyles,
      colorStyles,
      css`
:host {
  display: contents;
}
div.modules {
  display: flex;
  flex-flow: column;
}
div.buttons {
  padding: 8px 16px;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
}
.page {
  display: block;
  padding: 8px;
  flex: 1 1 auto;
}
kmap-test-editor-scroller {
  flex: 1 1 auto;
}
[hidden] {
    display: none;
}
      `
    ];
  }

  render() {
    // language=HTML
    return html`
      <mwc-top-app-bar id="bar" dense>
        <mwc-icon-button icon="menu" slot="navigationIcon" @click="${e => this._fire('toggleDrawer')}"></mwc-icon-button>
        <div slot="title">${this._title}</div>
        <kmap-login-button slot="actionItems" @lclick="${e => this._fire('login')}"></kmap-login-button>
      </mwc-top-app-bar>

      <div class="modules">
        ${this._page === 'chooser' ? html`<kmap-test-chooser id="chooser" class="page"></kmap-test-chooser>` : ''}
        ${this._page === 'exercise' ? html`<kmap-test-exercise id="exercise" class="page"></kmap-test-exercise>` : ''}
        ${this._page === 'results' ? html`<kmap-test-results id="results" class="page"></kmap-test-results>` : ''}
        <kmap-test-editor-scroller id="editor" ?hidden="${!this._layers.includes('editor')}"></kmap-test-editor-scroller>
      </div>
      <div class="buttons">
        <mwc-button ?hidden="${this._page === 'chooser'}" @click="${this._goChoose}">Aufgabenauswahl</mwc-button>
        <div style="flex: 1 0 auto"></div>
        <mwc-button ?hidden="${this._page === 'results' || this._results.length === 0}" @click="${this._goResults}">Auswertung</mwc-button>
      </div>
    `;
  }

  static get properties() {
    return {
      _userid: {type: String},
      _page: {type: String},
      _layers: {type: Array},
      _title: {type: String},
      _noRoute: {type: String},
      _routeSubject: {type: String},
      _routeChapter: {type: String},
      _routeTopic: {type: String},
      _results: {type: Array},
    };
  }

  constructor() {
    super();
    this._layers = [];
    this._noRoute = "chooser";
    this._page = "chooser";
    this._results = [];
  }

  firstUpdated(changedProperties) {
    store.dispatch(updateTitle("Test"));
  }

  updated(changedProperties) {
    if (changedProperties.has("_noRoute")) {
      if (this._noRoute)
        this._page = this._noRoute;
      else
        this._page = "exercise";
    }

    if (changedProperties.has("_page")) {
      let bar = this.shadowRoot.getElementById('bar');
      let page = this.shadowRoot.getElementById(this._page);
      bar.scrollTarget = page;

      switch (this._page) {
        case 'chooser':
          this._title = "Test - Aufgabenbereich wählen";
          break;
        case 'exercise':
          this._title = "Test - Aufgaben bearbeiten";
          break;
        case 'results':
          this._title = "Test - Auswertung";
          break;
      }
    }
  }

  stateChanged(state) {
    this._layers = state.app.layers;
    this._results = state.tests.results;

    if (state.app.page === 'test') {
      if (state.app.dataPath.length === 0)
        this._noRoute = 'chooser';
      else if (state.app.dataPath.length === 1 && state.app.dataPath[0] === 'results')
        this._noRoute = 'results';
      else
        this._noRoute = null;
    }
  }

  _goChoose(e) {
    store.dispatch(updateLocation(['#test']));
  }

  _goResults(e) {
    store.dispatch(updateLocation(['#test/results']));
  }

  _fire(name) {
    this.dispatchEvent(new CustomEvent(name, {bubbles: true, composed: true}));
  }
}
customElements.define('kmap-test', KmapTest);
