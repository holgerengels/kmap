import {LitElement, html, css, customElement, property, query, queryAll} from 'lit-element';
import {connect} from '@captaincodeman/rdx';
import {State, store} from "../store";

import {colorStyles, fontStyles, themeStyles} from "./kmap-styles";

import '@material/mwc-button';
import '@material/mwc-icon-button';
import '@material/mwc-dialog';
import '@material/mwc-formfield';
import '@material/mwc-list/mwc-list-item';
import '@material/mwc-select';
import '@material/mwc-slider';
import '@material/mwc-textarea';
import '@material/mwc-textfield';
import './kmap-summary-card-summary';
import './kmap-knowledge-card-description';
import {Test} from "../models/tests";
import {Dialog} from "@material/mwc-dialog/mwc-dialog";
import {TextArea} from "@material/mwc-textarea/mwc-textarea";
import {throttle} from "../debounce";

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
  private _level: string = "1";
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
    this._setQuestion = throttle(this._setQuestion, 1000, this);
    this._setAnswer = throttle(this._setAnswer, 1000, this);
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
      this._level    = "" + (this._test.level || 1);
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
    this._test.level = this._level ? parseInt(this._level, 10) : undefined;
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
      themeStyles,
      css`
        mwc-dialog {
          --mdc-dialog-max-width: 810px;
        }
        mwc-icon-button, mwc-button {
          vertical-align: middle
        }
        mwc-textfield, mwc-textarea {
          margin-bottom: 4px;
        }
        .preview-scroller {
          z-index: 10000000;
          position: fixed;
          top: 16px;
          left: 16px;
          right: 16px;
          max-height: 360px;
          overflow-y: auto;
          pointer-events: all;
          border-radius: 3px;
          box-shadow: 0 2px 2px 0 rgba(0, 0, 0, 0.14),
          0 1px 5px 0 rgba(0, 0, 0, 0.12),
          0 3px 1px -2px rgba(0, 0, 0, 0.2);
        }
        kmap-test-card {
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
  ${this._showPreview ? html`<div class="preview-scroller"><kmap-test-card hideHeader hideActions
    .subject="${this._subject}"
    .chapter="${this._chapter}"
    .topic="${this._topic}"
    .level="${this._level}"
    .balance="${this._balance}"
    .question="${this._question}"
    .answer="${this._answer}"
    .num="1" .of="1">
</kmap-test-card></div>` : ''}

<mwc-dialog id="editDialog" heading="Test Editor">
${this._test ? html`
  <form @focus="${this._focus}" @keydown="${this._captureEnter}" @input="${this._checkValidity}">
      <mwc-select required label="Kapitel" @change="${e => this._chapter = e.target.value}">
        ${this._chapters.map((chapter) => html`<mwc-list-item value="${chapter}" ?selected="${chapter === this._chapter}">${chapter}</mwc-list-item>`)}
      </mwc-select>
      <mwc-select required label="Thema" @change="${e => this._topic = e.target.value}">
        ${this._topics.map((topic) => html`<mwc-list-item value="${topic}" ?selected="${topic === this._topic}">${topic}</mwc-list-item>`)}
      </mwc-select>
    <br/><br/>
    <mwc-textfield id="key" name="key" label="Titel" dense type="text" required .value="${this._key}" @change="${e => this._key = e.target.value}"></mwc-textfield>
    <mwc-textfield id="level" name="level" label="Level" dense type="number" inputmode="numeric" min="1" max="3" step="1" .value="${this._level}" @change="${e => this._level = e.target.value}"></mwc-textfield>
    <br/>
    <mwc-formfield alignend="" label="Layout Verhältnis Frage : Antwort = ${this._balance} : ${6 - this._balance}">&nbsp;&nbsp;
      <mwc-slider id="balance" style="vertical-align:middle" .value="${this._balance}" pin markers step="1" min="0" max="5" @change=${e => this._balance = e.target.value}></mwc-slider>
    </mwc-formfield>
    <br/>
    <mwc-textarea id="question" placeholder="Frage" fullwidth rows="4" .value=${this._question} @keyup="${this._setQuestion}" @focus="${this._focus}" @blur="${this._focus}"></mwc-textarea>
    <mwc-textarea id="answer" placeholder="Antwort" required fullwidth rows="4" .value=${this._answer} @keyup="${this._setAnswer}" @focus="${this._focus}" @blur="${this._focus}"></mwc-textarea>

    <div class="field values">
      <label secondary>Werte (Checkboxen: true/false, Dezimalzahlen mit Punkt statt Komma)</label><br/>

      ${this._values.map((value) => html`<input type="text" .value="${value}" @change="${e => value = e.target.value}"/>`)}
    </div>
  </form>` : ''}

  <mwc-icon-button slot="secondaryAction" icon="folder_open" title="Cloud Verzeichnis öffnen" @click=${this._createDirectory}></mwc-icon-button>
  <mwc-button slot="secondaryAction" @click=${this._cancel}>Abbrechen</mwc-button>
  <mwc-button slot="primaryAction" @click=${this._save} ?disabled="${!this._valid}">Speichern</mwc-button>
</mwc-dialog>
    `;
  }
}
