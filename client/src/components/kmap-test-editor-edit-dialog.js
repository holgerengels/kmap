import {css, html, LitElement} from 'lit-element';
import {connect} from "pwa-helpers/connect-mixin";
import {store} from "../store";
import {logout, unsetTestForEdit, showMessage} from "../actions/app";
import {handleErrors} from "../actions/fetchy";
import {loadSets, selectSet} from "../actions/content-sets";
import {loadSet, saveTest} from "../actions/test-editor";
import {config} from "../config";
import {colorStyles, fontStyles} from "./kmap-styles";

import '@material/mwc-button';
import '@material/mwc-icon-button';
import '@material/mwc-dialog';
import '@material/mwc-formfield';
import '@material/mwc-slider';
import '@material/mwc-textarea';
import '@material/mwc-textfield';
import './kmap-summary-card-summary';
import './kmap-knowledge-card-description';

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
mwc-icon-button, mwc-button {
  vertical-align: middle
}
.preview {
  position: static;
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
  top: 4px;
  left: 0px;
  width: 100%;
  display: block;
  box-sizing: border-box;
  background-color: var(--color-lightgray);
  border-radius: 3px;
  box-shadow: 0 2px 2px 0 rgba(0, 0, 0, 0.14),
      0 1px 5px 0 rgba(0, 0, 0, 0.12),
      0 3px 1px -2px rgba(0, 0, 0, 0.2);
}
select {
  border: none;
  border-bottom: 2px solid var(--color-mediumgray);
  padding: 12px 6px;
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
      `];
  }

  render() {
    // language=HTML
    return html`
<mwc-dialog id="editDialog" title="Editor">
${this._test ? html`
  <form @focus="${this._focus}" @keydown="${this._captureEnter}" @input="${this._checkValidity}">
    <mwc-formfield alignend="" label="Kapitel">
      <select required @change="${e => this._chapter = e.target.value}">
        <option value="">- - -</option>
        ${this._chapters.map((chapter, i) => html`<option value="${chapter}" ?selected="${chapter === this._chapter}">${chapter}</option>`)}
      </select>
      </mwc-formfield>
      <mwc-formfield alignend="" label="Thema">
      <select required @change="${e => this._topic = e.target.value}">
        <option value="">- - -</option>
        ${this._topics.map((topic, i) => html`<option value="${topic}" ?selected="${topic === this._topic}">${topic}</option>`)}
      </select>
    </mwc-formfield>
    <br/><br/>
    <mwc-textfield id="key" name="key" label="Titel" dense type="text" required .value="${this._key}" @change="${e => this._key = e.target.value}"></mwc-textfield>
    <mwc-textfield id="level" name="level" label="Level" dense type="number" inputmode="numeric" min="1" max="3" step="1" .value="${this._level}" @change="${e => this._level = e.target.value}"></mwc-textfield>
    <br/>
    <mwc-formfield alignend="" label="Layout Verhältnis Frage zu Antwort: ${this._balance} zu ${6 - this._balance}   ">
      <mwc-slider id="balance" style="vertical-align:middle" .value="${this._balance}" discrete="" markers="" min="0" max="5" @MDCSlider:change=${e => this._balance = e.target.value}></mwc-slider>
    </mwc-formfield>
    <br/>
    <mwc-textarea id="question" placeholder="Frage" fullwidth rows="4" .value=${this._question} @keyup="${this._setQuestion}" @focus="${this._focus}" @blur="${this._focus}"></mwc-textarea>
    <mwc-textarea id="answer" placeholder="Antwort" required fullwidth rows="4" .value=${this._answer} @keyup="${this._setAnswer}" @focus="${this._focus}" @blur="${this._focus}"></mwc-textarea>

    <div class="field values">
      <label for="attachments">Werte (Checkboxen: true/false, Dezimalzahlen mit Punkt statt Komma)</label>
      ${this._values.map((value, i) => html`<input type="text" .value="${this._values[i]}" @change="${e => this._values[i] = e.target.value}"/>`)}
    </div>
  </form>` : ''}
  <div class="preview">
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

  <mwc-icon-button slot="secondaryAction" icon="folder_open" title="Cloud Verzeichnis öffnen" @click=${this._createDirectory}></mwc-icon-button>
  <mwc-button slot="secondaryAction" @click=${this._cancel}>Abbrechen</mwc-button>
  <mwc-button slot="primaryAction" @click=${this._save} ?disabled="${!this._valid}">Speichern</mwc-button>
</mwc-dialog>
    `;
    }

  static get properties() {
    return {
      _instance: {type: String},
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

      _valid: {type: Boolean},
    };
  }

  constructor() {
    super();
    this._instance = null;
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
      this._editDialog.open = true;

      this._subject  = this._test.subject;
      this._chapter  = this._test.chapter;
      this._topic    = this._test.topic;
      this._key      = this._test.key;
      this._balance  = this._test.balance;
      this._question = this._test.question;
      this._answer   = this._test.answer;
      this._values   = this._test.values || [];
      this._oldValues = [...this._values];

      this._editDialog.forceLayout();
      this._checkValidity();
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
    this._instance = state.app.instance;
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

      this._oldTest = { ...this._test };

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
          "X-Instance": this._instance,
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
          "X-Instance": this._instance,
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
      this._showPreview = true;
    }
    else if (e.type === "focus") {
      if (e.srcElement.id === "question" || e.srcElement.id === "answer" || e.srcElement.id === "balance")
        this._showPreview = true;
    }
  }

  _save() {
    this._editDialog.open = false;

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

    store.dispatch(saveTest(test.subject, test.set, this._oldTest, test))
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
    this._editDialog.open = false;
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
        "X-Instance": this._instance,
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

  _checkValidity() {
    let valid = true;
    for (const element of this.shadowRoot.querySelectorAll('[required]')) {
      valid = valid && element.checkValidity();
    }
    this._valid = valid;
  }

  _captureEnter(e) {
    if (!e.metaKey && e.key === "Enter")
      e.cancelBubble = true;
  }
}

window.customElements.define('kmap-test-editor-edit-dialog', KMapTestEditorEditDialog);
