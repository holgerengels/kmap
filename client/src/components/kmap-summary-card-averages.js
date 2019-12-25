import { LitElement, html, css } from 'lit-element';
import { connect } from '@captaincodeman/rdx';
import { colorStyles, fontStyles } from "./kmap-styles";
import {store} from "../store";

class KMapSummaryCardAverages extends connect(store, LitElement) {
  static get styles() {
    // language=CSS
    return [
      fontStyles,
      colorStyles,
      css`
:host {
  display: block;
  padding: 8px;
  background-color: var(--color-lightest);
  transition: background-color .5s ease-in-out;
}
      `
    ];
  }

  render() {
    return html`
      <span>
        <b>Selbsteinschätzungen</b><br>
        ${this._hasStates ? html`
        Abgegebene: ${this._averageNum} / ${this._averageOf} ≙ ${this._averagePercent} %<br>
        Mittelwert: ${this._averageState}
        ` : html`...`}
      </span>
    `;
  }

  static get properties() {
    return {
      key: {type: String},
      _states: {type: Array},
      _hasStates: {type: Boolean},
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
    this._hasStates = false;
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
    this._hasStates = this._states && this._states.state.length !== 0;
    this._rating();
  }

  _rating() {
    if (this._states && this._states.state) {
      this._averageState = this._getStateValue(this.key);
      this._averageNum = this._getStateValue(this.key + "*");
      let count = this._getStateValue("@");
      let of = this._getStateValue(this.key + "#");
      this._averageOf = (of !== 0 ? of : 1) * (count !== 0 ? count : 1);
      this._averagePercent = Math.round(100 * this._averageNum / this._averageOf);
    }
    else {
      this._averageState = 0;
      this._averageNum = 0;
      this._averageOf = 0;
      this._averagePercent = 0;
    }

    this.dispatchEvent(new CustomEvent('statecolor', { bubbles: true, composed: true, detail: {source: 'averages', key: this.key, state: this._averageState} }));
  }

  _getStateValue(key) {
    let value = this._states.state[key];
    return value !== undefined ? value : 0;
  }

  getState() {
    return this._averageState;
  }
}

window.customElements.define('kmap-summary-card-averages', KMapSummaryCardAverages);
