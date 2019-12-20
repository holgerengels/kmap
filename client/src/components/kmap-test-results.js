import {LitElement, html, css} from 'lit-element';
import {updateTitle, showMessage} from "../actions/app";
import {store} from "../store";
import {connect} from "pwa-helpers/connect-mixin";
import {storeState} from "../actions/states";

import {colorStyles, elevationStyles, fontStyles} from "./kmap-styles";
import '@material/mwc-button';
import '@material/mwc-icon';
import '@material/mwc-icon-button';
import './kmap-test-result-card';

class KmapTestResults extends connect(store)(LitElement) {
  static get styles() {
    // language=CSS
    return [
      fontStyles,
      colorStyles,
      elevationStyles,
      css`
:host {
  display: contents;
}
.box {
  padding: 8px;
  background-color: whitesmoke;
}
.result-cards {
  display: flex;
  flex-wrap: wrap;
}
kmap-test-result-card {
  margin: 16px;
}
mwc-icon {
  vertical-align: middle;
  --mdc-icon-size: 1.2em;
}
      `
    ];
  }

  render() {
    // language=HTML
    return html`
  <div class="box elevation-01">
    ${this.summary ? html`
      <label>Ergebnis</label>
      <br/><br/>
      <label class="secondary">${this.summary.achievedPoints} von ${this._results.length} Punkten</label>
      <br/><br/>
      <label ?hidden="${this._results.length > 0 && this.summary.hasCards}">Top! Das hast Du drauf!</label>
      <label ?hidden="${!this.summary.hasCards}">Folgende Themen solltest Du dir nochmal anschauen!</label>
      <div class="result-cards" ?hidden="${!this.summary.hasCards}" @rated="${this._rated}">
        <br/>
        ${this.summary.cards.map((card, i) => html`
          <kmap-test-result-card .subject="${card.subject}" .chapter="${card.chapter}" .card="${card}" .state="${card.state}">
            <a slot="actions-fullscreen" href="#browser/${card.subject}/${card.chapter}/${card.topic}"><mwc-icon>open-in-new"></mwc-icon></a>
          </kmap-test-result-card>
        `)}
      </div>
      <br/>
      <label class="secondary" ?hidden="${!this.summary.hasCards}">Wenn Du auf die
        <svg viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet" focusable="false" style="pointer-events: none; display: inline; width: 16px; height: 16px;"><g><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"></path></g></svg>
        klickst, wird die jeweilige Bewertung entsprechend als Selbsteinschätzung übernommen.
      </label>
      <br/><br/>
      <label class="secondary" ?hidden="${!this.summary.hasCards}">Wenn Du auf
        <svg viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet" focusable="false" style="pointer-events: none; display: inline; width: 16px; height: 16px;"><g><path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"></path></g></svg>
        klickst, kommst Du zur Themenkarte.
      </label>
      <br/><br/>`
      : ''}
  </div>
    `;
  }

  static get properties() {
    return {
      _userid: {type: String},
      _tests: {type: Array},
      _number: {type: Number},
      _results: {type: Array},
      summary: {type: Object},
    };
  }

  constructor() {
    super();
    this._tests = [];
  }

  firstUpdated(changedProperties) {
  }

  updated(changedProperties) {
    if (changedProperties.has("_results"))
      this._summary();
  }

  stateChanged(state) {
    this._userid = state.app.userid;
    this._results = state.tests.results;
  }

  _summary() {
    var points = 0;
    var cards = [];
    var map = new Map();
    for (let result of this._results) {
      if (result.attempts > 0)
        points += Math.pow(2, -result.attempts + 1);
      if (result.attempts !== 1)
        cards.push({
          subject: this.subject,
          chapter: result.chapter,
          topic: result.topic,
        });
      var key = result.chapter + "." + result.topic;
      var num = map.get(key);
      if (!num) {
        num = 0;
      }
      num++;
      map.set(key, num);
    }

    cards.sort(function (a, b) {
      return (a.chapter + "." + a.topic).localeCompare(b.chapter + "." + b.topic)
    });
    var last;
    var newCards = [];
    for (let card of cards) {
      var key = card.chapter + "." + card.topic;
      if (last === key)
        newCards[newCards.length - 1].num++;
      else {
        card.num = 1;
        newCards.push(card);
      }
      last = key;
    }
    for (let card of newCards) {
      var num = map.get(card.chapter + "." + card.topic);
      card.wrong = card.num;
      card.correct = num - card.num;
      card.state = 4 - (card.num * 3 / num);
      if (card.state < 1)
        card.state = 1;
    }
    cards = newCards;

    this.summary = {
      achievedPoints: points.toLocaleString('DE'),
      achievablePoints: this._tests.length,
      cards: cards,
      hasCards: cards.length !== 0,
    };
  }

  _rated(e) {
    var detail = e.detail;
    if (this._userid) {
      console.log("save " + detail.key + " := " + detail.rate);
      store.dispatch(storeState({userid: this._userid, subject: this.subject}, detail.key, detail.rate));
    }
    else {
      console.log("cannot save " + detail.key + " := " + detail.rate);
      store.dispatch(showMessage("Achtung! Deine Eingaben können nur gespeichert werden, wenn Du angemeldet bist!"));
    }
  }
}
customElements.define('kmap-test-results', KmapTestResults);
