import {LitElement, html, css, customElement, property} from 'lit-element';
import { connect } from '@captaincodeman/rdx';
import {State, store} from "../store";
import {styleMap} from 'lit-html/directives/style-map.js';

import './star-rating';
import { fontStyles, colorStyles } from "./kmap-styles";


@customElement('kmap-summary-card-rating')
class KMapSummaryCardRating extends connect(store, LitElement) {

  @property()
  private key: string = '';
  @property()
  private _states: object = {};
  @property()
  private _state: number = 0;
  @property()
  private _colorStyles: object = { "--color-rated":  "--color-darkgray", "--color-unrated": "--color-lightgray" };

  mapState(state: State) {
    return {
      _states: state.rates.rates,
    };
  }

  static get properties() {
    return {
      lightest: {type: String},
      opaque: {type: String},
      _colorStyles: {type: Object},
    };
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
  }

  _rated(e) {
    this.dispatchEvent(new CustomEvent('rated', {bubbles: true, composed: true, detail: {key: this.key, rate: e.detail.rate}}));
  }

  _getStateValue(key) {
    let value = this._states.state[key];
    return value !== undefined ? value : 0;
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
      `
    ];
  }

  render() {
    return html`
      <star-rating .rate="${this._state}" @clicked="${this._rated}" style=${styleMap(this._colorStyles)}></star-rating>
    `;
  }
}
