import { LitElement, html, css } from 'lit-element';
import {styleMap} from 'lit-html/directives/style-map.js';
import { fontStyles, colorStyles } from "./kmap-styles";
import { STATE_COLORS } from './state-colors';
import { connect } from '@captaincodeman/rdx';
import {store} from "../store";
import {selectSummaryCard} from '../actions/maps.js';
import '@material/mwc-icon';
import 'mega-material/list';
import './star-rating';

class KMapTestResultCard extends connect(store, LitElement) {

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
            <a slot="footer" href="/:app/browser/${this.card.subject}/${this.card.chapter}/${this.card.topic}"><mwc-icon>open_in_new</mwc-icon></a>
        </div>
    `;
  }

  static get properties() {
    return {
      subject: {type: String},
      chapter: {type: String},
      card: {type: Object},
      state: {type: Number},
      _states: {type: Array},
      _state: {type: Number},
      progressNum: {type: Number},
      progressOf: {type: Number},
      _selected: {type: Boolean},
      _highlighted: {type: Boolean},
      _opaque: {type: String},
      _light: {type: String},
      _lightest: {type: String},
      _rateModified: {type: Boolean},
      _colorStyles: {type: Object},
    };
  }

  constructor() {
    super();
    this._states = [];
    this._state = 0;
    this.state = 0;
    this._rateModified = false;
    this._colorStyles = { "--color-rated":  "--color-darkgray", "--color-unrated": "--color-lightgray" };
    this._colorize("0");
  }

  updated(changedProperties) {
    if (changedProperties.has("_states"))
      this._rating(this._states);

    if (changedProperties.has("state"))
      this._state = this.state;

    if (changedProperties.has("_state"))
      this._colorize(this._state);
  }

  stateChanged(state) {
    this._states = state.states;
  }

  _rating() {
    if (this._rateModified && this._states && this._states.state && this._states.state.length !== 0) {
      let key = this.chapter + "." + this.card.topic;
      this._state = this._getStateValue(key);
    }
    else {
      this._state = 0;
    }
  }

  _getStateValue(key) {
    let value = this._states.state[key];
    return value !== undefined ? value : 0;
  }

  _colorize(state) {
    this._opaque = STATE_COLORS[state][0];
    this._light = STATE_COLORS[state][1];
    this._lightest = STATE_COLORS[state][2];
    this.style.setProperty('--color-opaque', this._opaque);
    this.style.setProperty('--color-light', this._light);
    this.style.setProperty('--color-lightest', this._lightest);
    this._colorStyles = { "--color-rated":  this._opaque, "--color-unrated": this._lightest };
  }

  _rated(e) {
    this._rateModified = true;
    let key = this.chapter + "." + this.card.topic;
    this.dispatchEvent(new CustomEvent('rated', { bubbles: true, composed: true, detail: {key: key, rate: e.detail.rate}}));
  }
}

window.customElements.define('kmap-test-result-card', KMapTestResultCard);
