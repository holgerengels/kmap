import {LitElement, html, css} from 'lit-element';
import {connect} from "pwa-helpers/connect-mixin";
import {store} from "../store";
import {selectSummaryCard} from '../actions/maps.js';
import {STATE_COLORS} from './state-colors';
import {fontStyles, colorStyles} from "./kmap-styles";

import '@material/mwc-icon';
import '@material/mwc-ripple';
import './kmap-summary-card-summary';
import './kmap-summary-card-averages';
import './kmap-summary-card-editor';
import './kmap-summary-card-rating';
import './kmap-summary-card-ratecolors';

class KMapSummaryCard extends connect(store)(LitElement) {

  static get styles() {
    // language=CSS
    return [
      fontStyles,
      colorStyles,
      css`
:host {
    display: block;
    --color-opaque: #f5f5f5;
    --color-light: var(--color-mediumgray);
    --color-lightest: #e0e0e0;
}
:host div.card {
  transition: opacity .1s ease-in-out;
  opacity: 1.0;
}
:host([faded]) div.card {
  opacity: 0.0;
}
div.card {
  vertical-align: top;
  margin: 6px;
  margin-top: 0px;
  display: inline-block;
  box-sizing: border-box;
  width: 300px;
  border-radius: 4px;
  box-shadow: 0 2px 2px 0 rgba(0, 0, 0, 0.14),
      0 1px 5px 0 rgba(0, 0, 0, 0.12),
      0 4px 1px -2px rgba(0, 0, 0, 0.2);
  color: var(--color-darkgray);
}
div.card[selected] {
    filter: saturate(1.3) brightness(1.1);
    box-shadow: 0 4px 5px 0 rgba(0, 0, 0, 0.14),
    0 1px 10px 0 rgba(0, 0, 0, 0.12),
    0 2px 4px -1px rgba(0, 0, 0, 0.4);
}
div.card[highlighted] {
    filter: saturate(1.3) brightness(1.1);
}

.card-header {
  padding: 8px;
  color: black;
  background-color: var(--color-opaque);
  border-top-left-radius: 4px;
  border-top-right-radius: 4px;
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
      `];
  }

  render() {
    return html`
<div class="card" @click="${this._clicked}" ?selected="${this.selected}" ?highlighted="${this.highlighted}">
  <div class="card-header font-body">
    <span>${this.card.topic}</span>
  </div>
  ${this._layers.includes('summaries')
      ? html`
      <kmap-summary-card-summary .key="${this._key}" .summary="${this.card.summary}" @statecolor="${this._colorizeEvent}"></kmap-summary-card-summary>
    ` : ''
      }
  ${this._layers.includes('averages')
      ? html`
      <kmap-summary-card-averages id="averages" .key="${this._key}" @statecolor="${this._colorizeEvent}"></kmap-summary-card-summary>
    ` : ''
      }
  ${this._layers.includes('editor')
      ? html`
      <kmap-summary-card-editor id="editor" .key="${this._key}" .card="${this.card}" @statecolor="${this._colorizeEvent}"></kmap-summary-card-editor>
    ` : ''
      }
  ${!this._layers.includes('averages') ? html`
      <kmap-summary-card-ratecolors id="rating" .key="${this._key}" @statecolor="${this._colorizeEvent}"></kmap-summary-card-ratecolors>
  ` : ''}
  <div class="card-footer font-body">
      ${this.card.links
      ? html`<a slot="footer" href="#browser/${this.subject}/${this.card.links}"><mwc-ripple></mwc-ripple><mwc-icon>open_in_new</mwc-icon></a>`
      : html`
        ${!this._layers.includes('averages') ? html`
          <kmap-summary-card-rating .key="${this._key}" .lightest="${this._lightest}" .opaque="${this._opaque}"></kmap-summary-card-rating>
        ` : '' }
      `}
                      
      <div slot="footer" style="flex: 1 0 auto"></div>
      <a slot="footer" href="#browser/${this.subject}/${this.chapter}/${this.card.topic}"><mwc-ripple></mwc-ripple><mwc-icon>fullscreen</mwc-icon></a>
  </div>
    <mwc-ripple id="ripple"></mwc-ripple>
    </div>
    `;
  }

  static get properties() {
    return {
      _userid: {type: String},
      subject: {type: String},
      chapter: {type: String},
      card: {type: Object},
      _key: {type: String},
      selected: {type: Boolean, reflect: true},
      highlighted: {type: Boolean, reflect: true},
      _opaque: {type: String},
      _light: {type: String},
      _lightest: {type: String},
      _layers: {type: Array},
    };
  }

  constructor() {
    super();
    this.subject = '';
    this.chapter = '';
    this.card = {};
    this._layers = [];
    this._colorize(0);
  }

  _colorizeEvent(e) {
    let source;
    if (this._layers.includes("averages")) {
      source = this.shadowRoot.getElementById('averages');
    }
    else if (this._layers.includes("editor")) {
      source = this.shadowRoot.getElementById('editor');
    }
    else if (this._userid) {
      source = this.shadowRoot.getElementById('rating');
    }

    this._colorize(source ? source.getState() : 0);
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

  stateChanged(state) {
    this._userid = state.app.userid;
    this.highlighted = state.maps.selectedCardDependencies && state.maps.selectedCardDependencies.includes(this.card.topic);
    this.selected = state.maps.selectedCardName === this.card.topic;
    this._layers = state.app.layers;
  }

  updated(changedProperties) {
    if (changedProperties.has("card"))
      this._key = this.card.links ? this.card.links : this.chapter + "." + this.card.topic;
    if (changedProperties.has("_userid") || changedProperties.has("_layers") || changedProperties.has("_key"))
      this._colorizeEvent({ lala: "lala"} );
  }
}

window.customElements.define('kmap-summary-card', KMapSummaryCard);
