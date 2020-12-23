import {html, css, customElement, property, query} from 'lit-element';
import {RoutingState} from '@captaincodeman/rdx';
import {State, store} from "../store";

import {colorStyles, elevationStyles, fontStyles} from "./kmap-styles";
import '@material/mwc-icon';
import '@material/mwc-icon-button';
import '@material/mwc-top-app-bar';
import './kmap-login-button';
import './kmap-summary-card';
import './kmap-knowledge-card';
import './kmap-browser-chapter-editor';
import './kmap-timeline-aside';
import './svg-connector';
import {Line} from "../models/maps";
import {Card} from "../models/types";
import {Connector} from "./svg-connector";
import {iconTest} from "./icons";
import {encode} from "../urls";
import {KMapTimelineAside} from "./kmap-timeline-aside";
import {throttle} from "../debounce";
import {Timeline} from "../models/courses";
import {StyleInfo, styleMap} from "lit-html/directives/style-map";
import {Connected} from "./connected";

type SideBarState = "hidden" | "collapsed" | "open";

@customElement('kmap-browser')
export class KMapBrowser extends Connected {

  @property()
  private _userid: string = '';
  @property()
  private _layers: string[] = [];
  @property()
  private _subject: string = '';
  @property()
  private _chapter: string = '';
  @property()
  private _chapterCard?: Card = undefined;
  @property()
  private _topic: string = '';
  @property()
  private _topicCard?: Card = undefined;
  @property()
  private _lines: Line[] = [];
  @property()
  private _maxCols: number = 0;
  @property()
  private _hasTests: boolean = false;
  @property()
  private _testTopics: string[] = [];

  @property()
  private _page: string = '';

  @property()
  private _loading: boolean = false;
  @property()
  private _faded: boolean = false;

  @property()
  private _animFrom?: DOMRect = undefined;
  @property()
  private _animTo?: DOMRect = undefined;

  @property()
  private _selected: string = '';
  @property()
  private _highlighted: string[] = [];

  @property({reflect: true, type: String, attribute: "timeline-state"})
  private timelineState: SideBarState = "hidden";

  @property()
  private _timeline: Timeline;

  @property({reflect: true, type: Boolean})
  // @ts-ignore
  private drawerOpen: boolean = false;

  @property({reflect: true, type: Boolean})
  // @ts-ignore
  private wide: boolean = false;

  @query('#timeline')
  private _timelineElement: KMapTimelineAside;

  set route(val: RoutingState<string>) {
    if (val.page === "browser") {
      this._topic = val.params.topic ? decodeURIComponent(val.params.topic) : '';
    }
  }

  mapState(state: State) {
    return {
      route: state.routing,
      _userid: state.app.userid,
      _layers: state.shell.layers,
      wide: !state.shell.narrow,
      drawerOpen: state.shell.drawerOpen && !state.shell.narrow,
      _subject: state.maps.subject,
      _chapter: state.maps.chapter,
      _lines: state.maps.lines,
      _chapterCard: state.maps.chapterCard,
      _topicCard: state.maps.topicCard,
      _loading: state.maps.loading,
      _testTopics: state.tests.topics ? state.tests.topics.topics : [],
      _selected: state.maps.selected,
      _highlighted: state.maps.selectedDependencies,
      _timeline: state.courses.selectedTimeline,
    };
  }

  protected firstUpdated() {
    this._sideBar(this.timelineState);
  }

  updated(changedProperties) {
    if (changedProperties.has("_lines")) {
      var cols = 0;
      for (let line of this._lines) {
        cols = Math.max(cols, line.cards.length)
      }
      this._maxCols = cols;
    }

    if (changedProperties.has("_topicCard") || changedProperties.has("_chapterCard")) {
      if (this._page === "map" && this._topicCard !== undefined) {
        // @ts-ignore
        let nodes = this.shadowRoot.querySelectorAll('kmap-summary-card[key="' + this._topic + '"]');
        if (nodes.length !== 0) {
          let scard = nodes[0];
          this._animFrom = scard.getBoundingClientRect();
          console.log("from");
          console.log(this._animFrom);
        }
      }
      this._page = this._topicCard ? "topic" : "map";
    }

    if (changedProperties.has("_page") && this._page === 'topic' && this._animFrom !== undefined) {
      let that = this;
      setTimeout(function () {
        // @ts-ignore
        let kcard: Element = that.shadowRoot.querySelectorAll('kmap-knowledge-card')[0];
        that._animTo = kcard.getBoundingClientRect();
        console.log("to");
        console.log(that._animTo);

        if (!that._animFrom)
          return;
        if (that._animTo.width === 0)
          return;

        var invertTop = that._animFrom.top - that._animTo.top;
        var invertLeft = that._animFrom.left - that._animTo.left;
        var invertScale = that._animFrom.width / that._animTo.width;

        var player = kcard.animate([{
          transformOrigin: 'top left',
          transform: `translate(${invertLeft}px, ${invertTop}px) scale(${invertScale}, ${invertScale})`,
          opacity: 0.2
        }, {
          transformOrigin: 'top left', transform: 'none', opacity: 1
        }],{
          duration: 300,
          easing: 'ease-in-out',
          fill: 'both'
        });
        player.addEventListener('finish', function () {
          that._animFrom = undefined;
          that._animTo = undefined;
        });
      });

    }

    if (this._layers.includes("dependencies") && (changedProperties.has("_selected") || changedProperties.has("_highlighted"))) {
      if (!this.shadowRoot)
        return;

      const connector: Connector = this.shadowRoot.getElementById("connector") as Connector;
      if (!connector) return;

      connector.clear();
      connector.setAttribute("faded", "true");

      if (this._selected && this._highlighted) {
        let selected = this._findCard(this._selected);
        if (selected === undefined)
          return;
        for (const topic of this._highlighted) {
          let highlighted = this._findCard(topic);
          if (highlighted === undefined)
            continue;
          connector.add(highlighted, selected);
        }
        setTimeout(function () {
          connector.removeAttribute("faded");
        });
      }
    }

    if (changedProperties.has("_loading")) {
      let that = this;
      setTimeout(function () { that._faded = that._loading; }, 100);
    }

    if (changedProperties.has("_chapter")) {
      this._hasTests = this._testTopics.filter(t => t.startsWith(this._chapter)).length > 1;
      // @ts-ignore
      const connector: Connector = this.shadowRoot.getElementById("connector") as Connector;
      connector.clear();
      connector.setAttribute("faded", "true");
    }

    if (changedProperties.has("_timeline")) {
      this.timelineState = this._timeline === undefined ? "hidden" : "open";
    }
    if (changedProperties.has("timelineState")) {
      this._sideBar(this.timelineState);
      this._timelineElement.open = this.timelineState !== "collapsed";
    }
  }

  private _sideBar(state: SideBarState) {
    switch (state) {
      case "open":
        this._timelineElement.style.transform = "translateX(0px)";
        this._timelineElement.style.opacity = "1";
        break;
      case "hidden":
        this._timelineElement.style.transform = "translateX(330px)";
        this._timelineElement.style.opacity = "0";
        break;
      case "collapsed":
        this._timelineElement.style.transform = "translateX(300px)";
        this._timelineElement.style.opacity = "1";
        break;
    }
  }

  _findCard(topic: string) {
    // @ts-ignore
    const elements = this.shadowRoot.querySelectorAll("kmap-summary-card");
    for (const element of elements) {
      if (topic === element.getAttribute("key"))
        return element as HTMLElement;
    }
    return undefined;
  }

  _rated(e) {
    var detail = e.detail;
    if (this._userid) {
      console.log("save " + detail.key + " := " + detail.rate);
      store.dispatch.rates.store({subject: this._subject, id: detail.key, rate: detail.rate});
    }
    else {
      console.log("cannot save " + detail.key + " := " + detail.rate);
      store.dispatch.shell.showMessage("Achtung! Deine Eingaben können nur gespeichert werden, wenn Du angemeldet bist!");
    }
  }

  static get styles() {
    // language=CSS
    return [
      fontStyles,
      colorStyles,
      elevationStyles,
      css`
        :host {
          display: grid;
          grid-template-columns: 1fr;
          --content-width: 100vw;
        }
        :host([draweropen]) {
          min-width: 300px;
          --content-width: calc(100vw - var(--mdc-drawer-width, 256px));
        }
        :host([timeline-state=open]):host([wide]) {
          grid-template-columns: 1fr 330px;
        }
        :host([timeline-state=collapsed]):host([wide]) {
          grid-template-columns: 1fr 30px;
        }
        :host kmap-timeline-aside {
          position: fixed;
          top: 0px;
          bottom: 0px;
          width: 330px;
          right: 0px;
          padding-top: 48px;
          transition: transform 0.4s ease-in-out, opacity 0.4s ease-in-out;
        }
        .chapter-card {
          grid-column: 1 / -1;
          width: min(100%, 100vw);
          justify-self: left;
          background-color: white;
        }
        :host([wide]) .chapter-card {
          width: min(100%, calc(100vw - 32px));
        }
        :host([draweropen]) .chapter-card {
          width: min(100%, calc(100vw - var(--mdc-drawer-width, 256px) - 32px));
          min-width: 300px;
        }
        .cards {
          margin: 16px;
          display: none;
          grid-gap: 16px;
        }
        .cards[active] {
          display: grid;
        }
        .cards [first] {
          grid-column-start: 1;
        }
        :host([wide]) kmap-knowledge-card {
          margin: 16px;
        }
        .button {
          text-transform: uppercase;
          margin-left: 8px;
        }
        [hidden] {
          display: none !important;
        }
        svg-connector {
          opacity: 1;
          transition: opacity ease-in-out .3s;
        }
        svg-connector[faded] {
          opacity: 0;
        }
        @media print {
          .print-hide { display: none }
        }
        @media not print {
          .print-show { display: none }
        }
      `];
  }

  render() {
    const gridStyles: StyleInfo = {
      gridTemplateColumns: "repeat(" + this._maxCols + ", 300px)",
    }
    // language=HTML
    return html`
      ${this._layers.includes('dependencies') ? html`
        <svg-connector id="connector"></svg-connector>
      ` : '' }

      <div ?active="${this._page === 'map'}" @rated="${this._rated}" class="cards" style="${styleMap(gridStyles)}">
        ${this._chapterCard ? this._renderChapterCard() : ''}
        ${this._lines.map((line) => html`
          ${line.cards.map((card, index) => html`
            <kmap-summary-card ?first="${index === 0}" .subject="${this._subject}" .chapter="${this._chapter}" .card="${card}" ?faded="${this._faded}" key="${card.topic}"></kmap-summary-card>
          `)}
        `)}
      </div>

      ${this._topicCard ? html`
        <kmap-knowledge-card @rated="${this._rated}" .subject="${this._subject}" .chapter="${this._chapter}" .card="${this._topicCard}"></kmap-knowledge-card>
      ` : '' }
      <kmap-timeline-aside id="timeline" class="elevation-02" @touchstart="${this._swipeStart}" @touchmove="${this._swipeMove}" @touchend="${this._swipeEnd}" @open="${() => this.timelineState = 'open'}"></kmap-timeline-aside>
    `;
  }

  _renderChapterCard() {
    return this._chapterCard ? html`
      <kmap-card class="chapter-card">
        ${this._chapterCard.links ? html`
          <kmap-card-text class="print-hide">
            <b>Zurück zu</b> ${this._chapterCard.links.split("/").map((backlink) => html`
              <a href="/app/browser/${encode(this._subject, backlink)}" title="Wissenslandkarte ${backlink}">${backlink}</a>&nbsp;
            `)}
          </kmap-card-text>
        ` : html`
          <kmap-card-text class="print-hide">
            <b>Zurück zum </b> <a href="/app/" title="Wissenslandkarte">Start</a>
          </kmap-card-text>
        ` }
        ${this._chapterCard.dependencies ? html`
          <kmap-card-text>
            <b>Voraussetzung für das Kapitel ${this._chapter}:</b> ${this._chapterCard.dependencies.map((depend) => html`
              <a href="/app/browser/${encode(this._subject, ...depend.split('/'))}" title="${(depend.includes('/') ? 'Wissenskarte ': 'Wissenslandkarte ') + depend}">${depend}</a>&nbsp;
            `)}
          </kmap-card-text>
        ` : '' }
        ${this._layers.includes('summaries') && this._chapterCard.summary ? html`
          <kmap-card-spacer></kmap-card-spacer>
          <kmap-card-text>
            ${this._chapterCard.summary}
          </kmap-card-text>
          <kmap-card-spacer></kmap-card-spacer>
        ` : '' }
        ${this._layers.includes('editor') ? html`
          <kmap-card-text>
            <kmap-browser-chapter-editor .subject="${this._subject}" .chapter="${this._chapter}" .chapterCard="${this._chapterCard}"></kmap-browser-chapter-editor>
          </kmap-card-text>
        ` : '' }

        ${this._chapterCard.description ? html`
          <a class="button" slot="button" href="/app/browser/${encode(this._subject, this._chapter, '_')}" title="Wissenskarte ${this._chapter}">Mehr</a>
        ` : ''}
        ${this._hasTests ? html`
          <a slot="icon" href="${'/app/test/' + encode(this._subject, this._chapter)}" title="Aufgaben zum Kapitel ${this._chapter}" style="display: flex; padding-right: 8px; --foreground: var(--color-darkgray)"><span class="print-show">Gemischte Aufgaben →&nbsp;</span>${iconTest}</a>
        ` : '' }
      </kmap-card>
    ` : '';
  }
  _swipeX?: number;

  constructor() {
    super();
    this._swipeMove = throttle(this._swipeMove, 100, this);
  }
  _swipeStart(e: TouchEvent) {
    this._swipeX = e.touches[0].pageX;
    this._timelineElement.style.transition = "";
  }
  _swipeMove(e: TouchEvent) {
    if (!this._swipeX) return;

    if (e.touches[0].pageX > this._swipeX) {
      this._timelineElement.style.transform = "translateX(" + (e.touches[0].pageX - this._swipeX) + "px)";
    }
    else
      this._timelineElement.style.transform = "translateX(0px)";
  }
  _swipeEnd(e: TouchEvent) {
    if (!this._swipeX) return;

    if ((e.changedTouches[0].pageX - this._swipeX) > 100) {
      this.timelineState = "collapsed";
    }
    else {
      this.timelineState = "open";
    }
    this._swipeX = undefined;
    this._timelineElement.style.transition = "transform 0.4s ease-in-out, opacity 0.4s ease-in-out";
  }
}
