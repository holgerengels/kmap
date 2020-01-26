import {LitElement, html, css, customElement, property} from 'lit-element';
import { connect } from '@captaincodeman/rdx';
import {State, store} from "../store";


import {styleMap} from 'lit-html/directives/style-map.js';
import { STATE_COLORS } from './state-colors';
import '@material/mwc-icon';
import './star-rating';
import {colorStyles, fontStyles} from "./kmap-styles";

@customElement('kmap-test-result-card')
export class KMapTestResultCard extends connect(store, LitElement) {
  @property()
  private _userid: string = '';

  @property()
  private card?: object = undefined;
  @property()
  private _states: object = {};
  @property({type: Number})
  private state: number = 0;
  @property()
  private _state: number = 0;

  @property()
  private _colorStyles: object = { "--color-rated":  "--color-darkgray", "--color-unrated": "--color-lightgray" };

  constructor() {
    super();
    this._colorize("0");
  }

  mapState(state: State) {
    return {
      _userid: state.app.userid,
      _states: state.rates.rates,
    };
  }

  updated(changedProperties) {
    if (changedProperties.has("_states"))
      this._rating();

    if (changedProperties.has("state"))
      this._state = this.state;

    if (changedProperties.has("_state"))
      this._colorize(this._state);
  }

  _rating() {
    if (this._rateModified && this._states && Object.keys(this._states).length !== 0) {
      let key = this.card.chapter + "." + this.card.topic;
      this._state = this._getStateValue(key);
    }
    else {
      this._state = 0;
    }
  }

  _getStateValue(key) {
    let value = this._states[key];
    return value !== undefined ? value : 0;
  }

  _colorize(rate) {
    let _opaque = STATE_COLORS[rate][0];
    let _light = STATE_COLORS[rate][1];
    let _lightest = STATE_COLORS[rate][2];
    this.style.setProperty('--color-opaque', _opaque);
    this.style.setProperty('--color-light', _light);
    this.style.setProperty('--color-lightest', _lightest);
    this._colorStyles = { "--color-rated":  _opaque, "--color-unrated": _lightest };
  }

  _rated(e) {
    if (this._userid)
      this._rateModified = true;

    let key = this.card.chapter + "." + this.card.topic;
    this.dispatchEvent(new CustomEvent('rated', { bubbles: true, composed: true, detail: {subject: this.card.subject, key: key, rate: e.detail.rate}}));
  }

  static get styles() {
    // language=CSS
    return [
      fontStyles,
      colorStyles,
      css`
        :host {
          --color-opaque: #f5f5f5;
          --color-light: #e0e0e0;
          --color-lightest: #9e9e9e;

          display: inline-block;
          box-sizing: border-box;
          width: 300px;
          border-radius: 4px;
          box-shadow: 0 2px 2px 0 rgba(0, 0, 0, 0.14),
          0 1px 5px 0 rgba(0, 0, 0, 0.12),
          0 3px 1px -2px rgba(0, 0, 0, 0.2);
          color: var(--color-darkgray);
        }
        .card-header {
          padding: 8px 12px;
          color: black;
          background-color: var(--color-opaque);
          border-top-left-radius: 4px;
          border-top-right-radius: 4px;
        }
        .card-content {
          padding: 8px;
          background-color: var(--color-lightest);
          transition: background-color .5s ease-in-out;
        }
        .card-footer {
          color: var(--color-darkgray);
          background-color: var(--color-light);
          transition: background-color .5s ease-in-out;
          padding: 4px 8px;
          font-size: 0px;
          line-height: 0px;
          display: flex;
          flex-direction: row;
          justify-content: space-between;
          border-bottom-left-radius: 4px;
          border-bottom-right-radius: 4px;
        }
        .card-footer a {
          color: var(--color-darkgray);
        }
        .card-content mwc-icon {
          vertical-align: bottom;
          padding-left: 16px;
          padding-right: 16px;
        }
        .correct {
          color: var(--color-green);
        }
        .wrong {
          color: var(--color-red);
        }
      `];
  }

  render() {
    return html`
        <div class="card-header">
          <span>${this.card.chapter} → ${this.card.topic}</span>
        </div>
        <div class="card-content">
            <mwc-icon class="correct">thumb_up</mwc-icon> ${this.card.correct} richtig<br/><br/>
            <mwc-icon class="wrong">thumb_down</mwc-icon> ${this.card.wrong} falsch<br/>
        </div>
        <div class="card-footer">
            <star-rating .rate="${this._state}" @clicked="${this._rated}" style=${styleMap(this._colorStyles)}></star-rating>
            <div slot="footer" style="flex: 1 0 auto"></div>
            <a slot="footer" href="/app/browser/${this.card.subject}/${this.card.chapter}/${this.card.topic}"><mwc-icon>open_in_new</mwc-icon></a>
        </div>
    `;
  }
}
