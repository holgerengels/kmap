import { LitElement, html, css } from 'lit-element';
import {connect} from "pwa-helpers/connect-mixin";
import { colorStyles, fontStyles } from "./kmap-styles";
import {store} from "../store";

class KMapSummaryCardAverages extends connect(store)(LitElement) {
  static get styles() {
    // language=CSS
    return [
      fontStyles,
      colorStyles,
      css`
.content {
  padding: 8px;
  background-color: var(--color-lightest);
  transition: background-color .5s ease-in-out;
}
.content span {
  white-space: normal;
  hyphens: auto;
  overflow : hidden;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
}
      `
    ];
  }

  render() {
    return html`
      <div class="content">
        <b>Selbsteinschätzungen</b><br>
        Abgegebene: ${this._averageNum} / ${this._averageOf} ≙ ${this._averagePercent} %<br>
        Mittelwert: ${this._averageState}
      </div>
    `;
  }

  static get properties() {
    return {
      key: {type: String},
      _states: {type: Array},
      _averageState: {type: String},
      _averageNum: {type: String},
      _averageOf: {type: String},
      _averagePercent: {type: String},
    };
  }

  constructor() {
    super();
    this.key = '';
    this._states = [];
    this._averageState = 0;
    this._averageNum = 0;
    this._averageOf = 0;
    this._averagePercent = 0;
  }

  updated(changedProperties) {
    if (changedProperties.has("_states") || changedProperties.has("key"))
      this._rating(store.getState().states);
  }

  stateChanged(state) {
    this._states = state.averageStates;
    this._rating();
  }

  _rating() {
    if (this._states && this._states.state) {
      this._averageState = this._getStateValue(this.key);
      this._averageNum = this._getStateValue(this.key + "*");
      this._averageOf = this._getStateValue(this.key + "#") * this._getStateValue(this.key + "@");
      this._averagePercent = Math.round(100 * this._averageNum / this._averageOf);
    }
    else {
      this._averageState = 0;
      this._averageNum = 0;
      this._averageOf = 0;
      this._averagePercent = 0;
    }

    this.dispatchEvent(new CustomEvent('statecolor', { bubbles: true, detail: {layer: 'averages', key: this.key, state: this._averageState} }));
  }

  _getStateValue(key) {
    let value = this._states.state[key];
    return value !== undefined ? value : 0;
  }
}

window.customElements.define('kmap-summary-card-averages', KMapSummaryCardAverages);
