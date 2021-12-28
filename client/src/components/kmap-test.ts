import {css, customElement, html, property} from 'lit-element';
import {Connected} from "./connected";
import {RoutingState} from '@captaincodeman/rdx';
import {State, store} from "../store";

import '@material/mwc-button';
import './kmap-test-chooser';
import './kmap-test-exercise';
import './kmap-test-results';
import './kmap-test-editor-scroller';
import {colorStyles, fontStyles} from "./kmap-styles";

@customElement('kmap-test')
export class KmapTest extends Connected {
  @property()
  private _page: string = 'chooser';
  @property()
  private _order: "shuffled" | "increasing difficulty" = "shuffled";
  @property()
  private _layers: string[] = [];
  @property()
  private _noRoute?: string = 'chooser';
  @property()
  private _results: string[] = [];

  set route(val: RoutingState<string>) {
    if (val.page === "test") {
      if (val.params.results)
        this._noRoute = 'results';
      else if (!val.params.subject)
        this._noRoute = 'chooser';
      else {
        this._noRoute = undefined;
      }
    }
  }

  mapState(state: State) {
    return {
      route: state.routing,
      _layers: state.shell.layers,
      _order: state.tests.order,
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
  }

  _goChoose() {
    store.dispatch.routing.replace('/app/test');
  }

  _goBack() {
    store.dispatch.routing.back();
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
        div.settings {
          display: flex;
          align-items: center;
          padding: 8px 16px 0px 16px;
          margin-bottom: -8px;
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
          display: flex;
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
      ${this._page === 'exercise' ? html`
        <div class="settings">
          <label>Schwierigkeit</label>
          <mwc-formfield label="aufsteigend">
            <mwc-radio name="order" value="increasing difficulty" ?checked="${this._order === "increasing difficulty"}" @change="${() => this._switchOrder('increasing difficulty')}"></mwc-radio>
          </mwc-formfield>
          <mwc-formfield label="zufällig">
            <mwc-radio name="order" value="shuffled" ?checked="${this._order === "shuffled"}" @change="${() => this._switchOrder('shuffled')}"></mwc-radio>
          </mwc-formfield>
        </div>
      ` : ''}
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
        <mwc-button ?hidden="${this._page !== 'exercise'}" @click="${this._goBack}">Zurück</mwc-button>
        <div style="flex: 1 0 auto"></div>
        <mwc-button ?hidden="${this._page === 'results' || this._results.length === 0}" @click="${this._goResults}">Auswertung</mwc-button>
      </div>
    `;
  }

  private _switchOrder(order) {
    store.dispatch.tests.setOrder(order);
  }
}
