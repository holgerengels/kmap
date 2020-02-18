import {LitElement, html, css, customElement, property, query} from 'lit-element';
import { connect } from '@captaincodeman/rdx';
import {State, store} from "../store";
import {Attachment, Card} from "../models/maps";
import {STATE_COLORS} from './state-colors';

import {StyleInfo, styleMap} from 'lit-html/directives/style-map.js';
import '@material/mwc-icon';
import '@material/mwc-ripple';
import './star-rating';
import './kmap-knowledge-card-depends';
import './kmap-knowledge-card-progress';
import './kmap-knowledge-card-description';
import './kmap-knowledge-card-attachment';
import './kmap-feedback';
import {fontStyles, colorStyles} from "./kmap-styles";
import {KMapFeedback} from "./kmap-feedback";

@customElement('kmap-knowledge-card')
export class KMapKnowledgeCard extends connect(store, LitElement) {

  @property()
  private _instance: string = '';
  @property({type: String})
  private subject: string = '';
  @property({type: String})
  private chapter: string = '';
  @property({type: Object})
  private card: Card = {};
  @property({type: Number})
  private state: number = 0;
  @property({type: Number})
  private progressNum: number = 0;
  @property({type: Number})
  private progressOf: number = 0;
  @property()
  private _explanations: Attachment[] = [];
  @property()
  private _examples: Attachment[] = [];
  @property()
  private _usages: Attachment[] = [];
  @property()
  private _ideas: Attachment[] = [];
  @property()
  private _exercises: Attachment[] = [];
  @property()
  private _colorStyles: StyleInfo = { "--color-rated":  "--color-darkgray", "--color-unrated": "--color-lightgray" };
  @property()
  private _hasTests: boolean = false;
  @property()
  private _topics: string[] = [];

  private _rates: object = {};

  @query('#feedbackDialog')
  private _feedbackDialog: KMapFeedback;


  constructor() {
    super();
    this._colorize("0");
  }

  mapState(state: State) {
    return {
      _instance: state.app.instance,
      _topics: state.tests.topics ? state.tests.topics.topics : [],
      _rates: state.rates.rates,
    };
  }

  updated(changedProperties) {
    if (changedProperties.has("card") || changedProperties.has("_rates"))
      this._rating(this._rates);

    if (changedProperties.has("card"))
      this.divideAttachments(this.card ? this.card.attachments : []);

    if (changedProperties.has("card") || changedProperties.has("_topics"))
      this._hasTests = this._topics.includes(this.chapter + "." + this.card.topic);
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

  _feedback() {
    this._feedbackDialog.show();
  }

  static get styles() {
    // language=CSS
    return [
      fontStyles,
      colorStyles,
      css`
        :host {
          display: block;
          --color-opaque: #f5f5f5;
          --color-light: #e0e0e0;
          --color-lightest: #9e9e9e;

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
        .card-footer a { color: var(--color-darkgray); }
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
        mwc-icon-button {
          --mdc-icon-button-size: 24px;
          --mdc-icon-size: 22px;
          color: var(--color-darkgray);
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
      <a href="/app/browser/${this.subject}/${this.chapter}"><mwc-ripple></mwc-ripple><mwc-icon>fullscreen_exit</mwc-icon></a>
  </div>
  <kmap-knowledge-card-depends ?chapterDepends="${this.card.topic === '_'}"
      .subject="${this.subject}"
      .chapter="${this.chapter}"
      .depends="${this.card.depends}"
      ?hidden="${!this.card.depends || this.card.depends.length === 0}">
  </kmap-knowledge-card-depends>
    ${this.card.links ? html`
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
              ${this._explanations.map((attachment) => html`
                  <kmap-knowledge-card-attachment .instance="${this._instance}" .attachment="${attachment}"></kmap-knowledge-card-attachment>
              `)}
              </div>
          `
      : html``
    }
      ${this._examples && this._examples.length > 0
      ? html`<div>
              <b>Beispiele</b>
              ${this._examples.map((attachment) => html`
                  <kmap-knowledge-card-attachment .instance="${this._instance}" .attachment="${attachment}"></kmap-knowledge-card-attachment>
              `)}
              </div>
          `
      : html``
    }
      ${this._ideas && this._ideas.length > 0
      ? html`<div>
              <b>Vorstellung</b>
              ${this._ideas.map((attachment) => html`
                  <kmap-knowledge-card-attachment .instance="${this._instance}" .attachment="${attachment}"></kmap-knowledge-card-attachment>
              `)}
              </div>
          `
      : html``
    }
      ${this._usages && this._usages.length > 0
      ? html`<div>
              <b>Anwendungen</b>
              ${this._usages.map((attachment) => html`
                  <kmap-knowledge-card-attachment .instance="${this._instance}" .attachment="${attachment}"></kmap-knowledge-card-attachment>
              `)}
              </div>
          `
      : html``
    }
      ${this._exercises && this._exercises.length > 0
      ? html`<div>
              <b>Übungen</b>
              ${this._exercises.map((attachment) => html`
                  <kmap-knowledge-card-attachment .instance="${this._instance}" .attachment="${attachment}"></kmap-knowledge-card-attachment>
              `)}
              </div>
          `
      : html``
    }
  </div>
  <div class="card-footer">
    ${this.card.links
      ? html`<a slot="footer" href="/app/browser/${this.subject}/${this.card.links}"><mwc-icon>open_in_new</mwc-icon></a>`
      : html`<star-rating .rate="${this.state}" @clicked="${this._rated}" style=${styleMap(this._colorStyles)}></star-rating>`
    }
      <div style="flex: 1 0 auto; height: 24px"></div>
      ${this._hasTests ? html`
        <a href="/app/test/${this.subject}/${this.chapter}/${this.card.topic}" title="Aufgaben"><mwc-ripple></mwc-ripple><mwc-icon>help_outline</mwc-icon></a>
      ` : ''}
      <mwc-icon-button icon="feedback" title="Feedback" @click="${this._feedback}"></mwc-icon-button>
  </div>
  <kmap-feedback id="feedbackDialog" .subject="${this.subject}" .chapter="${this.chapter}" .topic="${this.card.topic}"></kmap-feedback>
    `;
  }
}
