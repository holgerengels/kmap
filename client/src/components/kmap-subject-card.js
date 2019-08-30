/**
 @license
 Copyright (c) 2018 The Polymer Project Authors. All rights reserved.
 This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
 The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
 The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
 Code distributed by Google as part of the polymer project is also
 subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
 */

import {LitElement, html, css} from 'lit-element';
import {connect} from "pwa-helpers/connect-mixin";
import {store} from "../store";
import 'mega-material/icon';
import {STATE_COLORS} from "./state-colors";

class KMapSubjectCard extends connect(store)(LitElement) {
    static get styles() {
      // language=CSS
        return [
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
  font-family: Roboto,sans-serif;
  -webkit-font-smoothing: antialiased;
  font-size: 0.95rem;
  font-weight: 400;
            }
            .card-header {
                padding: 8px;
                color: black;
                background-color: var(--color-opaque);
                display: flex;
                flex-direction: row;
                justify-content: space-between;
            }
            .card-footer {
                color: black;
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
      `
        ];
    }

    render() {
        return html`
    <div class="card" ?selected="${this._selected}">
        <div class="card-header">
            <span>${this.subject}</span>
        </div>
        <div class="card-footer">
            <a slot="footer" href="#browser/${this.subject}/${this.subject}"><mega-icon>open_in_new</mega-icon></a>
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
