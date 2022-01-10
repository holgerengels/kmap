import {html, css} from 'lit';
import {customElement, property, state} from 'lit/decorators.js';
import {Connected} from "./connected";
import {State} from "../store";

import './star-rating';
import { fontStyles, colorStyles } from "./kmap-styles";


@customElement('kmap-summary-card-rating')
export class KMapSummaryCardRating extends Connected {

  @property({type: String})
  private key: string = '';
  @state()
  private _states: object = {};
  @state()
  private _state: number = 0;

  mapState(state: State) {
    return {
      _states: state.rates.rates,
    };
  }

  updated(changedProperties) {
    if (changedProperties.has("_states") || changedProperties.has("key"))
      this._rating();
  }

  _rating() {
    if (this._states && Object.keys(this._states).length !== 0) {
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
    let value = this._states[key];
    return value !== undefined ? value : 0;
  }

  static get styles() {
    // language=CSS
    return [
      fontStyles,
      colorStyles,
      css`
        :host {
          display: flex;
        }
      `
    ];
  }

  render() {
    return html`
      <star-rating .rate="${this._state}" @clicked="${this._rated}"></star-rating>
    `;
  }
}
