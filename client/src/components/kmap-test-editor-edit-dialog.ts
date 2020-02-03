import {LitElement, html, css, customElement, property, query, queryAll} from 'lit-element';
import {connect} from '@captaincodeman/rdx';
import {State, store} from "../store";

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
import {Test} from "../models/tests";
import {Dialog} from "@material/mwc-dialog/mwc-dialog";
import {TextArea} from "@material/mwc-textarea/mwc-textarea";

@customElement('kmap-test-editor-edit-dialog')
export class KMapTestEditorEditDialog extends connect(store, LitElement) {
  @property()
  private _allTopics?: string[] = undefined;
  @property()
  private _chapters: string[] = [];
  @property()
  private _topics: string[] = [];

  @property()
  private _test?: Test = undefined;
  @property()
  private _question: string = '';
  @property()
  private _answer: string = '';
  @property()
  private _showPreview: boolean = false;

  @property()
  private _subject: string = '';
  @property()
  private _chapter: string = '';
  @property()
  private _topic: string = '';
  @property()
  private _key: string = '';
  @property()
  private _level: number = 1;
  @property()
  private _balance: number = 3;

  @property()
  private _oldValues: string[] = [];
  @property()
  private _values: string[] = [];

  @property()
  private _valid: boolean = true;

  @property()
  private _cloudPath?: string = undefined;

  @query('#editDialog')
  // @ts-ignore
  private _editDialog: Dialog;
  @query('#question')
  // @ts-ignore
  private _questionTextArea: TextArea;
  @query('#answer')
  // @ts-ignore
  private _answerTextArea: TextArea;
  @queryAll('[required]')
  // @ts-ignore
  private _requiredFields: HTMLElement[];

  mapState(state: State) {
    return {
      _test: state.tests.testForEdit,
      _allTopics: state.maps.allTopics ? state.maps.allTopics.topics : undefined,
      _cloudPath: state.cloud.path,
    };
  }

  constructor() {
    super();
    this._setQuestion = this._debounce(this._setQuestion.bind(this), 1000, false);
    this._setAnswer = this._debounce(this._setAnswer.bind(this), 1000, false);
  }

  updated(changedProperties) {
    if (changedProperties.has("_allTopics")) {
      if (this._allTopics)
        this._chapters = [... new Set(this._allTopics.map(s => s.split(".")[0]))].sort();
      else
        this._chapters = [];
    }
    if (changedProperties.has("_allTopics") || changedProperties.has("_chapter")) {
      if (this._allTopics)
        this._topics = [... new Set(this._allTopics.filter(s => s.split(".")[0] === this._chapter).map(s => s.split(".")[1]))].sort();
      else
        this._topics = [];
    }

    if (changedProperties.has('_test') && this._test) {
      this._editDialog.show();

      this._subject  = this._test.subject || '';
      this._chapter  = this._test.chapter || '';
      this._topic    = this._test.topic || '';
      this._key      = this._test.key || '';
      this._level    = this._test.level || 1;
      this._balance  = this._test.balance || 3;
      this._question = this._test.question || '';
      this._answer   = this._test.answer || '';
      this._values   = this._test.values || [];
      this._oldValues = [...this._values];

      this._editDialog.forceLayout();
      this._checkValidity();
    }

    if (changedProperties.has('_answer')) {
      let answer = this._answer;
      let valueCount =  answer ? answer.split(/<check/).length + answer.split(/<text/).length + answer.split(/<integer/).length + answer.split(/<decimal/).length - 4 : 0;
      if (this._values.length !== valueCount) {
        var newValues: string[] = [];
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
    if (changedProperties.has("_cloudPath")) {
      if (this._cloudPath) {
        store.dispatch.cloud.forgetPath();
        console.log(this._cloudPath);
        //window.open(this._cloudPath, '_blank');
      }
    }
  }

  _focus(e) {
    if (e.type === "blur") {
      this._showPreview = false;
    }
    else if (e.type === "focus") {
      if (e.srcElement.id === "question" || e.srcElement.id === "answer" || e.srcElement.id === "balance")
        this._showPreview = true;
    }
  }

  _save() {
    this._editDialog.close();
    if (!this._test)
      return;

    this._test.subject = this._subject;
    this._test.chapter = this._chapter;
    this._test.topic = this._topic;
    this._test.key = this._key;
    this._test.balance = this._balance;
    this._test.question = this._question;
    this._test.answer = this._answer;
    this._test.values = this._values;

    let test = this._test;
    console.log(test);
    store.dispatch.tests.saveTest(this._test);
  }

  _cancel() {
    this._editDialog.close();
    store.dispatch.tests.unsetTestForEdit();
  }

  _setQuestion() {
    this._question = this._questionTextArea.value;
  }

  _setAnswer() {
    this._answer = this._answerTextArea.value;
  }

  _debounce(func, wait, immediate) {
    var timeout;
    return function (...args) {
      // @ts-ignore
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
    if (!this._test) return;

    store.dispatch.cloud.createDirectoryForTests({
      subject: this._test.subject,
      chapter: this._test.chapter,
      topic: this._test.topic
    });
  }

  _checkValidity() {
    let valid = true;
    for (const element of this._requiredFields) {
      // @ts-ignore
      valid = valid && element.checkValidity();
    }
    this._valid = valid;
  }

  _captureEnter(e) {
    if (!e.metaKey && e.key === "Enter")
      e.cancelBubble = true;
  }

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
        ${this._chapters.map((chapter) => html`<option value="${chapter}" ?selected="${chapter === this._chapter}">${chapter}</option>`)}
      </select>
      </mwc-formfield>
      <mwc-formfield alignend="" label="Thema">
      <select required @change="${e => this._topic = e.target.value}">
        <option value="">- - -</option>
        ${this._topics.map((topic) => html`<option value="${topic}" ?selected="${topic === this._topic}">${topic}</option>`)}
      </select>
    </mwc-formfield>
    <br/><br/>
    <mwc-textfield id="key" name="key" label="Titel" dense type="text" required .value="${this._key}" @change="${e => this._key = e.target.value}"></mwc-textfield>
    <mwc-textfield id="level" name="level" label="Level" dense type="number" inputmode="numeric" min="1" max="3" step="1" .value="${this._level}" @change="${e => this._level = e.target.value}"></mwc-textfield>
    <br/>
    <mwc-formfield alignend="" label="Layout Verhältnis Frage zu Antwort: ${this._balance} zu ${6 - this._balance}   ">
      <mwc-slider id="balance" style="vertical-align:middle" .value="${this._balance}" pin markers step="1" min="0" max="5" @change=${e => this._balance = e.target.value}></mwc-slider>
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
    ${this._showPreview ? html`<kmap-test-card hideHeader hideActions
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
}
