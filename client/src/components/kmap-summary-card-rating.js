import { LitElement, html, css } from 'lit-element';
import {styleMap} from 'lit-html/directives/style-map.js';
import { fontStyles, colorStyles } from "./kmap-styles";
import {connect} from "pwa-helpers/connect-mixin";
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
      <star-rating .rate="${this._state}" @clicked="${this._rated}" style=${styleMap(this._colorStyles)}></star-rating>
    `;
  }

  static get properties() {
    return {
      key: {type: String},
      _states: {type: Array},
      _state: {type: String},
      lightest: {type: String},
      opaque: {type: String},
      _colorStyles: {type: Object},
    };
  }

  constructor() {
    super();
    this.key = '';
    this._states = [];
    this._state = 0;
    this._colorStyles = { "--color-rated":  "--color-darkgray", "--color-unrated": "--color-lightgray" };
  }

  updated(changedProperties) {
    if (changedProperties.has("_states") || changedProperties.has("key"))
      this._rating(this._states);
    if (changedProperties.has("lightest") || changedProperties.has("opaque"))
      this._colorStyles = { "--color-rated":  this.opaque, "--color-unrated": this.lightest };
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
