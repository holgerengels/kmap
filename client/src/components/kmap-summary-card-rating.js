import { LitElement, html, css } from 'lit-element';
import {connect} from "pwa-helpers/connect-mixin";
import { colorStyles, fontStyles } from "./kmap-styles";
import {store} from "../store";

class KMapSummaryCardRating extends connect(store)(LitElement) {
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
    return html`
      <star-rating .rate="${this._state}" @clicked="${this._rated}" .color_unrated="${this.lightest}" .color_rated="${this.opaque}"></star-rating>
    `;
  }

  static get properties() {
    return {
      key: {type: String},
      _states: {type: Array},
      _state: {type: String},
      lightest: {type: String},
      opaque: {type: String},
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

  _rated(e) {
    this.dispatchEvent(new CustomEvent('rated', {bubbles: true, composed: true, detail: {key: this.key, rate: e.detail.rate}}));
  }

  _getStateValue(key) {
    let value = this._states.state[key];
    return value !== undefined ? value : 0;
  }

  getState() {
    return this._state;
  }
}

window.customElements.define('kmap-summary-card-rating', KMapSummaryCardRating);
