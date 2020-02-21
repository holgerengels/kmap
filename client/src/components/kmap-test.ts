import {css, customElement, html, LitElement, property, query} from 'lit-element';
import {connect} from '@captaincodeman/rdx';
import {State, store} from "../store";
import {RoutingState} from "@captaincodeman/rdx-model";

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
import {colorStyles, fontStyles} from "./kmap-styles";
import {TopAppBar} from "@material/mwc-top-app-bar/mwc-top-app-bar";

@customElement('kmap-test')
class KmapTest extends connect(store, LitElement) {
  @property()
  private _page: string = 'chooser';
  @property()
  private _layers: string[] = [];
  @property()
  private _title: string = 'Test - Aufgabenbereich wählen';
  @property()
  private _noRoute?: string = 'chooser';
  @property()
  private _subject: string = '';
  @property()
  private _chapter: string = '';
  @property()
  private _topic: string = '';
  @property()
  private _results: string[] = [];

  @query('#bar')
  private _bar: TopAppBar;

  set route(val: RoutingState) {
    if (val.page === "test") {
      if (val.params.results)
        this._noRoute = 'results';
      else if (!val.params.subject)
        this._noRoute = 'chooser';
      else {
        this._noRoute = undefined;
        this._subject = val.params.subject;
        this._chapter = val.params.chapter ? decodeURIComponent(val.params.chapter) : '';
        this._topic = val.params.topic ? decodeURIComponent(val.params.topic) : '';
      }
    }
  }

  mapState(state: State) {
    return {
      route: state.routing,
      _layers: state.shell.layers,
      _results: state.tests.results,
    };
  }

  updated(changedProperties) {
    if (changedProperties.has("_noRoute")) {
      if (this._noRoute)
        this._page = this._noRoute;
      else
        this._page = "exercise";
    }

    if (changedProperties.has("_page")) {
      // @ts-ignore
      this._bar.scrollTarget = this.shadowRoot.getElementById(this._page);

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

  _goChoose() {
    store.dispatch.routing.replace('/app/test');
  }

  _goResults() {
    store.dispatch.routing.replace('/app/test/results');
  }

  _fire(name) {
    this.dispatchEvent(new CustomEvent(name, {bubbles: true, composed: true}));
  }

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
          max-width: 800px;
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
      `];
  }

  render() {
    // language=HTML
    return html`
      <mwc-top-app-bar id="bar" dense>
        <mwc-icon-button icon="menu" slot="navigationIcon" @click="${() => this._fire('toggleDrawer')}"></mwc-icon-button>
        <div slot="title">${this._title}</div>
        <kmap-login-button slot="actionItems" @lclick="${() => this._fire('login')}"></kmap-login-button>
      </mwc-top-app-bar>

      <div class="modules">
        ${!this._layers.includes('editor') ? html`
            ${this._page === 'chooser' ? html`<kmap-test-chooser id="chooser" class="page"></kmap-test-chooser>` : ''}
            ${this._page === 'exercise' ? html`<kmap-test-exercise id="exercise" class="page"></kmap-test-exercise>` : ''}
            ${this._page === 'results' ? html`<kmap-test-results id="results" class="page"></kmap-test-results>` : ''}
        `: html`
          <kmap-test-editor-scroller id="editor" ?hidden="${!this._layers.includes('editor')}"></kmap-test-editor-scroller>
        `}
      </div>
      <div class="buttons">
        <mwc-button ?hidden="${this._page === 'chooser'}" @click="${this._goChoose}">Aufgabenauswahl</mwc-button>
        <div style="flex: 1 0 auto"></div>
        <mwc-button ?hidden="${this._page === 'results' || this._results.length === 0}" @click="${this._goResults}">Auswertung</mwc-button>
      </div>
    `;
  }
}
