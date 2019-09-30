import {LitElement, html, css} from 'lit-element';
import {connect} from 'pwa-helpers/connect-mixin.js';
import {store} from "../store";
import {updateTitle, showMessage} from "../actions/app";
import {fetchMapIfNeeded} from "../actions/maps";
import {storeState} from "../actions/states";

import 'mega-material/icon-button';
import 'mega-material/top-app-bar';
import './kmap-summary-card';
import './kmap-knowledge-card';
import './kmap-browser-chapter-editor';

class KMapBrowser extends connect(store)(LitElement) {
  static get styles() {
    // language=CSS
    return [
      css`
        .scrollpane {
          white-space: nowrap;
          display: block;
          -webkit-overflow-scrolling: touch;
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

        .board {
          height: auto;
          outline: none;
          padding: 8px;
          padding-bottom: 36px;
        }

        .detail {
          height: auto;
          outline: none;
          padding: 8px;
        }
        .chapter-line {
            margin: 8px 6px;
            padding: 4px 0px;
            line-height: 24px;
            color: var(--color-darkgray);
        }
        .chapter-line a {
            color: var(--color-mediumgray);
            text-decoration: none;
            font-weight: bold;
        }

        .chapter-line a:hover {
            text-decoration: underline;
        }
        .line {
          outline: none;
          overflow-x: scroll;
          margin-top: 2px;
        }

        .page {
          position: absolute;
          top: 64px;
          left: 0;
          right: 0;
          bottom: 0;
          overflow-y: auto;
          visibility: hidden;
          opacity: 0.0;
          transition: opacity .8s;
          padding: 8px;
        }

        .page[active] {
          visibility: visible;
          opacity: 1.0;
        }

        kmap-summary-card {
          vertical-align: top;
          margin: 6px;
            margin-top: 0px;
        }
      `];
  }

  render() {
    return html`
      <mega-top-app-bar>
        <mega-icon-button icon="menu" slot="navigationIcon"></mega-icon-button>
        <div slot="title">${this._chapter}</div>
      </mega-top-app-bar>
        <div class="page map" ?active="${this.page === 'map'}" @rated="${this._rated}">
          ${this._chapterCard ? html`
            <div class="chapter-line">
              <a href="#browser/${this._subject}/${this._chapter}/_"><mega-icon style="float: right">fullscreen</mega-icon></a>
              ${this._chapterCard.depends ? html`
                <div>
                  <b>Voraussetzung für das Kapitel ${this._chapter}:</b> ${this._chapterCard.depends.map((depend, j) => html`
                    <a href="#browser/${this._subject}/${depend}">${depend}</a>&nbsp;
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
          ${this.lines.map((line, i) => html`
            <div class="scrollpane line">
              ${line.cards.map((card, j) => html`
                <kmap-summary-card .subject="${this._subject}" .chapter="${this._chapter}" .card="${card}"></kmap-summary-card>
              `)}
            </div>
          `)}
        </div>
        <div class="page topic" ?active="${this.page === 'topic'}" @rated="${this._rated}">
            <kmap-knowledge-card .subject="${this._subject}" .chapter="${this._chapter}" .card="${this.topicCard}"></kmap-knowledge-card>
        </div>
        <div class="page search" ?active="${this.page === 'search'}">
            search
        </div>
    `;
  }

  static get properties() {
    return {
      _userid: {type: String},
      active: {type: Boolean, observer: 'activeChanged'},
      dataPath: {type: String},
      routeSubject: {type: String},
      routeChapter: {type: String},
      routeTopic: {type: String},
      _layers: {type: Array},
      _subject: {type: String},
      _chapter: {type: String},
      _chapterCard: {type: Object},
      topic: {type: String},
      topicCard: {type: Object},
      board: {type: Object},
      chapterLine: {type: Array},
      lines: {type: Array},
      page: {type: String},
      mapHeight: {type: Number},
      mapScroll: {type: Number},
      detailCard: {type: Object},
      search: {type: String, observer: 'searchChanged'},
      filtered: {type: Array, observer: 'filteredChanged'},
    };
  }

  constructor() {
    super();
    this.chapterLine = null;
    this.lines = [];
    this.topicCard = {};
    this._layers = [];
  }

  viewport() {
    return window.innerHeight - 64;
  }

  adapt(height) {
    if (height !== this.mapHeight) {
      //console.log("adapt " + height);
      this.mapHeight = height;
      this.$$('#pages').style.height = height + "px";
    }
  }

  mapChange() {
    this.adapt(Math.max(this.$$('#board').clientHeight, this.viewport()));
  }

  filterChange() {
    this.adapt(Math.max(this.$$('#filter').clientHeight, this.viewport()));
  }

  detailChange() {
    this.adapt(Math.max(this.$$('#detail').clientHeight, this.viewport()));
    console.log("dom change");
  }

  searchChanged(search) {
    if (search === null || search.length === 0) {
      this.filtered = null;
    } else if (search.length >= 3) {
      this.$$('#searchLoader').params = {search: search};
    } else {
      this.filtered = [];
    }
  }

  filteredChanged(filtered) {
    if (filtered === null) {
      if (!this.topic) {
        this.page = 0;
        this.mapChange();
        window.scrollTo(0, this.mapScroll);
      } else {
        this.page = 1;
        this.detailChange();
      }
    } else {
      this.page = 2;
      this.filterChange();
    }
  }

  _rated(e) {
    var detail = e.detail;
    if (this._userid) {
      console.log("save " + detail.key + " := " + detail.rate);
      store.dispatch(storeState({userid: this._userid, subject: this.routeSubject}, detail.key, detail.rate));
    } else {
      console.log("cannot save " + detail.key + " := " + detail.rate);
      store.dispatch(showMessage("Achtung! Deine Eingaben können nur gespeichert werden, wenn Du angemeldet bist!"));
    }
  }

  stateChanged(state) {
    this._userid = state.app.userid;
    if (this.dataPath !== state.app.dataPath) {
      this.dataPath = state.app.dataPath;

      let changeMap = false;

      if (state.app.dataPath.length > 0 && this.routeSubject !== state.app.dataPath[0]) {
        this.routeSubject = state.app.dataPath[0];
        changeMap = true;
      }
      if (state.app.dataPath.length > 1 && this.routeChapter !== state.app.dataPath[1]) {
        this.routeChapter = state.app.dataPath[1];
        changeMap = true;
      }
      if (state.app.dataPath.length > 2)
        this.routeTopic = state.app.dataPath[2];
      else
        this.routeTopic = null;

      if (this.routeTopic) {
        this.page = "topic";
        store.dispatch(updateTitle(this.routeTopic));
      } else {
        this.page = "map";
        store.dispatch(updateTitle(this.routeChapter));
      }

      if (changeMap)
        store.dispatch(fetchMapIfNeeded(this.routeSubject, this.routeChapter));
    }

    if (state.maps.map) {
      this._chapterCard = state.maps.map.chapterCard;
      this._subject = state.maps.map.subject;
      this._chapter = state.maps.map.chapter;
      this._module = state.maps.map.module;

      let lines = state.maps.map.lines;
      if (lines[0].cards[0].row === -1) {
        this.chapterLine = lines[0];
        this.lines = lines.slice(1);
      }
      else {
        this.chapterLine = null;
        this.lines = lines;
      }
    }
    else {
      this._subject = "";
      this._chapter = "";
      this.lines = [];
    }

    if (this.routeTopic === "_") {
      this.topicCard = this._chapterCard;
    }
    else if (this.routeTopic && this.lines) {
      let lala = {};
      for (let line of this.lines) {
        for (let card of line.cards) {
          if (card.topic === this.routeTopic)
            lala = card;
        }
      }
      this.topicCard = lala;
    }

    this._layers = state.app.layers;
  }

  activeChanged(active) {
    if (active && this.routeSubject && this.routeChapter)
      store.dispatch(fetchMapIfNeeded(this.routeSubject, this.routeChapter));
  }
}

customElements.define('kmap-browser', KMapBrowser);
