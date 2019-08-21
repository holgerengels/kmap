import {css, html, LitElement} from 'lit-element';
import {connect} from "pwa-helpers/connect-mixin";
import {store} from "../store";
import {logout, unsetTestForEdit, showMessage} from "../actions/app";
import {handleErrors} from "../actions/fetchy";
import {config} from "../config";
import {colorStyles, fontStyles} from "./kmap-styles";
import 'mega-material/button';
import 'mega-material/dialog';
import 'mega-material/list';
import './kmap-summary-card-summary';
import './kmap-knowledge-card-description';
import {loadSets, selectSet} from "../actions/content-sets";
import {loadSet, saveTest} from "../actions/test-editor";

class KMapTestEditorEditDialog extends connect(store)(LitElement) {

  static get styles() {
    // language=CSS
    return [
      fontStyles,
      colorStyles,
      css`
form {
  width: 510px;
}
textarea {
  width: 100%;
  resize: vertical;
}
.preview {
  height: 52px;
  width: 100%;
  pointer-events: none;
  text-align: left;
}
.preview-scroller {
  position: absolute;
  top: -20px;
  left: 24px;
  right: 24px;
  max-height: 300px;
  overflow-y: auto;
  pointer-events: all;
  border-radius: 3px;
  box-shadow: 0 2px 2px 0 rgba(0, 0, 0, 0.14),
      0 1px 5px 0 rgba(0, 0, 0, 0.12),
      0 3px 1px -2px rgba(0, 0, 0, 0.2);
}
kmap-test-card {
  position: absolute;
  top: -20px;
  left: 24px;
  width: 300px;
  display: block;
  box-sizing: border-box;
  background-color: var(--color-lightgray);
  border-radius: 3px;
  box-shadow: 0 2px 2px 0 rgba(0, 0, 0, 0.14),
      0 1px 5px 0 rgba(0, 0, 0, 0.12),
      0 3px 1px -2px rgba(0, 0, 0, 0.2);
}
    `];
  }

  render() {
    // language=HTML
    return html`
<mwc-dialog id="editDialog" title="Editor">
${this._test ? html`
  <form @focus="${this._focus}">
    <div class="field">
      <label for="chapter">Kapitel</label>
      <select required @change="${e => this._chapter = e.target.value}">
        <option>- - -</option>
        ${this._chapters.map((chapter, i) => html`<option>${chapter}</option>`)}
      </select>
      <label for="topic">Thema</label>
      <select required @change="${e => this._topic = e.target.value}">
        <option>- - -</option>
        ${this._topics.map((topic, i) => html`<option>${topic}</option>`)}
      </select>
    </div>
    <div class="field">
      <label for="key"></label>
      <input id="key" type="text" placeholder="Titel ..." .value="${this._key}" @change="${e => this._key = e.target.value}"/>
      <label for="level"></label>
      <input id="level" type="number" placeholder="Level" inputmode="numeric" min="1" max="3" step="1" .value="${this._level}" @change="${e => this._level = e.target.value}"/>
    </div>
    <div class="field">
      <label for="balance">Layout Verhältnis Frage zu Antwort: ${this._balance} zu ${6 - this._balance}</label>
      <input type="range" id="balance" name="balance" min="0" max="5" value="${this._balance}" @change="${e => this._balance = e.target.value}">
    </div>
    <div class="field">
      <label for="question">Frage</label>
      <textarea id="question" rows="5" @keyup="${this._setQuestion}" @focus="${this._focus}" @blur="${this._focus}">${this._question}</textarea>
      <label for="answer">Antwort</label>
      <textarea id="answer" rows="5" @keyup="${this._setAnswer}" @focus="${this._focus}" @blur="${this._focus}">${this._answer}</textarea>
    </div>
    <div class="field values">
      <label for="attachments">Werte (Checkboxen: true/false, Dezimalzahlen mit Punkt statt Komma)</label>
      ${this._values.map((value, i) => html`<input type="text" .value="${this._values[i]}" @change="${e => this._values[i] = e.target.value}"/>`)}
    </div>
  </form>` : ''}
  <mwc-icon-button slotd="action" icon="folder_open" title="Cloud Verzeichnis öffnen" @click=${this._createDirectory}></mwc-icon-button>
  <mwc-button class="button" slotd="action" primary @click=${this._save}>Speichern</mwc-button>
  <mwc-button class="button" slotd="action" @click=${this._cancel}>Abbrechen</mwc-button>
  <div class="preview" slot="action">
    <label style="text-align: center; display: block">» Preview «</label>
    ${this._showPreview ? html`<kmap-test-card hideHeader
                                .subject="${this._subject}"
                                .chapter="${this._chapter}"
                                .topic="${this._topic}"
                                .level="${this._level}"
                                .balance="${this._balance}"
                                .question="${this._question}"
                                .answer="${this._answer}"
                                .num="1" .of="1"></kmap-test-card>` : ''}
  </div>
</mwc-dialog>
    `;
    }

  static get properties() {
    return {
      _userid: {type: String},
      _test: {type: Object},
      _subject: {type: String},
      _chapter: {type: String},
      _topic: {type: String},
      _key: {type: String},
      _level: {type: Number},
      _balance: {type: Number},
      _question: {type: String},
      _answer: {type: String},
      _values: {type: Array},
      _showPreview: {type: Boolean},
      _newSet: {type: Boolean},

      _chapters: {type: Array},
      _topics: {type: Array},
    };
  }

  constructor() {
    super();
    this._userid = '';
    this._test = null;
    this._subject = '';
    this._chapter = '';
    this._topic = '';
    this._key = '';
    this._level = 1;
    this._balance = 3;
    this._question = '';
    this._answer = '';
    this._values = [];
    this._setQuestion = this._debounce(this._setQuestion.bind(this), 1000);
    this._setAnswer = this._debounce(this._setAnswer.bind(this), 1000);
    this._showPreview = false;
    this._newSet = false;

    this._chapters = [];
    this._topics = [];
  }

  firstUpdated(changedProperties) {
    this._editDialog = this.shadowRoot.getElementById('editDialog');
  }

  updated(changedProperties) {
    if (changedProperties.has('_test') && this._test) {
      this._editDialog.open();

      this._subject  = this._test.subject;
      this._chapter  = this._test.chapter;
      this._topic    = this._test.topic;
      this._key      = this._test.key;
      this._balance  = this._test.balance;
      this._question = this._test.question;
      this._answer   = this._test.answer;
      this._values   = this._test.values || [];
      this._oldValues = [...this._values];
    }

    if (changedProperties.has('_subject'))
      this._loadChapters();

    if (changedProperties.has('_chapter'))
      this._loadTopics();

    if (changedProperties.has('_answer')) {
      let answer = this._answer;
      let valueCount =  answer ? answer.split(/<check/).length + answer.split(/<text/).length + answer.split(/<integer/).length + answer.split(/<decimal/).length - 4 : 0;
      if (this._values.length !== valueCount) {
        var newValues = [];
        newValues.push(... this._values);
        while (newValues.length > valueCount)
          newValues.pop();
        while (newValues.length < valueCount) {
          newValues.push(this._oldValues && this._oldValues.length > newValues.length ? this._oldValues[newValues.length] : "");
        }
        console.log(newValues);
        this._values = newValues;
      }
    }
  }

  stateChanged(state) {
    this._userid = state.app.userid;
    this._test = state.app.testForEdit;

    if (this._test) {
      if (!this._test.subject)
        this._test.subject = '';
      if (!this._test.chapter)
        this._test.chapter = '';
      if (!this._test.topic)
        this._test.topic = '';
      if (!this._test.key)
        this._test.key = '';
      if (!this._test.balance)
        this._test.balance = 3;
      if (!this._test.question)
        this._test.question = '';
      if (!this._test.answer)
        this._test.answer = '';
      if (!this._test.values)
        this._test.values = [];

      this._newSet = !state.contentSets.sets.includes({subject: this._test.subject, set: this._test.set});
    }
  }

  _loadChapters() {
    if (this._subject) {
      fetch(`${config.server}data?chapters=${this._subject}&subject=${this._subject}`, {
        method: "GET",
        mode: "cors",
        cache: "no-cache",
        credentials: "include",
        headers: {
          "Content-Type": "application/json; charset=utf-8",
        }
      })
        .then(handleErrors)
        .then(res => res.json())
        .then(chapters => this._chapters = chapters)
        .catch((error) => {
          store.dispatch(showMessage(error.message));
          if (error.message === "invalid session")
            store.dispatch(logout({userid: this._userid}));
        });
    }
    else
      this._chapters = [];
  }

  _loadTopics() {
    if (this._chapter) {
      fetch(`${config.server}data?topics=${this._chapter}&subject=${this._subject}`, {
        method: "GET",
        mode: "cors",
        cache: "no-cache",
        credentials: "include",
        headers: {
          "Content-Type": "application/json; charset=utf-8",
        }
      })
        .then(handleErrors)
        .then(res => res.json())
        .then(topics => this._topics = topics)
        .catch((error) => {
          store.dispatch(showMessage(error.message));
          if (error.message === "invalid session")
            store.dispatch(logout({userid: this._userid}));
        });
    }
    else
      this._topics = [];
  }

  _focus(e) {
    if (e.type === "blur") {
      this._showPreview = false;
    }
    else if (e.type === "focus") {
      if (e.path[0].id === "question" || e.path[0].id === "answer" || e.path[0].id === "balance")
        this._showPreview = true;
    }
  }

  _save() {
    this._editDialog.close();

    this._test.subject  = this._subject;
    this._test.chapter  = this._chapter;
    this._test.topic    = this._topic;
    this._test.key      = this._key;
    this._test.balance  = this._balance;
    this._test.question = this._question;
    this._test.answer   = this._answer;
    this._test.values   = this._values;

    let test = this._test;
    console.log(test);

    store.dispatch(saveTest(test.subject, test.set, test))
      .then(store.dispatch(unsetTestForEdit()))
      .then(lala => window.setTimeout(function(test, newSet) {
        if (newSet) {
          store.dispatch(loadSets())
            .then(store.dispatch(selectSet({ subject: test.subject, set: test.set})));
        }
        else
          store.dispatch(loadSet(test.subject, test.set));
      }.bind(undefined, test, this._newSet), 1000));
  }

  _cancel() {
    this._editDialog.close();
    store.dispatch(unsetTestForEdit());
  }

  _setQuestion() {
    this._question = this.shadowRoot.getElementById('question').value;
  }

  _setAnswer() {
    this._answer = this.shadowRoot.getElementById('answer').value;
  }

  _debounce(func, wait, immediate) {
    var timeout;
    return function (...args) {
      var context = this;
      var later = function () {
        timeout = null;
        if (!immediate) func.apply(context, args);
      };
      var callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) func.apply(context, args);
    }
  }

  _createDirectory() {
    fetch(`${config.server}tests?directory=${this._subject}/${this._chapter}/${this._topic}`, {
      method: "GET",
      mode: "cors",
      cache: "no-cache",
      credentials: "include",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
      }
    })
      .then(handleErrors)
      .then(res => res.json())
      .then(data => {
        console.log(data.data);
        window.open(data.data, '_blank');
      })
      .catch((error) => {
        store.dispatch(showMessage(error.message));
        if (error.message === "invalid session")
          store.dispatch(logout({userid: this._userid}));
      });
  }
}

window.customElements.define('kmap-test-editor-edit-dialog', KMapTestEditorEditDialog);
