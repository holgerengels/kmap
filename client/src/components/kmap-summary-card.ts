import {LitElement, html, css, customElement, property} from 'lit-element';
import { connect } from '@captaincodeman/rdx';
import {State, store} from "../store";

import {StyleInfo, styleMap} from "lit-html/directives/style-map";
import '@material/mwc-icon';
import '@material/mwc-ripple';
import './kmap-summary-card-summary';
import './kmap-summary-card-averages';
import './kmap-summary-card-editor';
import './kmap-summary-card-rating';
import './kmap-summary-card-ratecolors';
import {STATE_COLORS} from './state-colors';
import {fontStyles, colorStyles, themeStyles, elevationStyles} from "./kmap-styles";
import {urls} from "../urls";
import {ifDefined} from "lit-html/directives/if-defined";
import {classMap} from "lit-html/directives/class-map";
import {Card} from "../models/types";
import {iconTest} from "./icons";

@customElement('kmap-summary-card')
export class KMapSummaryCard extends connect(store, LitElement) {

  @property()
  private _instance: string = '';
  @property()
  private _userid: string = '';
  @property({type: String})
  private subject: string = '';
  @property({type: String})
  private chapter: string = '';
  @property({type: Object})
  private card?: Card;
  @property()
  private _key: string = '';
  @property({type: Boolean})
  private selected: boolean = false;
  @property({type: Boolean})
  private highlighted: boolean = false;
  @property()
  private _layers: string[] = [];
  @property()
  private _colorStyles: StyleInfo = { "--color-rated":  "--color-darkgray", "--color-unrated": "--color-lightgray" };
  @property()
  private _thumbStyles?: StyleInfo = undefined;
  @property()
  private _hasTests: boolean = false;
  @property()
  private _topics: string[] = [];

  constructor() {
    super();
    this._colorize(0);
  }

  mapState(state: State) {
    return {
      _instance: state.app.instance,
      _userid: state.app.userid,
      _topics: state.tests.topics ? state.tests.topics.topics : [],
      _layers: state.shell.layers,
      selected: this.card !== undefined && state.maps.selected === this.card.topic,
      highlighted: this.card !== undefined && state.maps.selectedDependencies && state.maps.selectedDependencies.includes(this.card.topic),
    };
  }

  updated(changedProperties) {
    if (changedProperties.has("card") && this.card !== undefined) {
      this._key = this.card.links ? this.card.links : this.chapter + "." + this.card.topic;
      this._thumbStyles = this.card.thumb !== undefined ? {
        "background-image": `url('${urls.server}/data/${this.subject}/${this.chapter}/${this.card.topic}/${this.card.thumb}?instance=${this._instance}')`,
        "background-position": "center",
        "background-size": "contain",
        "background-repeat": "no-repeat",
      } : undefined;
    }

    if (changedProperties.has("card") || changedProperties.has("_topics"))
      this._hasTests = this.card !== undefined && this._topics.includes(this.chapter + "." + this.card.topic);

    if (changedProperties.has("_userid") || changedProperties.has("_layers") || changedProperties.has("_key"))
      this._colorizeEvent( );
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

  _colorizeEvent() {
    let source;
    if (this._layers.includes("averages")) {
      // @ts-ignore
      source = this.shadowRoot.getElementById('averages');
    }
    else if (this._layers.includes("editor")) {
      // @ts-ignore
      source = this.shadowRoot.getElementById('editor');
    }
    else if (this._userid) {
      // @ts-ignore
      source = this.shadowRoot.getElementById('rating');
    }

    this._colorize(source ? source.getState() : 0);
  }

  _clicked() {
    if (this.card == undefined) return;

    if (store.state.maps.selected === this.card.topic)
      store.dispatch.maps.unselectCard();
    else
      store.dispatch.maps.selectCard(this.card);
  }

  static get styles() {
    // language=CSS
    return [
      fontStyles,
      colorStyles,
      themeStyles,
      elevationStyles,
      css`
        :host {
          display: flex;
          flex-direction: column;
          --color-opaque: #f5f5f5;
          --color-light: #e0e0e0;
          --color-lightest: #9e9e9e;
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
          display: flex;
          flex-direction: column;
          box-sizing: border-box;
          width: 300px;
          border-radius: 4px;
          color: var(--color-darkgray);
        }
        div.card[thumb] {
          min-height: 134px;
        }
        div.card[selected] {
          filter: saturate(1.5) brightness(.8);
        }
        div.card[highlighted] {
          filter: saturate(1.5) brightness(.8);
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
        div.card[thumb] > kmap-summary-card-summary {
          height: 54px;
        }
      `];
  }

  render() {
    // language=CSS
    if (this.card === undefined)
      return html`card undefined`;
    else
      return html`
<div
    class="${classMap({"card": true, "elevation-02": !this.selected && !this.highlighted, "elevation-05": this.selected || this.highlighted})}"
    style=${ifDefined(this._thumbStyles ? styleMap(this._thumbStyles) : undefined)}
    ?thumb="${this.card.thumb}"
    @click="${this._clicked}" ?selected="${this.selected}" ?highlighted="${this.highlighted}">
  <mwc-ripple id="ripple"></mwc-ripple>
  <div class="card-header font-body">
    <span>${this.card.topic}</span>
    <div style="flex: 1 0 auto"></div>
    ${this.card.links ? html`
        <a href="/app/browser/${this.subject}/${this.card.links}" title="Wissenslandkarte"><mwc-icon style="--mdc-icon-size: 20px; margin:2px 0px">open_in_new</mwc-icon></a>
    ` : html`
        <a href="/app/browser/${this.subject}/${this.chapter}/${this.card.topic}" title="Wissenskarte"><mwc-icon>fullscreen</mwc-icon></a>
    `}
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
        ${!this.card.links && !this._layers.includes('averages') ? html`
          <kmap-summary-card-rating .key="${this._key}" style=${styleMap(this._colorStyles)}></kmap-summary-card-rating>
        ` : '' }

      <div style="flex: 1 0 auto; height: 24px"></div>
      ${this._hasTests ? html`
        <a href="/app/test/${this.subject}/${this.chapter}/${this.card.topic}" title="Aufgaben zum Thema ${this.card.topic}" style="display: flex; flex-flow: column; justify-content: space-around">${iconTest}</a>
      ` : ''}
  </div>
    </div>
    `;
  }
}
