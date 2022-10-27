import {css, html} from 'lit';
import {customElement, property, state} from 'lit/decorators.js';
import {Connected} from "./connected";
import {State, store} from "../store";

import {StyleInfo, styleMap} from 'lit/directives/style-map.js';
import '@material/mwc-icon';
import './kmap-card';
import './kmap-summary-card-averages';
import './kmap-summary-card-editor';
import './kmap-summary-card-rating';
import './kmap-summary-card-ratecolors';
import {colorStyles, elevationStyles, fontStyles} from "./kmap-styles";
import {encodePath} from "../urls";
import {Card} from "../models/types";

@customElement('kmap-summary-card')
export class KMapSummaryCard extends Connected {

  @state()
  private _userid: string = '';
  @property({type: Object})
  private card?: Card;
  @state()
  private _key: string = '';
  @property({type: Boolean})
  private selected: boolean = false;
  @property({type: Boolean})
  private highlighted: boolean = false;

  @state()
  private _targeted: string[] = [];

  @property()
  private grayedOut: boolean = false;

  @state()
  private _layers: string[] = [];
  @state()
  private _colorStyles: StyleInfo = { backgroundColor: "white" };
  @state()
  private _testCount?: number;
  @state()
  private _linkedTestCount?: number;
  @state()
  private _topicCounts: {};
  @state()
  private _chapterCounts: {};
  @state()
  private _selectedDependencies: string[] = [];

  constructor() {
    super();
    this._colorize(0);
  }

  mapState(state: State) {
    return {
      _instance: state.app.instance,
      _userid: state.app.userid,
      _topicCounts: state.tests.topicCounts,
      _chapterCounts: state.tests.chapterCounts,
      _layers: state.shell.layers,
      _selectedDependencies: state.maps.selectedDependencies,
      selected: this.card !== undefined && state.maps.selected === this.card.topic,
      _targeted: state.maps.targeted,
    };
  }

  willUpdate(changedProperties) {
    if (changedProperties.has("_targeted"))
      this.grayedOut = this.card !== undefined && this._targeted
        && !(this._targeted.includes(this.card.chapter + "/" + this.card.topic)
          || this._targeted.includes(this.card.chapter)
          || (this.card.links && this._targeted.filter(t => t.startsWith(this.card?.links || "!!!")).length > 0))

    if (changedProperties.has("card") && this.card !== undefined) {
      this._key = this.card.links ? this.card.links : this.card.chapter + "." + this.card.topic;
    }

    if (changedProperties.has("card") || changedProperties.has("_topicCounts"))
      this._testCount = (this.card !== undefined && this._topicCounts !== undefined && this.card.links === undefined) ? this._topicCounts[this.card.chapter + "/" + this.card.topic] : 0;
    if (changedProperties.has("card") || changedProperties.has("_chapterCounts"))
      this._linkedTestCount = (this.card !== undefined && this._chapterCounts !== undefined && this.card.links !== undefined) ? this._chapterCounts[this.card.links] : 0;

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

  _hovered(e) {
    if (this.card == undefined) return;

    if (e.detail.hover === true && store.state.maps.selected !== this.card.topic)
      store.dispatch.maps.selectCard(this.card);
    else if (e.detail.hover === false && store.state.maps.selected === this.card.topic)
      store.dispatch.maps.unselectCard();
  }

  _test() {
    if (this.card === undefined) return;
    store.dispatch.routing.push('/app/test/' + (this.card.links
      ? encodePath(this.card.subject, this.card.links!)
      : encodePath(this.card.subject, this.card.chapter, this.card.topic)));
  }

  static get styles() {
    // language=CSS
    return [
      fontStyles,
      colorStyles,
      elevationStyles,
      css`
        kmap-card {
          width: 300px;
          background-color: white;
          opacity: 1.0;
        }
        :host([faded]) kmap-card {
          opacity: 0.0;
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
        <kmap-card primaryLink="${this._link()}" primaryLinkTitle="${this._linkTitle()}" header="${this.card.topic + (this.card.links !== undefined ? '  &#x2198;&#xFE0E;' : '')}" subheader="${this._layers.includes("summaries") && this.card.summary ? this.card.summary : ''}"
                @hover="${this._hovered}" ?selected="${this.selected}" ?highlighted="${this.highlighted}" ?grayedOut="${this.grayedOut}"
                style=${styleMap(this._colorStyles)}>
          <!--div slot="plane" class="marker top"></div>
          <div slot="plane" class="marker bottom"></div-->
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
          ${this._testCount ? html`
            <mwc-icon-button slot="icon" icon="quiz" title="${this._testCount} Aufgaben zum Thema ${this.card.topic}" @click="${this._test}"></mwc-icon-button>
          ` : '' }
          ${this._linkedTestCount ? html`
            <mwc-icon-button slot="icon" icon="quiz" title="${this._linkedTestCount} Aufgaben zum Kapitel ${this.card.links}" @click="${this._test}"></mwc-icon-button>
          ` : '' }
        </kmap-card>
    `;
  }

  _link() {
    if (this.card === undefined) return "";
    return this.card.links ? '/app/browser/' + encodePath(this.card.subject, this.card.links) : '/app/browser/' + encodePath(this.card.subject, this.card.chapter, this.card.topic)
  }

  _linkTitle() {
    if (this.card === undefined) return "";
    return this.card.links ? 'Wissenslandkarte ' + this.card.links : 'Wissenskarte ' + this.card.topic;
  }
}
