import {css, customElement, html, LitElement, property} from 'lit-element';
import {connect, RoutingState} from '@captaincodeman/rdx';
import {State, store} from "../store";

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

@customElement('kmap-test')
export class KmapTest extends connect(store, LitElement) {
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
      let title = this._title;
      let description: string | undefined = undefined;
      let breadcrumbs: string[] | undefined = undefined;
      if (this._subject && this._chapter) {
        if (this._topic) {
          title = "Aufgaben zum Thema " + this._chapter + " - " + this._topic;
          breadcrumbs = [this._subject, this._chapter, this._topic, "tests"];
        }
        else {
          title = "Aufgaben zum Thema " + this._chapter;
          breadcrumbs = [this._subject, this._chapter, "tests"];
        }
        description = "Ermittle Deinen Wissensstand mit Hilfe von interaktiven Aufgaben!";
      }
      store.dispatch.shell.updateMeta({title: title, description: description, breadcrumbs: breadcrumbs});
    }
  }

  _goChoose() {
    store.dispatch.routing.replace('/app/test');
  }

  _goResults() {
    store.dispatch.routing.replace('/app/test/results');
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
      <div class="modules" @end="${this._goResults}">
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
