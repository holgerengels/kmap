import {css, customElement, html, property} from 'lit-element';
import {Connected} from "./connected";
import {State, store} from "../store";

import {StyleInfo, styleMap} from "lit-html/directives/style-map";
import '@material/mwc-icon';
import './kmap-card';
import './kmap-summary-card-averages';
import './kmap-summary-card-editor';
import './kmap-summary-card-rating';
import './kmap-summary-card-ratecolors';
import {colorStyles, elevationStyles, fontStyles} from "./kmap-styles";
import {encode} from "../urls";
import {Card} from "../models/types";
import {iconTest} from "./icons";

@customElement('kmap-summary-card')
export class KMapSummaryCard extends Connected {

  @property()
  private _userid: string = '';
  @property({type: Object})
  private card?: Card;
  @property()
  private _key: string = '';
  @property({type: Boolean})
  private selected: boolean = false;
  @property({type: Boolean})
  private highlighted: boolean = false;

  @property()
  private grayedOut: boolean = false;

  @property()
  private _layers: string[] = [];
  @property()
  private _colorStyles: StyleInfo = { backgroundColor: "white" };
  @property()
  private _hasTests: boolean = false;
  @property()
  private _topics: string[] = [];
  @property()
  private _selectedDependencies: string[] = [];

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
      _selectedDependencies: state.maps.selectedDependencies,
      selected: this.card !== undefined && state.maps.selected === this.card.topic,
      grayedOut:  this.card !== undefined && state.maps.targeted
        && !(state.maps.targeted.includes(this.card.chapter + "/" + this.card.topic)
          || state.maps.targeted.includes(this.card.chapter)
          || (this.card.links && state.maps.targeted.filter(t => t.startsWith(this.card?.links || "!!!")).length > 0))
    };
  }

  updated(changedProperties) {
    if (changedProperties.has("card") && this.card !== undefined) {
      this._key = this.card.links ? this.card.links : this.card.chapter + "." + this.card.topic;
      /*
      this._thumbStyles = this.card.thumb !== undefined ? {
        "background-image": `url('${urls.server}${encode("data", this.subject, this.chapter, this.card.topic, this.card.thumb)}?instance=${this._instance}')`,
        "background-position": "center",
        "background-size": "contain",
        "background-repeat": "no-repeat",
      } : undefined;
      */
    }

    if (changedProperties.has("card") || changedProperties.has("_topics"))
      this._hasTests = this.card !== undefined && this._topics.includes(this.card.chapter + "." + this.card.topic);

    if (changedProperties.has("_userid") || changedProperties.has("_layers") || changedProperties.has("_key"))
      this._colorizeEvent( );

    if (changedProperties.has("_selectedDependencies")) {
      this.highlighted = this.card?.links
        ? this._selectedDependencies.includes(this.card.links)
        : this._selectedDependencies.includes(this.card?.chapter + "/" + this.card?.topic);
    }
  }

  _colorize(rate) {
    this._colorStyles = {
      backgroundColor: rate !== 0 ? "hsl(" + 120 * (rate - 1) / 4 + ", 100%, 90%)" : "white",
    };
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

  _hovered() {
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
      elevationStyles,
      css`
        kmap-card {
          transition: opacity .1s ease-in-out;
          opacity: 1.0;
        }
        :host([faded]) kmap-card {
          opacity: 0.0;
        }
        kmap-card {
          width: 300px;
          background-color: white;
          transition: background-color 280ms cubic-bezier(0.4, 0, 0.2, 1), opacity 280ms cubic-bezier(0.4, 0, 0.2, 1);
        }
        kmap-card[selected] {
        }
        kmap-card[highlighted] {
          box-shadow: 0px 3px 3px -2px rgba(0, 0, 0, 0.2),0px 3px 4px 0px rgba(0, 0, 0, 0.14),0px 1px 8px 0px rgba(0, 0, 0, 0.12);
        }
        kmap-card[grayedOut] {
          filter: grayscale(.5);
          opacity: .5;
        }
        @media not print {
          .print-show { display: none }
        }
      `];
  }

  render() {
    if (this.card === undefined)
      return html`card undefined`;
    else
      // language=HTML
      return html`
        <kmap-card primaryLink="${this._link()}" primaryLinkTitle="${this._linkTitle()}" header="${this.card.topic}" subheader="${this._layers.includes("summaries") && this.card.summary ? this.card.summary : ''}"
                @hover="${this._hovered}" ?selected="${this.selected}" ?highlighted="${this.highlighted}" ?grayedOut="${this.grayedOut}"
                style=${styleMap(this._colorStyles)}>
          <div slot="plane" class="marker top"></div>
          <div slot="plane" class="marker bottom"></div>
          ${this._layers.includes('averages') ? html`
            <kmap-card-element>
              <kmap-summary-card-averages id="averages" .key="${this._key}" @statecolor="${this._colorizeEvent}"></kmap-summary-card-averages>
            </kmap-card-element>
          ` : '' }
          ${this._layers.includes('editor') ? html`
            <kmap-card-element>
              <kmap-summary-card-editor id="editor" .key="${this._key}" .card="${this.card}" @statecolor="${this._colorizeEvent}"></kmap-summary-card-editor>
            </kmap-card-element>
          ` : '' }
          ${!this._layers.includes('averages') ? html`
            <kmap-summary-card-ratecolors id="rating" .key="${this._key}" @statecolor="${this._colorizeEvent}"></kmap-summary-card-ratecolors>
          ` : ''}

          ${this._layers.includes('ratings') && !this.card.links && !this._layers.includes('averages') ? html`
            <kmap-summary-card-rating slot="button" .key="${this._key}" style="padding-left: 8px"></kmap-summary-card-rating>
          ` : '' }
          ${this._hasTests ? html`
            <a slot="icon" href="${'/app/test/' + encode(this.card.subject, this.card.chapter, this.card.topic)}" title="Aufgaben zum Thema ${this.card.topic}" style="display: flex; padding-right: 8px; --foreground: var(--color-darkgray)"><span class="print-show">Aufgaben →&nbsp;</span>${iconTest}</a>
          ` : '' }
        </kmap-card>
    `;
  }

  _link() {
    if (this.card === undefined) return "";
    return this.card.links ? '/app/browser/' + encode(this.card.subject, this.card.links) : '/app/browser/' + encode(this.card.subject, this.card.chapter, this.card.topic)
  }

  _linkTitle() {
    if (this.card === undefined) return "";
    return this.card.links ? 'Wissenslandkarte ' + this.card.links : 'Wissenskarte ' + this.card.topic;
  }
}
