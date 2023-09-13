import {html, css} from 'lit';
import {customElement, state} from 'lit/decorators.js';
import {Connected} from "./connected";
import {State, store} from "../store";

import '@material/mwc-button';
import '@material/mwc-icon';
import '@material/mwc-icon-button';
import './kmap-test-result-card';
import {resetStyles, colorStyles, fontStyles} from "./kmap-styles";
import {TestResult} from "../models/tests";

interface Summary {
  achievedPoints: string,
  achievablePoints: number,
  cards: TestResult[],
  hasCards: boolean,
}

@customElement('kmap-test-results')
export class KmapTestResults extends Connected {
  @state()
  private _userid: string = '';

  @state()
  private _results: TestResult[] = [];

  @state()
  private _summary?: Summary = undefined;

  mapState(state: State) {
    return {
      _userid: state.app.userid,
      _results: state.tests.results,
    };
  }

  willUpdate(changedProperties) {
    if (changedProperties.has("_results"))
      this._buildSummary();
  }

  _buildSummary() {
    var points = 0;
    var cards: TestResult[] = [];
    var map = new Map();
    for (let result of this._results) {
      if (result.attempts > 0)
        points += Math.pow(2, -result.attempts + 1);
      if (result.attempts !== 1)
        cards.push({
          subject: result.subject,
          chapter: result.chapter,
          topic: result.topic,
          attempts: 0,
          num: 0,
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
    var newCards: TestResult[] = [];
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
      card.state = 4 - Math.round(card.num * 3 / num);
      if (card.state < 1)
        card.state = 1;
    }
    cards = newCards;

    this._summary = {
      achievedPoints: points.toLocaleString('DE'),
      achievablePoints: this._results.length,
      cards: cards,
      hasCards: cards.length !== 0,
    };
  }

  _rated(e) {
    var detail = e.detail;
    if (this._userid) {
      console.log("save " + detail.key + " := " + detail.rate);
      store.dispatch.rates.store({subject: detail.subject, id: detail.key, rate: detail.rate});
    }
    else {
      console.log("cannot save " + detail.key + " := " + detail.rate);
      store.dispatch.shell.showMessage("Achtung! Deine Eingaben können nur gespeichert werden, wenn du angemeldet bist!");
    }
  }

  static get styles() {
    // language=CSS
    return [
      resetStyles,
      fontStyles,
      colorStyles,
      css`
        :host {
          display: flex;
          flex-direction: column;
          padding: 16px;
        }
        .result-cards {
          display: flex;
          flex-wrap: wrap;
        }
        kmap-test-result-card {
          margin-right: 16px;
        }
        kmap-test-result-card:last-child {
          margin-right: 0;
        }
        mwc-icon {
          vertical-align: middle;
          --mdc-icon-size: 1.2em;
        }
      `];
  }

  render() {
    // language=HTML
    return html`
    ${this._summary ? html`
      <label>Ergebnis</label>
      <label class="secondary">${this._summary.achievedPoints} von ${this._summary.achievablePoints} Punkten</label>
              <br/>
      <label ?hidden="${this._results.length > 0 && this._summary.hasCards}">Top! Das hast du drauf!</label>
      <label ?hidden="${!this._summary.hasCards}">Folgende Themen solltest du dir nochmal anschauen!</label>
        <br/>
      <div class="result-cards" ?hidden="${!this._summary.hasCards}" @rated="${this._rated}">
        ${this._summary.cards.map((card) => html`
          <kmap-test-result-card .card="${card}" .state="${card.state}">
            <a slot="actions-fullscreen" href="/app/browser/${card.subject}/${card.chapter}/${card.topic}"><mwc-icon>open-in-new"></mwc-icon></a>
          </kmap-test-result-card>
        `)}
      </div>
        <br/>
      <label class="secondary" ?hidden="${!this._summary.hasCards}">Wenn du auf die
        <svg viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet" focusable="false" style="pointer-events: none; display: inline; width: 16px; height: 16px;"><g><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"></path></g></svg>
        klickst, wird die jeweilige Bewertung entsprechend als Selbsteinschätzung übernommen.
      </label>
      <label class="secondary" ?hidden="${!this._summary.hasCards}">Wenn du auf den Titel der Ergebniskarte klickst, kommst Du zur Wissenskarte.
      </label>
      <br/><br/>`
      : ''}
  </div>
    `;
  }
}
