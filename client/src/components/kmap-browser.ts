import {LitElement, html, css, customElement, property, query} from 'lit-element';
import {connect, RoutingState} from '@captaincodeman/rdx';
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
import {encode, urls} from "../urls";
import {KMapTimelineAside} from "./kmap-timeline-aside";
import {throttle} from "../debounce";
import {Timeline} from "../models/courses";

type SideBarState = "hidden" | "collapsed" | "open";

@customElement('kmap-browser')
export class KMapBrowser extends connect(store, LitElement) {

  @property()
  private _instance: string = '';
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
  private _topics?: string[] = undefined;
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
  private wide: boolean = false;

  @query('#timeline')
  private _timelineElement: KMapTimelineAside;

  set route(val: RoutingState) {
    if (val.page === "browser") {
      this._topic = val.params.topic ? decodeURIComponent(val.params.topic) : '';
    }
  }

  mapState(state: State) {
    return {
      route: state.routing,
      _instance: state.app.instance,
      _userid: state.app.userid,
      _layers: state.shell.layers,
      wide: !state.shell.narrow,
      _subject: state.maps.subject,
      _chapter: state.maps.chapter,
      _lines: state.maps.lines,
      _chapterCard: state.maps.chapterCard,
      _loading: state.maps.loading,
      _testTopics: state.tests.topics ? state.tests.topics.topics : [],
      _selected: state.maps.selected,
      _highlighted: state.maps.selectedDependencies,
      _timeline: state.shell.layers.includes('timeline') ? state.courses.selectedTimeline : undefined,
    };
  }

  protected firstUpdated() {
    this._sideBar(this.timelineState);
  }

  updated(changedProperties) {
    if (changedProperties.has("_lines")) {
      var topics: string[] = [];
      for (let line of this._lines) {
        for (let card of line.cards) {
          topics.push(card.topic);
        }
      }
      this._topics = topics;
    }
    if (changedProperties.has('_topic') || changedProperties.has("_lines")) {
      if (!this._topic) {
        this._topicCard = undefined;
      }
      else if (this._topic === "_") {
        this._topicCard = this._chapterCard;
      }
      else if (this._topic && this._lines) {
        let lala: Card | undefined = undefined;
        for (let line of this._lines) {
          for (let card of line.cards) {
            if (card.topic === this._topic)
              lala = card;
          }
        }
        this._topicCard = lala;
      }
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

      if (this._topicCard) {
        store.dispatch.shell.updateMeta({title: this._chapter, detail: this._topicCard.topic, description: this._topicCard.summary,
          image: this._topicCard.thumb ?
            `${urls.server}${encode("data", this._subject, this._chapter, this._topic, this._topicCard.thumb)}?instance=${this._instance}`
            : undefined,
          created: this._topicCard.created,
          modified: this._topicCard.modified,
          author: this._topicCard.author,
          keywords: [this._subject, this._chapter, this._topicCard.topic, ...(this._topicCard.keywords ? this._topicCard.keywords.split(",").map(k => k.trim()) : [])],
        });
      }
      else {
        store.dispatch.shell.updateMeta({
          title: this._chapter,
          description: this._chapterCard !== undefined && this._chapterCard.summary ? this._chapterCard.summary : "Wissenslandkarte zum Kapitel " + this._chapter,
          keywords: [this._subject, this._chapter, ...this._topics || []],
        });
      }
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
        }
        :host([timeline-state=open]):host([wide]) {
          grid-template-columns: 1fr 330px;
        }
        :host([timeline-state=collapsed]):host([wide]) {
          grid-template-columns: 1fr 30px;
        }
        main {
          overflow-x: hidden;
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
        .scrollpane {
          display: flex;
          -webkit-overflow-scrolling: touch;
          outline: none;
          overflow-x: scroll;
          margin-top: 2px;
          scroll-snap-type: x mandatory;
        }
        .scrollpane:hover::-webkit-scrollbar-thumb {
          background-color: var(--color-mediumgray);
        }
        .scrollpane::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .scrollpane::-webkit-scrollbar-thumb {
          transition: background-color;
          border-radius: 10px;
        }
        .scrollpane > kmap-summary-card {
          scroll-snap-align: center;
        }
        .chapter-line {
          margin: 0px 0px 8px 6px;
          padding: 4px 0px;
          line-height: 24px;
          min-height: 12px;
          color: var(--color-darkgray);
        }
        .page {
          display: none;
          padding: 8px;
        }
        .page[active] {
          display: block;
        }
        a.tests {
          position: relative;
          --mdc-icon-size: 20px;
          vertical-align: sub;
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
      `];
  }

  render() {
    // language=HTML
    return html`
        <main id="map" class="page map" ?active="${this._page === 'map'}" @rated="${this._rated}">
          ${this._layers.includes('dependencies') ? html`
            <svg-connector id="connector"></svg-connector>
          ` : ''}
          ${this._chapterCard ? html`
            <div class="chapter-line font-body">
              <a href="/app/browser/${encode(this._subject, this._chapter, '_')}" title="Wissenskarte ${this._chapter}"><mwc-icon style="float: right">fullscreen</mwc-icon></a>
              ${this._chapterCard.links ? html`
                <div>
                  <b>Zurück zu</b> ${this._chapterCard.links.split("/").map((backlink) => html`
                    <a href="/app/browser/${encode(this._subject, backlink)}" title="Wissenslandkarte ${backlink}">${backlink}</a>&nbsp;
                  `)}
                </div>
              ` : ''}
              ${this._chapterCard.dependencies ? html`
                <div>
                  <b>Voraussetzung für das Kapitel ${this._chapter}:</b> ${this._chapterCard.dependencies.map((depend) => html`
                    <a href="/app/browser/${encode(this._subject, depend)}" title="${(depend.includes('/') ? 'Wissenskarte ': 'Wissenslandkarte ') + depend}">${depend}</a>&nbsp;
                  `)}
                </div>
              ` : ''}
              ${this._layers.includes('summaries') && this._chapterCard.summary ? html`
                <div>
                  ${this._chapterCard.summary}
                </div>
              ` : ''}
              ${this._hasTests && this._page === "map" ? html`
                <div>
                  <b>Aufgaben zum Kapitel</b>
                  <a href="/app/test/${encode(this._subject, this._chapter)}" class="tests" title="Aufgaben zum Kapitel ${this._chapter}">${iconTest}</a>
                </div>
              ` : ''}
            </div>
          ` : ''}
          ${this._layers.includes('editor') ? html`
             <kmap-browser-chapter-editor .subject="${this._subject}" .chapter="${this._chapter}" .chapterCard="${this._chapterCard}"></kmap-browser-chapter-editor>
           ` : ''
          }
          ${this._lines.map((line) => html`
            <div class="scrollpane">
              ${line.cards.map((card) => html`
                <kmap-summary-card .subject="${this._subject}" .chapter="${this._chapter}" .card="${card}" ?faded="${this._faded}" key="${card.topic}"></kmap-summary-card>
              `)}
            </div>
          `)}
        </main>
        <main id="topic" class="page topic" ?active="${this._page === 'topic'}" @rated="${this._rated}">
            ${this._topicCard ? html`<kmap-knowledge-card .subject="${this._subject}" .chapter="${this._chapter}" .card="${this._topicCard}"></kmap-knowledge-card>` : ''}
        </main>
        <kmap-timeline-aside id="timeline" class="elevation-02" @touchstart="${this._swipeStart}" @touchmove="${this._swipeMove}" @touchend="${this._swipeEnd}" @open="${() => this.timelineState = 'open'}"></kmap-timeline-aside>
    `;
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
