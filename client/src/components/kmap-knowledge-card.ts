import {html, css} from 'lit';
import {customElement, property, query, state} from 'lit/decorators.js';
import {Connected} from "./connected";
import {State, store} from "../store";

import '@material/mwc-icon';
import './star-rating';
import './kmap-card'
import './kmap-knowledge-card-summary';
import './kmap-knowledge-card-depends';
import './kmap-knowledge-card-progress';
import './kmap-knowledge-card-description';
import './kmap-knowledge-card-attachment';
import './kmap-knowledge-card-skills';
import './kmap-feedback';
import {resetStyles, fontStyles, colorStyles} from "./kmap-styles";
import {KMapFeedback} from "./kmap-feedback";
import {Attachment, Card} from "../models/types";
import {encodePath} from "../urls";
import {ifDefined} from "lit/directives/if-defined.js";
import {by} from "./icons";

@customElement('kmap-knowledge-card')
export class KMapKnowledgeCard extends Connected {

  @state()
  private _instance: string = '';
  @state()
  private _userid: string = '';
  @property({type: Object})
  private card?: Card;
  @property({type: Number})
  private state: number = 0;
  @property({type: Number})
  private progressNum: number = 0;
  @property({type: Number})
  private progressOf: number = 0;
  @state()
  private _explanations: Attachment[] = [];
  @state()
  private _examples: Attachment[] = [];
  @state()
  private _usages: Attachment[] = [];
  @state()
  private _ideas: Attachment[] = [];
  @state()
  private _exercises: Attachment[] = [];
  @state()
  private _color: string = 'white';
  @state()
  private _testCount?: number;
  @state()
  private _topicCounts: {};
  @state()
  private _rates: object = {};
  @state()
  private _compactCards: boolean = false;

  @query('#feedbackDialog')
  // @ts-ignore
  private _feedbackDialog: KMapFeedback;


  constructor() {
    super();
    this._colorize(0);
  }

  mapState(state: State) {
    return {
      _instance: state.app.instance,
      _userid: state.app.userid,
      card: state.cards.card,
      _topicCounts: state.tests.topicCounts,
      _rates: state.rates.rates,
      _compactCards: state.shell.compactCards,
    };
  }

  willUpdate(changedProperties) {
    if (changedProperties.has("card") || changedProperties.has("_rates"))
      this._rating();

    if (changedProperties.has("card"))
      this.divideAttachments(this.card ? this.card.attachments : []);

    if (changedProperties.has("card") || changedProperties.has("_topics"))
      this._testCount = (this.card !== undefined && this._topicCounts !== undefined) ? this._topicCounts[this.card.chapter + "/"+ this.card.topic] : 0;
  }

  _colorize(rate) {
    this._color = rate !== 0 ? "hsl(" + 120 * (rate-1)/4 + ", 100%, 80%)" : "white";
  }

  _rated(e) {
    if (this.card === undefined) return;
    let key = this.card.chapter + "." + this.card.topic;
    this.dispatchEvent(new CustomEvent('rated', { bubbles: true, composed: true, detail: {key: key, rate: e.detail.rate}}));
  }

  _rating() {
    if (this.card !== undefined && this._rates) {
      let key = this.card.chapter + "." + this.card.topic;
      this.state = this._getStateValue(key);
      this.progressNum = this._getStateValue(key + "*");
      this.progressOf = this._getStateValue(key + "#");
    }
    else {
      this.state = 0;
      this.progressNum = 0;
      this.progressOf = 0;
    }

    this._colorize(this.state);
  }

  _getStateValue(key) {
    var value = this._rates[key];
    return value !== undefined ? value : 0;
  }

  divideAttachments(attachments) {
    var explanations: Attachment[] = [];
    var examples: Attachment[] = [];
    var usages: Attachment[] = [];
    var ideas: Attachment[] = [];
    var exercises: Attachment[] = [];
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

  _test() {
    if (this.card === undefined) return;
    store.dispatch.routing.push('/app/test/' + encodePath(this.card.subject, this.card.chapter, this.card.topic));
  }

  _feedback() {
    if (this._userid)
      this._feedbackDialog.show();
    else
      store.dispatch.shell.showMessage("Bitte melde Dich an, um die Feedbackfunktion zu nutzen!")
  }

  _permalink() {
    if (this.card === undefined) return;

    navigator.clipboard.writeText(window.location.origin + "/app/" + encodePath("browser", this.card.subject, this.card.chapter, this.card.topic))
      .then(
        () => store.dispatch.shell.showMessage("Link wurde kopiert"),
        () => store.dispatch.shell.showMessage("Link konnte nicht kopiert werden")
      );
  }

  _share() {
    if (this.card === undefined)
      return;
    // @ts-ignore
    navigator.share({
      title: "KMap Wissenskarte",
      text: this.card.chapter + " - " + this.card.topic,
      url: document.location.href,
    })
  }

  static get styles() {
    // language=CSS
    return [
      resetStyles,
      fontStyles,
      colorStyles,
      css`
        kmap-card {
          max-width: 800px;
          background-color: white;
          opacity: 1.0;
        }
        :host([faded]) kmap-card {
          opacity: 0.0;
        }
        .button {
          margin-left: 8px;
        }
        .attachments {
          display: flex;
          flex-direction: row;
          flex-wrap: wrap;
        }
        .attachments > div {
          align-content: start;
          margin: 16px;
        }
        [hidden] {
          display: none;
        }
        kmap-card::part(teaser) {
          width: 100px;
          --foreground: rgba(0, 0, 0, 0.2);
        }
        a[slot=teaser] { text-decoration: none }
      `];
  }

  render() {
    if (this.card === undefined)
      return '';
    else
      // language=HTML
      return html`
        <style>
          kmap-card::part(teaser) {
            background: linear-gradient(to right top, rgba(255,255,255,0) 50%, ${this._color} );
          }
        </style>
      <kmap-card>
        <kmap-card-text>
          ← <a href="/app/browser/${encodePath(this.card.subject, this.card.chapter)}" title="Wissenslandkarte ${this.card.chapter}">${this.card.chapter}</a>
        </kmap-card-text>
        <kmap-card-spacer></kmap-card-spacer>
        <kmap-card-spacer></kmap-card-spacer>

        ${this._compactCards ? '' : html`
          <kmap-card-text type="header">
            <h2>${this.card.topic !== "_" ? this.card.topic : this.card.chapter}</h2>
          </kmap-card-text>
        `}

        ${!this._compactCards && this.card.dependencies && this.card.dependencies.length !== 0 ? html`
          <kmap-card-text>
            <kmap-knowledge-card-depends
                .subject="${this.card.subject}"
                .dependencies="${this.card.dependencies}"
                ?hidden="${!this.card.dependencies || this.card.dependencies.length === 0}">
            </kmap-knowledge-card-depends>
            <kmap-card-spacer></kmap-card-spacer>
          </kmap-card-text>
        ` : '' }

        ${this.card.links ? html`
          <kmap-card-text>
            <kmap-knowledge-card-progress
                .progressNum="${this.progressNum}"
                .progressOf="${this.progressOf}">
            </kmap-knowledge-card-progress>
          </kmap-card-text>
        ` : ''}

        ${this.card.summary ? html`
          <kmap-card-text>
            <kmap-knowledge-card-summary summary="${this.card.summary}"></kmap-knowledge-card-summary>
          </kmap-card-text>
          <kmap-card-divider></kmap-card-divider>
        ` : '' }
        <kmap-card-text>
          <kmap-knowledge-card-description
              .instance="${this._instance}"
              .subject="${this.card.subject}"
              .chapter="${this.card.chapter}"
              .topic="${this.card.topic}"
              .description="${this.card.description}"
              .links="${this.card.links}"
              .progressNum="${this.progressNum}"
              .progressOf="${this.progressOf}">
          </kmap-knowledge-card-description>
        </kmap-card-text>

        ${this.card.skills && this.card.skills.length !== 0 ? html`
          <kmap-card-text>
            <kmap-card-spacer></kmap-card-spacer>
            <kmap-knowledge-card-skills .skills="${this.card.skills}"></kmap-knowledge-card-skills>
            <kmap-card-spacer></kmap-card-spacer>
          </kmap-card-text>
        ` : '' }

        ${this.card.attachments.length !== 0 ? html`
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
        ` : '' }

          ${this.card.author !== undefined ? html`
            <a slot="teaser" rel="author" href="https://kmap.eu/app/browser/Hilfe/Autoren/${this.card.author}" title="${ifDefined(this.card.author ? 'CC BY-SA - ' + this.card.author : undefined)}">${by}<span style="font-size: 0">${this.card.author}</span></a>
          ` : ''}

          <span class="button" slot="button"><b>←</b> <a href="/app/browser/${encodePath(this.card.subject, this.card.chapter)}" title="Wissenslandkarte ${this.card.chapter}">${this.card.chapter}</a></span>

          ${!this.card.links && false ? html`
            <star-rating slot="button" .rate="${this.state}" @clicked="${this._rated}"></star-rating>
          ` : '' }
          ${this._testCount ? html`
            <mwc-icon-button slot="icon" icon="quiz" title="${this._testCount} Aufgaben zum Thema ${this.card.topic}" @click="${this._test}"></mwc-icon-button>
          `:'' }
            <mwc-icon-button slot="icon" icon="feedback" title="Feedback" aria-haspopup="dialog" @click="${this._feedback}"></mwc-icon-button>
            <mwc-icon-button slot="icon" icon="share" title="Teilen..." ?hidden="${typeof navigator['share'] !== 'function'}" @click="${this._share}"></mwc-icon-button>
            <mwc-icon-button slot="icon" icon="link" title="Permalink" ?hidden="${typeof navigator['share'] === 'function'}"  @click="${this._permalink}"></mwc-icon-button>
         </kmap-card>

          ${this._userid ? html`<kmap-feedback id="feedbackDialog" .subject="${this.card.subject}" .chapter="${this.card.chapter}" .topic="${this.card.topic}"></kmap-feedback>` : '' }
    `;
  }
}
