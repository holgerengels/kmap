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
import {unsafeHTML} from 'lit-html/directives/unsafe-html';
import {connect} from "pwa-helpers/connect-mixin";
import {store} from "../store";
import {config} from '../config';
import { STATE_COLORS } from './state-colors';
import './star-rating';
import './kmap-card-attachment';
import 'mega-material/icon';
import {fontStyles, colorStyles} from "./kmap-styles";
import {mathjaxStyles} from "./mathjax-styles";
import AsciiMathParser from "asciimath2tex";

class KMapKnowledgeCard extends connect(store)(LitElement) {

    static get styles() {
        return [
          fontStyles,
          colorStyles,
          mathjaxStyles,
            css`
:host {
  --color-opaque: #f5f5f5;
  --color-light: #e0e0e0;
  --color-lightest: #9e9e9e;
}
.card {
  display: block;
  box-sizing: border-box;
  overflow: overlay;
  width: 100%;
  border-radius: 3px;
  box-shadow: 0 2px 2px 0 rgba(0, 0, 0, 0.14),
      0 1px 5px 0 rgba(0, 0, 0, 0.12),
      0 3px 1px -2px rgba(0, 0, 0, 0.2);
  color: #212121;
  font-family: Roboto,sans-serif;
  -webkit-font-smoothing: antialiased;
  font-size: 1.00rem;
  font-weight: 400;
}
.card-header {
  padding: 8px 12px;
  color: black;
  background-color: var(--color-opaque);
}
.card-content {
  padding: 12px;
  background-color: var(--color-lightest);
  transition: background-color .5s ease-in-out;
}
.card-content img {
  max-width: calc(100vw - 44px);
}
.card-content a {
  color: var(--color-opaque);
  text-decoration: none;
  font-weight: bold;
}
.card-content a:hover {
   text-decoration: underline;
}
.card-footer {
  color: #212121;
  background-color: var(--color-light);
  transition: background-color .5s ease-in-out;
  padding: 8px 12px;
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
.attachments {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    margin-top: 12px;
    margin-left: -12px;
    margin-right: -12px;
}
.attachments > div {
    align-content: start;
    margin-left: 12px;
    margin-right: 12px;
}


            container {
              display: flex;
              flex-direction: row;
              flex-wrap: wrap;
              margin: -8px;
            }
            box {
                flex: none;
                margin: 8px;
            }
            growbox {
              flex: 1;
              flex-basis: 0.000000001px;
              margin: 8px;
            }
            box img {
                max-width: calc(100vw - 44px);
            }
      `
        ];
    }

render() {
        return html`
    <div class="card" ?selected="${this._selected}" ?highlighted="${this._highlighted}">
            <div class="card-header">
                <span>${this.card.name}</span>
            </div>
            <div class="card-content">
                <div class="main">
                ${this.card.depends && this.card.depends.length > 0
                    ? html`
                        <b>Voraussetzungen:</b> ${this.card.depends.map((depend, i) => html`
                            &nbsp;<a href="#browser/${this.subject}/${this.chapter}/${depend}">${depend}</a>
                        `)}
                        <br/><br/>
                    `
                    : html``
                }
                ${this.card.links
                    ? html`
                        <b>Fortschritt:</b>
                        ${this.progressNum} / ${this.progressOf} bearbeitet
                        <br/><br/>
                    `
                    : html``
                }

                ${unsafeHTML(this._description)}

                </div>
                <br/>
                <div class="attachments">
                    ${this._explanations && this._explanations.length > 0
                        ? html`<div>
                            <b>Erklärungen</b>
                            ${this._explanations.map((attachment, i) => html`
                                <kmap-card-attachment .attachment="${attachment}"></kmap-card-attachment>
                            `)}
                            </div>
                        `
                        : html``
                    }
                    ${this._examples && this._examples.length > 0
                        ? html`<div>
                            <b>Beispiele</b>
                            ${this._examples.map((attachment, i) => html`
                                <kmap-card-attachment .attachment="${attachment}"></kmap-card-attachment>
                            `)}
                            </div>
                        `
                        : html``
                    }
                    ${this._ideas && this._ideas.length > 0
                        ? html`<div>
                            <b>Vorstellung</b>
                            ${this._ideas.map((attachment, i) => html`
                                <kmap-card-attachment .attachment="${attachment}"></kmap-card-attachment>
                            `)}
                            </div>
                        `
                        : html``
                    }
                    ${this._usages && this._usages.length > 0
                        ? html`<div>
                            <b>Anwendungen</b>
                            ${this._usages.map((attachment, i) => html`
                                <kmap-card-attachment .attachment="${attachment}"></kmap-card-attachment>
                            `)}
                            </div>
                        `
                        : html``
                    }
                    ${this._exercises && this._exercises.length > 0
                        ? html`<div>
                            <b>Übungen</b>
                            ${this._exercises.map((attachment, i) => html`
                                <kmap-card-attachment .attachment="${attachment}"></kmap-card-attachment>
                            `)}
                            </div>
                        `
                        : html``
                    }
                </div>
            </div>
            <div class="card-footer">
                ${this.card.links
            ? html`<a slot="footer" href="#browser/${this.subject}/${this.card.links}"><mwc-icon>open_in_new</mwc-icon></a>`
                    : html`<star-rating .rate="${this.state}" @rated="${this._rated}" .color_unrated="${this._lightest}" .color_rated="${this._opaque}"></star-rating>`
            }
                                
                <div slot="footer" style="flex: 1 0 auto"></div>
                <a slot="footer" href="#browser/${this.subject}/${this.chapter}"><mwc-icon>fullscreen_exit</mwc-icon></a>
            </div>
</div>
    `;
    }

    static get properties() {
        return {
            subject: {type: String},
            chapter: {type: String},
            card: {type: Object},
            _description: {type: String},
            state: {type: Number},
            progressNum: {type: Number},
            progressOf: {type: Number},
            _selected: {type: Boolean},
            _highlighted: {type: Boolean},
            _explanations: {type: Array},
            _examples: {type: Array},
            _usages: {type: Array},
            _ideas: {type: Array},
            _exercises: {type: Array},
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

    _rated(e) {
        let key = this.chapter + "." + this.card.name;
        this.dispatchEvent(new CustomEvent('rated', { bubbles: true, detail: {key: key, rate: e.detail.rate}}));
    }

    _rating(state) {
        if (state.states && state.states.state) {
            let key = this.chapter + "." + this.card.name;
            this.state = this._getStateValue(state, key);
            this.progressNum = this._getStateValue(state, key + "*");
            this.progressOf = this._getStateValue(state, key + "#");
        }
        else {
            this.state = 0;
            this.progressNum = 0;
            this.progressOf = 0;
        }

        this._colorize(this.state);
    }

    stateChanged(state) {
        this._selected = state.maps.selectedCardName === this.card.name;
        this._highlighted = state.maps.selectedCardDependencies && state.maps.selectedCardDependencies.includes(this.card.name);
        this._rating(state);
    }

    updated(changedProperties) {
        if (changedProperties.has("subject") || changedProperties.has("chapter") || changedProperties.has("card"))
            this._rating(store.getState());
        if (changedProperties.has("card") && this.card && this.card.attachments)
            this.divideAttachments(this.card.attachments);

      if (changedProperties.has("card") && this.card) {
        if (this.card.description) {
          let description = this.card.description.replace(/inline:/g, config.server + "data/" + this.subject + "/" + this.chapter + "/" + this.card.name + "/");
          var buffer = "";
          var t = false;
          description.split("`").reverse().forEach(function (element) {
            if (t) {
              const parser = new AsciiMathParser();
              element = parser.parse(element);
              MathJax.texReset();
              buffer = " " + MathJax.tex2svg(element).getElementsByTagName("svg")[0].outerHTML + " " + buffer;
            }
            else
              buffer = element + buffer;
            t = !t;
          });
          this._description = buffer;
        }
        else this._description = "";
      }
    }

    _getStateValue(state, key) {
        var value = state.states.state[key];
        return value !== undefined ? value : 0;
    }

    divideAttachments(attachments) {
        var explanations = [];
        var examples = [];
        var usages = [];
        var ideas = [];
        var exercises = [];
        if (attachments) {
            for (let attachment of attachments) {
                if (attachment.tag === "explanation")
                    explanations.push(attachment);
                if (attachment.tag === "example")
                    examples.push(attachment);
                if (attachment.tag === "usage")
                    usages.push(attachment);
                if (attachment.tag === "idea")
                    ideas.push(attachment);
                else if (attachment.tag === "exercise")
                    exercises.push(attachment);
            }
        }
        this._explanations = explanations;
        this._examples = examples;
        this._usages = usages;
        this._ideas = ideas;
        this._exercises = exercises;
    }
}

window.customElements.define('kmap-knowledge-card', KMapKnowledgeCard);
