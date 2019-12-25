import {LitElement, html, css} from 'lit-element';
import { connect } from '@captaincodeman/rdx';
import {store} from "../store";
import {STATE_COLORS} from "./state-colors";
import {colorStyles, fontStyles} from "./kmap-styles";

import '@material/mwc-icon';
import '@material/mwc-ripple';

class KMapSubjectCard extends connect(store, LitElement) {
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
.card-header, .card-footer {
  transition: background-color .5s ease-in-out;
  padding: 4px 8px;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
}
.card-header {
  color: black;
  background-color: var(--color-opaque);
  border-top-left-radius: 4px;
  border-top-right-radius: 4px;
}
.card-footer {
  color: var(--color-darkgray);
  background-color: var(--color-light);
  border-bottom-left-radius: 4px;
  border-bottom-right-radius: 4px;
}
.card-header span, .card-footer span { align-self: center; }
.card-header a, .card-footer a { height: 24px; color: black; display: block }
.card-footer a { color: var(--color-darkgray); }
      `];
  }

    render() {
      return html`
<div class="card">
  <div class="card-header font-body">
    <span>${this.subject}</span>
    <div style="flex: 1 0 auto"></div>
    <a href="/:app/browser/${this.subject}/${this.subject}" title="Wissenslandkarte"><mwc-ripple></mwc-ripple><mwc-icon style="--mdc-icon-size: 20px; margin:2px 0px">open_in_new</mwc-icon></a>
  </div>
  <div class="card-footer font-body">
      <div style="flex: 1 0 auto; height: 24px"></div>
  </div>
  </div>
    `;
    }

    static get properties() {
        return {
            subject: {type: String},
            state: {type: Number},
            progressNum: {type: Number},
            progressOf: {type: Number},
            _selected: {type: Boolean},
            _opaque: {type: String},
            _light: {type: String},
            _lightest: {type: String},
        }
    }

    constructor() {
        super();
        this.state = 0;
        this.progressNum = 0;
        this.progressOf = 0;
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
        //store.dispatch(selectSummaryCard(this.card));
    }

    stateChanged(state) {
        if (state.states.state) {
            let key = this.subject + "." + this.subject;
            this.state = this.getStateValue(state, key);
            this.progressNum = this.getStateValue(state, key + "*");
            this.progressOf = this.getStateValue(state, key + "#");
        }
        else {
            this.state = 0;
            this.progressNum = 0;
            this.progressOf = 0;
        }
    }

    getStateValue(state, key) {
        var value = state.states.state[key];
        return value !== undefined ? value : 0;
    }

}

window.customElements.define('kmap-subject-card', KMapSubjectCard);
