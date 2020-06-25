import {LitElement, html, css, customElement, property} from 'lit-element';
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
import './svg-connector';
import {Line} from "../models/maps";
import {RoutingState} from "@captaincodeman/rdx-model";
import {Card} from "../models/types";
import {Connector} from "./svg-connector";
import {iconTest} from "./icons";
import {encode, urls} from "../urls";

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
  private _page: string = 'map';

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
      _subject: state.maps.subject,
      _chapter: state.maps.chapter,
      _lines: state.maps.lines,
      _chapterCard: state.maps.chapterCard,
      _loading: state.maps.loading,
      _testTopics: state.tests.topics ? state.tests.topics.topics : [],
      _selected: state.maps.selected,
      _highlighted: state.maps.selectedDependencies,
    };
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
      console.log("topic " + this._topic + " .. set topicCard " + this._topicCard);

      if (this._topicCard) {
        console.log('kmap-summary-card[key="' + this._topic + '"]');
        // @ts-ignore
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

    if (changedProperties.has("_topicCard") || changedProperties.has("_chapterCard")) {
      this._page = this._topicCard ? "topic" : "map";

      if (this._topicCard) {
        store.dispatch.shell.updateMeta({title: this._chapter, detail: this._topicCard.topic, description: this._topicCard.summary,
          image: this._topicCard.thumb ?
            `${urls.server}${encode("data", this._subject, this._chapter, this._topic, this._topicCard.thumb)}?instance=${this._instance}`
            : undefined,
          created: this._topicCard.created,
          modified: this._topicCard.modified,
          author: this._topicCard.author,
          keywords: [this._subject, this._chapter, this._topicCard.topic],
        });
      }
      else {
        store.dispatch.shell.updateMeta({
          title: this._chapter,
          description: this._chapterCard && this._chapterCard.summary ? this._chapterCard.summary : "Wissenslandkarte zum Kapitel " + this._chapter,
          keywords: [this._subject, ...this._topics || []],
        });
      }
    }

    if (changedProperties.has("_page") && this._page === 'topic' && this._animFrom) {
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
    /*
        this._chapterCard = this._map.chapterCard;
        let lines = this._map.lines;
        this._lines = lines[0].cards[0].row === -1 ? lines.slice(1) : lines;
    */

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
            <div class="chapter-line">
              <a href="/app/browser/${encode(this._subject, this._chapter, '_')}" title="Wissenskarte ${this._chapter}" alt="Wissenskarte ${this._chapter}"><mwc-icon style="float: right">fullscreen</mwc-icon></a>
              ${this._chapterCard.depends ? html`
                <div>
                  <b>Voraussetzung für das Kapitel ${this._chapter}:</b> ${this._chapterCard.depends.map((depend) => html`
                    <a href="/app/browser/${encode(this._subject, depend)}">${depend}</a>&nbsp;
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
                  <a href="/app/test/${encode(this._subject, this._chapter)}" class="tests" title="Aufgaben zum Kapitel ${this._chapter}" alt="Aufgaben zum Kapitel ${this._chapter}">${iconTest}</a>
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
        <main id="search" class="page search" ?active="${this._page === 'search'}">
            search
        </main>
    `;
  }
}
