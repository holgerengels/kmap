import {LitElement, html, css} from 'lit-element';
import {connect} from 'pwa-helpers/connect-mixin.js';
import {store} from "../store";
import {updateTitle, showMessage} from "../actions/app";
import {fetchMapIfNeeded, unselectSummaryCard} from "../actions/maps";
import {storeState} from "../actions/states";

import {colorStyles, fontStyles} from "./kmap-styles";
import '@material/mwc-icon';
import '@material/mwc-icon-button';
import '@material/mwc-top-app-bar';
import './kmap-login-button';
import './kmap-summary-card';
import './kmap-knowledge-card';
import './kmap-browser-chapter-editor';

const _standalone = (window.matchMedia('(display-mode: standalone)').matches) || (window.navigator.standalone) || document.referrer.includes('android-app://');

class KMapBrowser extends connect(store)(LitElement) {
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
    margin: 8px 6px;
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
              <a href="#browser/${this._subject}/${this._chapter}/_"><mwc-icon style="float: right">fullscreen</mwc-icon></a>
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
          ${this._lines.map((line, i) => html`
            <div class="scrollpane">
              ${line.cards.map((card, j) => html`
                <kmap-summary-card .subject="${this._subject}" .chapter="${this._chapter}" .card="${card}" ?faded="${this._faded}" key="${card.topic}"></kmap-summary-card>
              `)}
            </div>
          `)}
        </div>
        <div id="topic" class="page topic" ?active="${this._page === 'topic'}" @rated="${this._rated}">
            <kmap-knowledge-card .subject="${this._subject}" .chapter="${this._chapter}" .card="${this.topicCard}"></kmap-knowledge-card>
        </div>
        <div id="search" class="page search" ?active="${this._page === 'search'}">
            search
        </div>
    `;
  }

  static get properties() {
    return {
      _userid: {type: String},
      active: {type: Boolean, observer: 'activeChanged'},
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
      _map: {type: Object},
      _chapterLine: {type: Array},
      _lines: {type: Array},
      _page: {type: String},
      mapHeight: {type: Number},
      mapScroll: {type: Number},
      detailCard: {type: Object},
      search: {type: String, observer: 'searchChanged'},
      filtered: {type: Array, observer: 'filteredChanged'},
      _loadFetching: {type: Boolean},
      _faded: {type: Boolean},
    };
  }

  constructor() {
    super();
    this._chapterLine = null;
    this._lines = [];
    this.topicCard = {};
    this._layers = [];
    this._loadFetching = false;
    this._faded = true;
  }

  updated(changedProperties) {
    if (changedProperties.has('_page')) {
      let bar = this.shadowRoot.getElementById('bar');
      let page = this.shadowRoot.getElementById(this._page);
      bar.scrollTarget = page;
    }

    if (changedProperties.has('routeChapter') || changedProperties.has('routeTopic')) {
      this._page = this.routeTopic ? "topic" : "map";
      store.dispatch(updateTitle(this.routeTopic ? this.routeTopic : this.routeChapter));
    }
    if (changedProperties.has('routeSubject') || changedProperties.has('routeChapter')) {
      store.dispatch(fetchMapIfNeeded(this.routeSubject, this.routeChapter));
    }
    if (changedProperties.has('routeTopic') || changedProperties.has('_chapterCard') || changedProperties.has('_lines')) {
      if (this.routeTopic === "_") {
        this.topicCard = this._chapterCard;
      }
      else if (this.routeTopic && this._lines) {
        let lala = {};
        for (let line of this._lines) {
          for (let card of line.cards) {
            if (card.topic === this.routeTopic)
              lala = card;
          }
        }
        this.topicCard = lala;
      }

      if (this.routeTopic && !changedProperties.get("routeTopic")) {
        console.log("animate");
        let nodes = this.shadowRoot.querySelectorAll('kmap-summary-card[key="' + this.routeTopic + '"]');
        if (nodes.length !== 0) {
          let scard = nodes[0];
          this._animFrom = scard.getBoundingClientRect();
          console.log(this._animFrom);
        }
      }
    }
    if (changedProperties.has("_page") && this._page === 'topic' && this._animFrom) {
      let that = this;
      setTimeout(function () {
        let kcard = that.shadowRoot.querySelectorAll('kmap-knowledge-card')[0];
        that._animTo = kcard.getBoundingClientRect();
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
          that._animFrom = undefined;
          that._animTo = undefined;
        });
      });
    }
    if (changedProperties.has("_map")) {
      store.dispatch(unselectSummaryCard());

      if (this._map) {
        this._chapterCard = this._map.chapterCard;
        this._subject = this._map.subject;
        this._chapter = this._map.chapter;

        let lines = this._map.lines;
        if (lines[0].cards[0].row === -1) {
          this._chapterLine = lines[0];
          this._lines = lines.slice(1);
        }
        else {
          this._chapterLine = null;
          this._lines = lines;
        }
      }
      else {
        this._subject = "";
        this._chapter = "";
        this._lines = [];
      }
    }
    if (changedProperties.has("_loadFetching")) {
      if (!this._loadFetching) {
        let that = this;
        setTimeout(function () {
          that._faded = that._loadFetching;
        }, 100);
      }
    }
  }

  stateChanged(state) {
    this._userid = state.app.userid;

    if (state.app.dataPath.length > 0)
      this.routeSubject = state.app.dataPath[0];
    else
      console.log("ERROR: malformed datapath - no subject");

    if (state.app.dataPath.length > 1)
      this.routeChapter = state.app.dataPath[1];
    else
      console.log("ERROR: malformed datapath - no chapter");

    this.routeTopic = state.app.dataPath.length > 2 ? state.app.dataPath[2] : null;

    this._map = state.maps.map;
    this._layers = state.app.layers;
    this._loadFetching = state.maps.loadFetching;
  }

  /*
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
        this._page = 0;
        this.mapChange();
        window.scrollTo(0, this.mapScroll);
      } else {
        this._page = 1;
        this.detailChange();
      }
    } else {
      this._page = 2;
      this.filterChange();
    }
  }
   */

  _rated(e) {
    var detail = e.detail;
    if (this._userid) {
      console.log("save " + detail.key + " := " + detail.rate);
      store.dispatch(storeState({userid: this._userid, subject: this.routeSubject}, detail.key, detail.rate));
    }
    else {
      console.log("cannot save " + detail.key + " := " + detail.rate);
      store.dispatch(showMessage("Achtung! Deine Eingaben können nur gespeichert werden, wenn Du angemeldet bist!"));
    }
  }

  activeChanged(active) {
    if (active && this.routeSubject && this.routeChapter)
      store.dispatch(fetchMapIfNeeded(this.routeSubject, this.routeChapter));
  }

  _fire(name) {
    this.dispatchEvent(new CustomEvent(name, {bubbles: true, composed: true}));
  }
}

customElements.define('kmap-browser', KMapBrowser);
