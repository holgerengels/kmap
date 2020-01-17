import {LitElement, html, css, customElement, property} from 'lit-element';
import { connect } from '@captaincodeman/rdx';
import {State, store} from "../store";

import {styleMap} from "lit-html/directives/style-map";
import '@material/mwc-icon';
import '@material/mwc-ripple';
import './kmap-summary-card-summary';
import './kmap-summary-card-averages';
import './kmap-summary-card-editor';
import './kmap-summary-card-rating';
import './kmap-summary-card-ratecolors';
import {Card} from "../models/maps";
import {STATE_COLORS} from './state-colors';
import {fontStyles, colorStyles} from "./kmap-styles";

@customElement('kmap-summary-card')
export class KMapSummaryCard extends connect(store, LitElement) {

  @property()
  private _userid: string = '';
  @property()
  private subject: string = '';
  @property()
  private chapter: string = '';
  @property()
  private card: Card = {};
  @property()
  private _key: string = '';
  @property()
  private selected: boolean = false;
  @property()
  private highlighted: boolean = false;
  @property()
  private _layers: string[] = [];
  @property()
  private _colorStyles: object = { "--color-rated":  "--color-darkgray", "--color-unrated": "--color-lightgray" };
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
      _userid: state.app.userid,
      _topics: state.tests.topics ? state.tests.topics.topics : [],
      _layers: state.shell.layers,
      selected: state.maps.selected == this.card.topic,
      highlighted: state.maps.selectedDependencies && state.maps.selectedDependencies.includes(this.card.topic),
    };
  }

  updated(changedProperties) {
    if (changedProperties.has("card"))
      this._key = this.card.links ? this.card.links : this.chapter + "." + this.card.topic;

    if (changedProperties.has("card") || changedProperties.has("_topics"))
      this._hasTests = this._topics.includes(this.chapter + "." + this.card.topic);

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

  _clicked() {
    store.dispatch.maps.selectCard(this.card);
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
<div class="card" @click="${this._clicked}" ?selected="${this.selected}" ?highlighted="${this.highlighted}">
  <div class="card-header font-body">
    <span>${this.card.topic}</span>
    <div style="flex: 1 0 auto"></div>
    ${this.card.links ? html`
        <a href="/app/browser/${this.subject}/${this.card.links}" title="Wissenslandkarte"><mwc-ripple></mwc-ripple><mwc-icon style="--mdc-icon-size: 20px; margin:2px 0px">open_in_new</mwc-icon></a>
    ` : html`
        <a href="/app/browser/${this.subject}/${this.chapter}/${this.card.topic}" title="Wissenskarte"><mwc-ripple></mwc-ripple><mwc-icon>fullscreen</mwc-icon></a>
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
          <kmap-summary-card-rating .key="${this._key}" style=${styleMap(this._colorStyles)} .lightest="${this._lightest}" .opaque="${this._opaque}"></kmap-summary-card-rating>
        ` : '' }

      <div style="flex: 1 0 auto; height: 24px"></div>
      ${this._hasTests ? html`
        <a href="/app/tests/${this.subject}/${this.chapter}/${this.card.topic}"><mwc-ripple></mwc-ripple><mwc-icon>help_outline</mwc-icon></a>
      ` : ''}
  </div>
    <mwc-ripple id="ripple"></mwc-ripple>
    </div>
    `;
  }
}
