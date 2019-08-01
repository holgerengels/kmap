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

class KMapBrowser extends connect(store)(LitElement) {
  static get styles() {
    // language=CSS
    return [
      css`
        .scrollpane {
          white-space: nowrap;
          display: block;
          -webkit-overflow-scrolling: touch;
          -webkit-background-clip: text;
          background-color: rgba(0, 0, 0, 0);
          transition: background-color .8s;
        }

        .scrollpane:hover {
          background-color: rgba(0, 0, 0, 0.18);
        }

        .scrollpane::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }

        .scrollpane::-webkit-scrollbar-track {
          display: none;
        }

        .scrollpane::-webkit-scrollbar-thumb {
          border-radius: 10px;
          background-color: inherit;
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

        .line {
          outline: none;
          overflow-x: scroll;
          display: flex;
          flex-direction: row;
          flex-wrap: nowrap;
          align-items: flex-start;
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
          margin-left: 6px;
          margin-right: 6px;
        }
      `];
  }

  render() {
    return html`
      <mwc-top-app-bar fixed>
        <mwc-icon-button icon="menu" slot="navigationIcon"></mwc-icon-button>
        <div slot="title">${this.subject}</div>
      </mwc-top-app-bar>
        <div class="page map" ?active="${this.page === 'map'}" @rated="${this._rated}">
            ${this.lines.map((line, i) => html`
                <div class="scrollpane line">
                    ${line.cards.map((card, j) => html`
                        <kmap-summary-card .subject="${this.subject}" .chapter="${this.chapter}" .card="${card}"></kmap-summary-card>
                    `)}
                </div>
            `)}
        </div>
        <div class="page topic" ?active="${this.page === 'topic'}" @rated="${this._rated}">
            <kmap-knowledge-card .subject="${this.subject}" .chapter="${this.chapter}" .card="${this.topicCard}"></kmap-knowledge-card>
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
      loadingSubject: {type: String},
      loadingChapter: {type: String},
      subject: {type: String},
      chapter: {type: String},
      topic: {type: String},
      topicCard: {type: Object},
      board: {type: Object},
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
    this.lines = [];
    this.topicCard = {};
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
      this.subject = state.maps.map.subject;
      this.chapter = state.maps.map.chapter;
      this.lines = state.maps.map.lines;
    } else {
      this.subject = "";
      this.chapter = "";
      this.lines = [];
    }

    if (this.routeTopic && this.lines) {
      let lala = {};
      for (let line of this.lines) {
        for (let card of line.cards) {
          if (card.name === this.routeTopic)
            lala = card;
        }
      }
      this.topicCard = lala;
    }
  }

  activeChanged(active) {
    if (active && this.routeSubject && this.routeChapter)
      store.dispatch(fetchMapIfNeeded(this.routeSubject, this.routeChapter));
  }
}

customElements.define('kmap-browser', KMapBrowser);
