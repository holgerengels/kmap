import { LitElement, html, css } from 'lit-element';
import { fontStyles, colorStyles } from "./kmap-styles";
import {connect} from "pwa-helpers/connect-mixin";
import {store} from "../store";

class KMapSummaryCardRateColors extends connect(store)(LitElement) {
  static get styles() {
    // language=CSS
    return [
      fontStyles,
      colorStyles,
      css`
      `
    ];
  }

  render() {
    return `<!-- ${this._state} -->`;
  }

  static get properties() {
    return {
      key: {type: String},
      _states: {type: Array},
      _state: {type: String},
    };
  }

  constructor() {
    super();
    this.key = '';
    this._states = [];
    this._state = 0;
  }

  updated(changedProperties) {
    if (changedProperties.has("_states") || changedProperties.has("key"))
      this._rating(this._states);
  }

  stateChanged(state) {
    this._states = state.states;
  }

  _rating() {
    if (this._states && this._states.state && this._states.state.length !== 0) {
      this._state = this._getStateValue(this.key);
    }
    else {
      this._state = 0;
    }

    this.dispatchEvent(new CustomEvent('statecolor', { bubbles: true, composed: true, detail: {layer: 'user', key: this.key, state: this._state} }));
  }

  _getStateValue(key) {
    let value = this._states.state[key];
    return value !== undefined ? value : 0;
  }

  getState() {
    return this._state;
  }
}

window.customElements.define('kmap-summary-card-ratecolors', KMapSummaryCardRateColors);
