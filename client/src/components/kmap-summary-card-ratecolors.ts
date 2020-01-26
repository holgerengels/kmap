import {LitElement, html, customElement, property} from 'lit-element';
import { connect } from '@captaincodeman/rdx';
import {State, store} from "../store";

@customElement('kmap-summary-card-ratecolors')
export class KMapSummaryCardRateColors extends connect(store, LitElement) {

  @property({type: String})
  private key: string = '';
  @property()
  private _states: object = {};
  @property()
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

    this.dispatchEvent(new CustomEvent('statecolor', { bubbles: true, composed: true, detail: {layer: 'user', key: this.key, state: this._state} }));
  }

  _getStateValue(key) {
    let value = this._states[key];
    return value !== undefined ? value : 0;
  }

  getState() {
    return this._state;
  }

  render() {
    return html`<span style="display: none">${this._state}</span>`;
  }
}
