import {LitElement, html, css} from 'lit-element';
import {connect} from "pwa-helpers/connect-mixin";
import {store} from "../store";
import { selectSummaryCard } from '../actions/maps.js';
import { STATE_COLORS } from './state-colors';
import './star-rating';
import 'mega-material/icon';
import 'mega-material/list';
import {colorStyles, fontStyles} from "./kmap-styles";

class KMapTestResultCard extends connect(store)(LitElement) {

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
  color: #212121;
  font-family: Roboto,sans-serif;
  -webkit-font-smoothing: antialiased;
  font-size: 0.95rem;
  font-weight: 400;
}
.card-header {
  padding: 8px;
  color: black;
  background-color: var(--color-opaque);
}
.card-content {
  padding: 8px;
  background-color: var(--color-lightest);
  transition: background-color .5s ease-in-out;
}
.card-content span {
  white-space: normal;
  hyphens: auto;
  overflow : hidden;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
}
.card-content img {
  max-width: calc(100vw - 44px);
}
.card-footer {
  color: #212121;
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
  color: black;
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
    <div class="card" ?selected="${this._selected}" ?highlighted="${this._highlighted}">
            <div class="card-header" @click="${this._clicked}">
                <span>${this.card.chapter} → ${this.card.topic}</span>
            </div>
            <div class="card-content">
                <mwc-icon class="correct">thumb_up</mwc-icon> ${this.card.correct} richtig<br/><br/>
                <mwc-icon class="wrong">thumb_down</mwc-icon> ${this.card.wrong} falsch<br/>
            </div>
            <div class="card-footer">
                <star-rating .rate="${this.state}" @rated="${this._rated}" .color_unrated="${this._lightest}" .color_rated="${this._opaque}"></star-rating>
                <div slot="footer" style="flex: 1 0 auto"></div>
                <a slot="footer" href="#browser/${this.card.subject}/${this.card.chapter}/${this.card.topic}"><mwc-icon>open_in_new</mwc-icon></a>
            </div>
</div>
    `;
    }

    static get properties() {
        return {
            subject: {type: String},
            chapter: {type: String},
            card: {type: Object},
            state: {type: Number, value: 0},
            progressNum: {type: Number},
            progressOf: {type: Number},
            _selected: {type: Boolean},
            _highlighted: {type: Boolean},
            _opaque: {type: String},
            _light: {type: String},
            _lightest: {type: String},
        };
    }

    constructor() {
        super();
        this._colorize("0");
    }

    _colorize(rate) {
        this._opaque = STATE_COLORS[rate][0];
        this._light = STATE_COLORS[rate][1];
        this._lightest = STATE_COLORS[rate][2];
        this.style.setProperty('--color-opaque', this._opaque);
        this.style.setProperty('--color-light', this._light);
        this.style.setProperty('--color-lightest', this._lightest);
    }

    _clicked() {
        store.dispatch(selectSummaryCard(this.card));
    }

    _rated(e) {
        let key = this.chapter + "." + this.card.topic;
        this.dispatchEvent(new CustomEvent('rated', { bubbles: true, detail: {key: key, rate: e.detail.rate}}));
    }

    updated(changedProperties) {
        if (changedProperties.has("state"))
          this._colorize(this.state);
    }

    _getStateValue(state, key) {
        let value = state.states.state[key];
        return value !== undefined ? value : 0;
    }

}

window.customElements.define('kmap-test-result-card', KMapTestResultCard);
