import { LitElement, html, css } from 'lit-element';
import {styleMap} from 'lit-html/directives/style-map.js';
import { fontStyles, colorStyles } from "./kmap-styles";
import { STATE_COLORS } from './state-colors';
import {connect} from "pwa-helpers/connect-mixin";
import {store} from "../store";
import '@material/mwc-icon';
import '@material/mwc-ripple';
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

  display: block;
  box-sizing: border-box;
  width: 100%;
  border-radius: 4px;
  box-shadow: 0 2px 2px 0 rgba(0, 0, 0, 0.14),
      0 1px 5px 0 rgba(0, 0, 0, 0.12),
      0 3px 1px -2px rgba(0, 0, 0, 0.2);
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
.card-footer a { color: var(--color-darkgray); }.attachments {
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
        [hidden] {
          display: none;
        }
      `];
  }

  render() {
    return html`
  <div class="card-header font-body">
      <span>${this.card.topic !== "_" ? this.card.topic : this.chapter}</span>
      <div style="flex: 1 0 auto"></div>
      <a href="#browser/${this.subject}/${this.chapter}"><mwc-ripple></mwc-ripple><mwc-icon>fullscreen_exit</mwc-icon></a>
  </div>
  <kmap-knowledge-card-depends ?chapterDepends="${this.card.topic === '_'}"
      .subject="${this.subject}"
      .chapter="${this.chapter}"
      .depends="${this.card.depends}"
      ?hidden="${this.card.depends.length === 0}">
  </kmap-knowledge-card-depends>
    ${this.links ? html`
  <kmap-knowledge-card-progress
      .progressNum="${this.progressNum}"
      .progressOf="${this.progressOf}">
  </kmap-knowledge-card-progress>
    ` : ''}
  <kmap-knowledge-card-description
      .instance="${this._instance}"
      .subject="${this.subject}"
      .chapter="${this.chapter}"
      .topic="${this.card.topic}"
      .description="${this.card.description}"
      .links="${this.card.links}"
      .depends="${this.card.depends}"
      .progressNum="${this.progressNum}"
      .progressOf="${this.progressOf}">
  </kmap-knowledge-card-description>

  <div class="attachments font-body">
      ${this._explanations && this._explanations.length > 0
          ? html`<div>
              <b>Erklärungen</b>
              ${this._explanations.map((attachment, i) => html`
                  <kmap-card-attachment .instance="${this._instance}" .attachment="${attachment}"></kmap-card-attachment>
              `)}
              </div>
          `
          : html``
      }
      ${this._examples && this._examples.length > 0
          ? html`<div>
              <b>Beispiele</b>
              ${this._examples.map((attachment, i) => html`
                  <kmap-card-attachment .instance="${this._instance}" .attachment="${attachment}"></kmap-card-attachment>
              `)}
              </div>
          `
          : html``
      }
      ${this._ideas && this._ideas.length > 0
          ? html`<div>
              <b>Vorstellung</b>
              ${this._ideas.map((attachment, i) => html`
                  <kmap-card-attachment .instance="${this._instance}" .attachment="${attachment}"></kmap-card-attachment>
              `)}
              </div>
          `
          : html``
      }
      ${this._usages && this._usages.length > 0
          ? html`<div>
              <b>Anwendungen</b>
              ${this._usages.map((attachment, i) => html`
                  <kmap-card-attachment .instance="${this._instance}" .attachment="${attachment}"></kmap-card-attachment>
              `)}
              </div>
          `
          : html``
      }
      ${this._exercises && this._exercises.length > 0
          ? html`<div>
              <b>Übungen</b>
              ${this._exercises.map((attachment, i) => html`
                  <kmap-card-attachment .instance="${this._instance}" .attachment="${attachment}"></kmap-card-attachment>
              `)}
              </div>
          `
          : html``
      }
  </div>
  <div class="card-footer">
    ${this.card.links
      ? html`<a slot="footer" href="#browser/${this.subject}/${this.card.links}"><mwc-icon>open_in_new</mwc-icon></a>`
      : html`<star-rating .rate="${this.state}" @clicked="${this._rated}" style=${styleMap(this._colorStyles)}></star-rating>`
    }
      <div style="flex: 1 0 auto; height: 24px"></div>
      ${this._hasTests ? html`
        <a href="#test/${this.subject}/${this.chapter}/${this.card.topic}"><mwc-ripple></mwc-ripple><mwc-icon>help_outline</mwc-icon></a>
      ` : ''}
  </div>
    `;
    }

  static get properties() {
    return {
      _instance: {type: String},
      subject: {type: String},
      chapter: {type: String},
      card: {type: Object},
      _description: {type: String},
      state: {type: Number},
      progressNum: {type: Number},
      progressOf: {type: Number},
      _explanations: {type: Array},
      _examples: {type: Array},
      _usages: {type: Array},
      _ideas: {type: Array},
      _exercises: {type: Array},
      _opaque: {type: String},
      _light: {type: String},
      _lightest: {type: String},
      _colorStyles: {type: Object},
      _hasTests: {type: Boolean},
      _topics: {type: Array}
    };
  }

  constructor() {
    super();
    this._instance = null;
    this._hasTests = false;
    this._topics = [];
    this._colorStyles = { "--color-rated":  "--color-darkgray", "--color-unrated": "--color-lightgray" };
    this._colorize("0");
  }

  updated(changedProperties) {
    if (changedProperties.has("subject") || changedProperties.has("chapter") || changedProperties.has("card"))
      this._rating(store.getState());
    if (changedProperties.has("card") && this.card && this.card.attachments) {
      this.divideAttachments(this.card.attachments);
      this._hasTests = this._topics.includes(this.chapter + "." + this.card.topic);
    }
  }

  stateChanged(state) {
    this._instance = state.app.instance;
    this._rating(state);
    this._topics = state.tests.topics;
    this._hasTests = this._topics && this._topics.includes(this.chapter + "." + this.card.topic);
  }

  _colorize(rate) {
    this._opaque = STATE_COLORS[rate][0];
    this._light = STATE_COLORS[rate][1];
    this._lightest = STATE_COLORS[rate][2];
    this.style.setProperty('--color-opaque', this._opaque);
    this.style.setProperty('--color-light', this._light);
    this.style.setProperty('--color-lightest', this._lightest);
    this._colorStyles = { "--color-rated":  this._opaque, "--color-unrated": this._lightest };
  }

    _rated(e) {
        let key = this.chapter + "." + this.card.topic;
        this.dispatchEvent(new CustomEvent('rated', { bubbles: true, composed: true, detail: {key: key, rate: e.detail.rate}}));
    }

    _rating(state) {
        if (state.states && state.states.state) {
            let key = this.chapter + "." + this.card.topic;
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
