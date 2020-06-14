import {LitElement, html, css, customElement, property} from 'lit-element';
import { connect } from '@captaincodeman/rdx';
import {State, store} from "../store";

import {colorStyles, fontStyles} from "./kmap-styles";

@customElement('kmap-summary-card-averages')
export class KMapSummaryCardAverages extends connect(store, LitElement) {

  @property({type: String})
  private key: string = '';
  @property()
  private _states: object = {};
  @property()
  private _hasStates: boolean = false;
  @property()
  private _averageState: number = 0;
  @property()
  private _averageNum: number = 0;
  @property()
  private _averageOf: number = 0;
  @property()
  private _averagePercent: number = 0;

  mapState(state: State) {
    return {
      _states: state.averages.rates,
    };
  }

  updated(changedProperties) {
    if (changedProperties.has("_states") || changedProperties.has("key")) {
      this._hasStates = this._states && Object.keys(this._states).length !== 0;

      if (this._hasStates) {
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
    }

    this.dispatchEvent(new CustomEvent('statecolor', { bubbles: true, composed: true, detail: {source: 'averages', key: this.key, state: this._averageState} }));
  }

  _getStateValue(key) {
    let value = this._states[key];
    return value !== undefined ? value : 0;
  }

  getState() {
    return this._averageState;
  }

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
}
