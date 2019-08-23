import {LitElement, html, css} from 'lit-element';
import {connect} from "pwa-helpers/connect-mixin";
import {store} from "../store";
import { STATE_COLORS } from './state-colors';
import {fontStyles, colorStyles} from "./kmap-styles";
import 'mega-material/icon';
import './star-rating';
import './kmap-knowledge-card-depends';
import './kmap-knowledge-card-progress';
import './kmap-knowledge-card-description';
import './kmap-card-attachment';

class KMapKnowledgeCard extends connect(store)(LitElement) {

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
  display: block;
  box-sizing: border-box;
  overflow: overlay;
  width: 100%;
  border-radius: 3px;
  box-shadow: 0 2px 2px 0 rgba(0, 0, 0, 0.14),
      0 1px 5px 0 rgba(0, 0, 0, 0.12),
      0 3px 1px -2px rgba(0, 0, 0, 0.2);
  color: var(--color-darkgray);
  font-family: Roboto,sans-serif;
  -webkit-font-smoothing: antialiased;
  font-size: 0.95rem;
  font-weight: 400;
  background-color: var(--color-lightest);
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
.card-header {
  padding: 8px 12px;
  color: black;
  background-color: var(--color-opaque);
}

.card-footer {
  color: var(--color-darkgray);
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
.attachments {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  margin-top: 12px;
  margin-bottom: 12px;
}
.attachments > div {
  align-content: start;
  margin: 12px;
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
  <kmap-knowledge-card-depends .key="${this._key}"
      .subject="${this.subject}"
      .chapter="${this.chapter}"
      .depends="${this.card.depends}">
  </kmap-knowledge-card-depends>
    ${this.links ? html`
  <kmap-knowledge-card-progress .key="${this._key}"
      .progressNum="${this.progressNum}"
      .progressOf="${this.progressOf}">
  </kmap-knowledge-card-progress>
    ` : ''}
  <kmap-knowledge-card-description .key="${this._key}"
      .subject="${this.subject}"
      .chapter="${this.chapter}"
      .topic="${this.card.name}"
      .description="${this.card.description}"
      .links="${this.card.links}"
      .depends="${this.card.depends}"
      .progressNum="${this.progressNum}"
      .progressOf="${this.progressOf}">
  </kmap-knowledge-card-description>

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
