import {LitElement, html, css} from 'lit-element';
import {connect} from "pwa-helpers/connect-mixin";
import {store} from "../store";
import {selectSummaryCard} from '../actions/maps.js';
import {STATE_COLORS} from './state-colors';
import './star-rating';
import './kmap-summary-card-summary';
import './kmap-summary-card-averages';
import './kmap-summary-card-editor';
import 'mega-material/icon';
import {fontStyles, colorStyles} from "./kmap-styles";

class KMapSummaryCard extends connect(store)(LitElement) {

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
}
.card {
  display: inline-block;
  box-sizing: border-box;
  overflow: overlay;
  width: 300px;
  border-radius: 3px;
  box-shadow: 0 2px 2px 0 rgba(0, 0, 0, 0.14),
      0 1px 5px 0 rgba(0, 0, 0, 0.12),
      0 3px 1px -2px rgba(0, 0, 0, 0.2);
  color: var(--color-darkgray);
}
.card-header {
  padding: 8px;
  color: black;
  background-color: var(--color-opaque);
}
.card-footer {
  color: var(--color-darkgray);
  background-color: var(--color-light);
  transition: background-color .5s ease-in-out;
  padding: 8px;
  font-size: 0px;
  line-height: 0px;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
}
.card-footer a {
  color: var(--color-darkgray);
}
.card[selected] {
  filter: saturate(1.2) brightness(1.1);
  box-shadow: 0 4px 5px 0 rgba(0, 0, 0, 0.14),
      0 1px 10px 0 rgba(0, 0, 0, 0.12),
      0 2px 4px -1px rgba(0, 0, 0, 0.4);
}
.card[highlighted] {
  filter: saturate(1.2) brightness(1.1);
}
      `];
  }

  render() {
    return html`
<div class="card font-body" ?selected="${this._selected}" ?highlighted="${this._highlighted}">
  <div class="card-header" @click="${this._clicked}">
      <span>${this.card.name}</span>
  </div>
  ${this._layers.includes('summaries')
      ? html`
      <kmap-summary-card-summary @click="${this._clicked}" @statecolor="${this._colorizeEvent}" .key="${this._key}" .summary="${this.card.summary}"></kmap-summary-card-summary>
    ` : ''
      }
  ${this._layers.includes('averages')
      ? html`
      <kmap-summary-card-averages @click="${this._clicked}" @statecolor="${this._colorizeEvent}" .key="${this._key}"></kmap-summary-card-summary>
    ` : ''
      }
  ${this._layers.includes('editor')
      ? html`
      <kmap-summary-card-editor @click="${this._clicked}" .key="${this._key}" .card="${this.card}" ></kmap-summary-card-editor>
    ` : ''
      }
  <div class="card-footer">
      ${this.card.links
      ? html`<a slot="footer" href="#browser/${this.subject}/${this.card.links}"><mwc-icon>open_in_new</mwc-icon></a>`
      : html`<star-rating .rate="${this.state}" @rated="${this._rated}" .color_unrated="${this._lightest}" .color_rated="${this._opaque}"></star-rating>`
      }
                      
      <div slot="footer" style="flex: 1 0 auto"></div>
      <a slot="footer" href="#browser/${this.subject}/${this.chapter}/${this.card.name}"><mwc-icon>fullscreen</mwc-icon></a>
  </div>
</div>
    `;
  }

  static get properties() {
    return {
      subject: {type: String},
      chapter: {type: String},
      card: {type: Object},
      _key: {type: String},
      state: {type: Number},
      progressNum: {type: Number},
      progressOf: {type: Number},
      _selected: {type: Boolean},
      _highlighted: {type: Boolean},
      _opaque: {type: String},
      _light: {type: String},
      _lightest: {type: String},
      _layers: {type: Array},
      _stateLayer: {type: String},
    };
  }

  constructor() {
    super();
    this.subject = '';
    this.chapter = '';
    this.card = {};
    this.state = 0;
    this._layers = [];
    this._stateLayer = '';
    this._colorize(0);
  }

  _colorizeEvent(e) {
    let detail = e.detail;
    this._stateLayer = detail.layer;
    this._colorize(detail.state);
  }

  _colorize(state) {
    this._opaque = STATE_COLORS[state][0];
    this._light = STATE_COLORS[state][1];
    this._lightest = STATE_COLORS[state][2];
    this.style.setProperty('--color-opaque', this._opaque);
    this.style.setProperty('--color-light', this._light);
    this.style.setProperty('--color-lightest', this._lightest);
  }

  _clicked() {
    store.dispatch(selectSummaryCard(this.card));
  }

  _rated(e) {
    this.dispatchEvent(new CustomEvent('rated', {bubbles: true, detail: {key: this._key, rate: e.detail.rate}}));
  }

  stateChanged(state) {
    this._highlighted = state.maps.selectedCardDependencies && state.maps.selectedCardDependencies.includes(this.card.name);
    this._selected = state.maps.selectedCardName === this.card.name;
    this._layers = state.app.layers;
  }

  updated(changedProperties) {
    if (changedProperties.has("card"))
      this._key = this.card.links ? this.card.links : this.chapter + "." + this.card.name;
    if (changedProperties.has("_layers"))
      if (!this._layers.includes(this._stateLayer))
        this._colorize(0);
  }
}

window.customElements.define('kmap-summary-card', KMapSummaryCard);
