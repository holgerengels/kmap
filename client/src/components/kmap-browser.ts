import {LitElement, html, css, customElement, property, query} from 'lit-element';
import { connect } from '@captaincodeman/rdx';
import {State, store} from "../store";

import {colorStyles, fontStyles} from "./kmap-styles";
import '@material/mwc-icon';
import '@material/mwc-icon-button';
import '@material/mwc-top-app-bar';
import './kmap-login-button';
import './kmap-summary-card';
import './kmap-knowledge-card';
import './kmap-browser-chapter-editor';
import {Card} from "../models/maps";
import {RoutingState} from "@captaincodeman/rdx-model";

const _standalone = (window.matchMedia('(display-mode: standalone)').matches) || (window.navigator.standalone) || document.referrer.includes('android-app://');

@customElement('kmap-browser')
class KMapBrowser extends connect(store, LitElement) {

  @property()
  private _userid: string = '';
  @property()
  private active: boolean = false;
  @property()
  private _layers: string[] = [];
  @property()
  private _subject: string = '';
  @property()
  private _chapter: string = '';
  @property()
  private _chapterCard: Card = undefined;
  @property()
  private _topic: string = '';
  @property()
  private _topicCard: Card = undefined;
  @property()
  private _lines: Card[][] = [];
  @property()
  private _page: string = 'map';

  @property()
  private _loading: boolean = false;
  @property()
  private _faded: boolean = false;

  @property()
  private _animFrom: DOMRect = {};
  @property()
  private _animTo: DOMRect = {};

  @query('#bar')
  private _bar: Element;

  set route(val: RoutingState) {
    if (val.page === "browser") {
      this._topic = val.params.topic ? decodeURIComponent(val.params.topic) : '';
    }
  }

  mapState(state: State) {
    return {
      route: state.routing,
      _userid: state.app.userid,
      _layers: state.shell.layers,
      _subject: state.maps.subject,
      _chapter: state.maps.chapter,
      _lines: state.maps.lines,
      _loading: state.maps.loading,
    };
  }

  /* TODO
    store.dispatch(updateTitle(this.routeTopic ? this.routeTopic : this.routeChapter));
    store.dispatch(fetchTopicsIfNeeded(this.routeSubject));
   */

  updated(changedProperties) {
    if (changedProperties.has('_page')) {
      let page = this.shadowRoot.getElementById(this._page);
      this._bar.scrollTarget = page;
    }

    if (changedProperties.has('_topic')) {
      if (!this._topic) {
        this._topicCard = undefined;
      }
      else if (this._topic === "_") {
        this._topicCard = this._chapterCard;
      }
      else if (this._topic && this._lines) {
        let lala: Card = {};
        for (let line of this._lines) {
          for (let card of line.cards) {
            if (card.topic === this._topic)
              lala = card;
          }
        }
        this._topicCard = lala;
      }
      console.log("topic " + this._topic + " .. set topicCard " + this._topicCard);

      if (this._topicCard) {
        console.log('kmap-summary-card[key="' + this._topic + '"]');
        let nodes = this.shadowRoot.querySelectorAll('kmap-summary-card[key="' + this._topic + '"]');
        console.log(nodes);
        if (nodes.length !== 0) {
          let scard = nodes[0];
          this._animFrom = scard.getBoundingClientRect();
          console.log("from");
          console.log(this._animFrom);
        }
        console.log("topicCard " + this._topicCard + " .. set animFrom " + this._animFrom);
      }
    }
    this._page = this._topicCard ? "topic" : "map";

    if (changedProperties.has("_topicCard")) {
    }

    if (changedProperties.has("_page") && this._page === 'topic' && this._animFrom) {
      let that = this;
      setTimeout(function () {
        let kcard: Element = that.shadowRoot.querySelectorAll('kmap-knowledge-card')[0];
        that._animTo = kcard.getBoundingClientRect();
        console.log("to");
        console.log(that._animTo);

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
          that._animFrom = {};
          that._animTo = {};
        });
      });
    }

    /*
        this._chapterCard = this._map.chapterCard;
        let lines = this._map.lines;
        this._lines = lines[0].cards[0].row === -1 ? lines.slice(1) : lines;
    */

    if (changedProperties.has("_loading")) {
      let that = this;
      setTimeout(function () { that._faded = that._loading; }, 100);
    }
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

  activeChanged(active) {
    if (active && this.routeSubject && this.routeChapter) {
      store.dispatch(fetchMapIfNeeded(this.routeSubject, this.routeChapter));
      store.dispatch(fetchTopicsIfNeeded(this.routeSubject));
    }
  }

  _fire(name) {
    this.dispatchEvent(new CustomEvent(name, {bubbles: true, composed: true}));
  }

  static get styles() {
    // language=CSS
    return [
      fontStyles,
      colorStyles,
      css`
        :host {
          display: contents;
        }
        .scrollpane {
          display: flex;
          -webkit-overflow-scrolling: touch;
          outline: none;
          overflow-x: scroll;
          margin-top: 2px;
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
        .chapter-line {
          margin: 0px 0px 8px 6px;
          padding: 4px 0px;
          line-height: 24px;
          color: var(--color-darkgray);
        }
        .page {
          display: none;
          padding: 8px;
        }
        .page[active] {
          display: block;
        }
        [hidden] {
          display: none !important;
        }
      `];
  }

  render() {
    // language=HTML
    return html`
      <mwc-top-app-bar id="bar" dense>
        <mwc-icon-button icon="menu" slot="navigationIcon" @click="${e => this._fire('toggleDrawer')}"></mwc-icon-button>
        <mwc-icon-button icon="arrow_back" slot="navigationIcon" @click="${e => history.back()}" ?hidden="${!_standalone}"></mwc-icon-button>
        <div slot="title">${this._chapter}</div>
        <kmap-login-button slot="actionItems" @lclick="${e => this._fire('login')}"></kmap-login-button>
      </mwc-top-app-bar>
        <div id="map" class="page map" ?active="${this._page === 'map'}" @rated="${this._rated}">
          ${this._chapterCard ? html`
            <div class="chapter-line">
              <a href="/:app/browser/${this._subject}/${this._chapter}/_"><mwc-icon style="float: right">fullscreen</mwc-icon></a>
              ${this._chapterCard.depends ? html`
                <div>
                  <b>Voraussetzung für das Kapitel ${this._chapter}:</b> ${this._chapterCard.depends.map((depend, j) => html`
                    <a href="/:app/browser/${this._subject}/${depend}">${depend}</a>&nbsp;
                  `)}
                </div>
              ` : ''}
              ${this._layers.includes('summaries') && this._chapterCard.summary ? html`
                <div>
                  ${this._chapterCard.summary}
                </div>
              ` : ''}
            </div>
          ` : ''}
          ${this._layers.includes('editor') ? html`
             <kmap-browser-chapter-editor .subject="${this._subject}" .chapter="${this._chapter}" .chapterCard="${this._chapterCard}"></kmap-browser-chapter-editor>
           ` : ''
    }
          ${this._lines.map((line, i) => html`
            <div class="scrollpane">
              ${line.cards.map((card, j) => html`
                <kmap-summary-card .subject="${this._subject}" .chapter="${this._chapter}" .card="${card}" ?faded="${this._faded}" key="${card.topic}"></kmap-summary-card>
              `)}
            </div>
          `)}
        </div>
        <div id="topic" class="page topic" ?active="${this._page === 'topic'}" @rated="${this._rated}">
            ${this._topicCard ? html`<kmap-knowledge-card .subject="${this._subject}" .chapter="${this._chapter}" .card="${this._topicCard}"></kmap-knowledge-card>` : ''}
        </div>
        <div id="search" class="page search" ?active="${this._page === 'search'}">
            search
        </div>
    `;
  }
}
