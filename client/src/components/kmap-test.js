import {LitElement, html, css} from 'lit-element';
import {updateTitle, showMessage} from "../actions/app";
import {store} from "../store";
import {fetchSubjectsIfNeeded, fetchChaptersIfNeeded, fetchTreeIfNeeded, fetchTestsIfNeeded} from "../actions/tests";
import {connect} from "pwa-helpers/connect-mixin";
import {storeState} from "../actions/states";

import {colorStyles, fontStyles} from "./kmap-styles";
import '@material/mwc-button';
import '@material/mwc-icon';
import '@material/mwc-icon-button';
import '@material/mwc-formfield';
import '@material/mwc-slider';
import '@material/mwc-top-app-bar';
import './kmap-test-card';
import './kmap-test-result-card';
import './kmap-test-editor-scroller';

class KmapTest extends connect(store)(LitElement) {
  static get styles() {
    // language=CSS
    return [
      fontStyles,
      colorStyles,
      css`
:host {
  display: contents;
}
.page {
  display: none;
  transition: opacity .8s;
  padding: 8px;
}
.page[active] {
  display: block;
}
kmap-test-editor-scroller {
    position: absolute;
    top: 348px;
    left: 0;
    right: 0;
    bottom: 0;
}
[hidden] {
    display: none;
}
mega-surface {
  padding: 8px;
  box-shadow: var(--elevation);
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
select {
  border: none;
  border-bottom: 2px solid var(--color-mediumgray);
  padding: 12px;
  background-color: var(--color-lightgray);
  outline: none;
}
select:focus {
  border-bottom-color: var(--color-primary);
}
option {
  font-size:16px;
  background-color:#ffffff;
}
      `
    ];
  }

  render() {
    // language=HTML
    return html`
      <mwc-top-app-bar id="bar" dense>
        <mwc-icon-button icon="menu" slot="navigationIcon" @click="${e => this._fire('toggleDrawer')}"></mwc-icon-button>
        <div slot="title">Test</div>
        <kmap-login-button slot="actionItems" @lclick="${e => this._fire('login')}"></kmap-login-button>
      </mwc-top-app-bar>

<div id="start" class="page" ?active="${this._page === 'start'}">
  <mega-surface style="--elevation: var(--elevation-01)">
    <label section>Thema auswählen</label>
    <br/><br/>
    <div class="mdc-elevation--z1">
      <mwc-formfield alignend>
        <select required @change="${e => this.subject = e.target.value}">
          <option value="">Fach</option>
          ${this.subjects.map((subject, j) => html`<option value="${subject}">${subject}</option>`)}
        </select>
      </mwc-formfield>
      ${this.arrangedChapters ? html`
        <mwc-formfield alignend>
          <select required @change="${e => this.chapter = e.target.value.split(".").pop()}">
            <option value="">Kapitel</option>
            ${this.arrangedChapters.map((chapter, j) => html`<option value="${chapter}">${chapter.replace(".", " - ")}</option>`)}
          </select>
        </mwc-formfield>
      `
      : html`
        <label class="secondary" style="vertical-align: sub; padding-left: 16px">Zu diesem Fach gibt es noch keine Aufgaben</label>
      `}
    </div>
    <br/><br/>
    <label>Anzahl Aufgaben</label>
    <br/><br/>
    <div>
      <span style="vertical-align: top; display: inline-block; width: 36px">${this._number}</span>
      <mwc-slider id="slider" ?disabled="${!this._allTests || this._allTests.length === 0}" style="display: inline-block" class="form" value="${this._number}" discrete="" markers="" step="3" min="3" max="${this._maxNumber}" @MDCSlider:change=${e => this._number = e.target.value}></mwc-slider>
    </div>
    <mwc-button @click="${this._start}" ?disabled="${!this._allTests || this._allTests.length === 0}">Starten</mwc-button>
  </mega-surface>
</div>
<div id="tests" class="page" ?active="${this._page === 'tests'}">
  <div>
    ${this._currentTest ? html`
      <kmap-test-card id="test-card" @next="${this._next}"
        .subject="${this.subject}"
        .chapter="${this._currentTest.chapter}"
        .topic="${this._currentTest.topic}"
        .num="${this._currentIndex}" of="${this._number}"
        .level="${this._currentTest.level}"
        .question="${this._currentTest.question}"
        .answer="${this._currentTest.answer}"
        .values="${this._currentTest.values}"
        .balance="${this._currentTest.balance}"
        showActions></kmap-test-card>`
      : ''}
  </div>
</div>
<div id="result" class="page" ?active="${this._page === 'result'}">
  <mega-surface style="--elevation: var(--elevation-01)">
    ${this.summary ? html`
      <label>Ergebnis</label>
      <br/><br/>
      <label class="secondary">${this.summary.achievedPoints} von ${this.summary.achievablePoints} Punkten</label>
      <br/><br/>
      <label ?hidden="${this.summary.hasCards}">Top! Das hast Du drauf!</label>
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
    <mwc-button @click="${this._back}">Zurück zum Start</mwc-button>
  </mega-surface>
</div>
  ${this._layers.includes('editor') ? html`
    <kmap-test-editor-scroller></kmap-test-editor-scroller>
  ` : ''}
    `;
  }

  static get properties() {
    return {
      _userid: {type: String},
      active: {type: Boolean},
      _page: {type: String},
      subjects: {type: Array},
      subject: {type: String},
      chapters: {type: Array},
      tree: {type: Object},
      arrangedChapters: {type: Array},
      chapter: {type: String },
      _tests: {type: Array},
      _allTests: {type: Array},
      topics: {type: Array},
      _maxNumber: {type: Number},
      _number: {type: Number},
      results: {type: Array},
      summary: {type: Object},
      _currentIndex: {type: Number},
      _currentTest: {type: Object},
      _layers: {type: Array},
    };
  }

  constructor() {
    super();
    this._layers = [];
    this._page = "start";
    this._number = 3;
    this._maxNumber = 3;
    this._tests = [];
    store.dispatch(fetchSubjectsIfNeeded());
  }

  firstUpdated(changedProperties) {
    store.dispatch(updateTitle("Test"));
  }

  updated(changedProperties) {
    if (changedProperties.has("_page")) {
      let bar = this.shadowRoot.getElementById('bar');
      let page = this.shadowRoot.getElementById(this._page);
      bar.scrollTarget = page;

      switch (this._page) {
        case 'start':
        case 'tests':
          store.dispatch(updateTitle("Test"));
          break;
        case 'result':
          store.dispatch(updateTitle("Testergebnis"));
          break;
      }
    }

    if (changedProperties.has("active") && this.active)
      store.dispatch(fetchSubjectsIfNeeded());

    if (changedProperties.has("subject")) {
      store.dispatch(fetchChaptersIfNeeded(this.subject));
      store.dispatch(fetchTreeIfNeeded(this.subject));
      this.chapter = undefined;
      this.chapters = [];
      this.arrangedChapters = [];
      this._allTests = undefined;
    }

    if ((changedProperties.has("chapters") || changedProperties.has("tree")) && this.chapters.length > 0 && this.tree.length > 0) {
      this.arrange(this.chapters, this.tree);
    }

    if (changedProperties.has("chapter")) {
      if (this.chapter)
        store.dispatch(fetchTestsIfNeeded(this.subject, this.chapter));
      else
        this._allTests = undefined;
    }
  }

  stateChanged(state) {
    this._userid = state.app.userid;
    this._layers = state.app.layers;

    if (this.subjects !== state.tests.subjects) {
      this.subjects = state.tests.subjects;
    }
    if (!this.subjects)
      this.subjects = [];

    if (this.chapters !== state.tests.chapters) {
      this.chapters = state.tests.chapters;
    }
    if (!this.chapters)
      this.chapters = [];

    if (this.tree !== state.tests.tree) {
      this.tree = state.tests.tree;
    }
    if (!this.tree)
      this.tree = {};

    if (this._allTests !== state.tests.tests) {
      this._allTests = state.tests.tests;

      var topics = [];
      for (var test of this._allTests) {
        if (!topics.includes(test.chapter + "." + test.topic))
          topics.push(test.chapter + "." + test.topic);
      }
      this.topics = topics;
      this._maxNumber = this._allTests.length - this._allTests.length % 3;
    }
  }

  arrange(chapters, tree) {
    if (!chapters || !tree)
      return;
    var arrangedChapters = [];
    for (var path of tree) {
      var parts = path.split(".");
      var last = parts[parts.length - 1];
      if (chapters.includes(last))
        arrangedChapters.push(path);
    }
    this.arrangedChapters = arrangedChapters;
  }

  _compose(allTests, number) {
    if (this.topics.length === 0)
      return;

    var topics = [];
    topics.push(...this.topics);
    topics.sort(function () {
      return 0.5 - Math.random()
    });
    //topics = topics.slice(0, number / 3);

    var map = new Map();
    for (var test of this._allTests) {
      var key = test.chapter + "." + test.topic;
      var list = map.get(key);
      if (!list) {
        list = [];
        map.set(key, list);
      }
      list.push(test);
    }

    var tests = [];
    for (var i = 0; i < number / 3 && topics.length > 0; i++) {
      var r = Math.floor(Math.random() * Math.floor(map.size));
      var key = topics[r];
      var list = map.get(key);
      list.sort(function () {
        return 0.5 - Math.random()
      });
      tests.push(list.pop());
      tests.push(list.pop());
      tests.push(list.pop());
      if (list.length < 3) {
        map.delete(key);
        topics.splice(topics.indexOf(key), 1);
      }
    }
    for (var test of tests) {
      if (!test.balance)
        test.balance = 4;
    }
    this._tests = tests;
  }

  _start(e) {
    this._compose(this._allTests, this._number);
    this._currentIndex = 0;
    this._currentTest = this._tests[0];
    this._page = "tests";
    this.results = [];
  }

  _back(e) {
    this._page = "start";
    let testCard = this.shadowRoot.getElementById('test-card');
    testCard.clear();
  }

  _next(e) {
    let detail = e.detail;
    console.log(detail);
    this.results.push(detail);

    this._currentIndex++;
    if (this._currentIndex < this._tests.length) {
      this._currentTest = this._tests[this._currentIndex];
      let testCard = this.shadowRoot.getElementById('test-card');
      testCard.clear();
    }
    else {
      this._page = "result";
      var points = 0;
      var cards = [];
      var map = new Map();
      for (let result of this.results) {
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

  _fire(name) {
    this.dispatchEvent(new CustomEvent(name, {bubbles: true, composed: true}));
  }
}
customElements.define('kmap-test', KmapTest);
