import {html, css, customElement, property, query} from 'lit-element';
import {Connected} from "./connected";
import {State, store} from "../store";

import '@material/mwc-button';
import '@material/mwc-dialog';
import '@material/mwc-formfield';
import '@material/mwc-icon-button';
import '@material/mwc-list/mwc-list-item';
import '@material/mwc-select';
import '@material/mwc-slider';
import '@material/mwc-tab';
import '@material/mwc-tab-bar';
import '@material/mwc-textarea';
import '@material/mwc-textfield';
import './kmap-knowledge-card-description';
import './file-drop';
import './validating-form';
import {colorStyles, fontStyles, formStyles} from "./kmap-styles";

import {Dialog} from "@material/mwc-dialog/mwc-dialog";
import {TextArea} from "@material/mwc-textarea/mwc-textarea";
import {TabBar} from "@material/mwc-tab-bar/mwc-tab-bar";
import {throttle} from "../debounce";
import {Test} from "../models/tests";
import {Attachment, Upload} from "../models/types";

@customElement('kmap-test-editor-edit-dialog')
export class KMapTestEditorEditDialog extends Connected {
  @property()
  private _allTopics?: string[] = undefined;
  @property()
  private _chapters: string[] = [];
  @property()
  private _topics: string[] = [];

  @property()
  private _tab: string = 'editor';

  @property()
  private _test?: Test = undefined;
  @property()
  private _question: string = '';
  @property()
  private _answer: string = '';
  @property()
  private _hint: string = '';
  @property()
  private _solution: string = '';
  @property()
  private _subject: string = '';
  @property()
  private _set: string = '';
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
  private _attachmentFile?: File = undefined;

  @property()
  private _attachments: Attachment[] = [];
  @property()
  private _uploads: Upload[] = [];
  @property()
  private _pendingUploads: boolean = false;

  @query('#editDialog')
  private _editDialog: Dialog;
  @query('#question')
  private _questionTextArea: TextArea;
  @query('#answer')
  private _answerTextArea: TextArea;
  @query('#hint')
  private _hintTextArea: TextArea;
  @query('#solution')
  private _solutionTextArea: TextArea;
  @query('#tabBar')
  private _tabBar: TabBar;

  @property()
  private _valid: boolean = false;

  mapState(state: State) {
    return {
      _test: state.tests.testForEdit,
      _allTopics: state.maps.allTopics,
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
      this._attachmentFile = undefined;
      this._subject  = this._test.subject || '';
      this._set      = this._test.set || '';
      this._chapter  = this._test.chapter || '';
      this._topic    = this._test.topic || '';
      this._key      = this._test.key || '';
      this._level    = "" + (this._test.level || 1);
      // @ts-ignore
      this._balance  = this._test.balance === "" || this._test.balance === undefined ? 3 : this._test.balance;
      this._question = this._test.question || '';
      this._answer   = this._test.answer || '';
      this._hint     = this._test.hint || '';
      this._solution = this._test.solution || '';
      this._values   = this._test.values || [];
      this._oldValues = [...this._values];
      this._attachments = this._test.attachments || [];

      this._editDialog.show();
      this._editDialog.forceLayout();
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

    if (changedProperties.has("_uploads")) {
      this._pendingUploads = this._uploads.some(u => u.uploading);
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
    this._test.hint = this._hint;
    this._test.solution = this._solution;
    this._test.values = this._values;
    this._test.attachments = this._attachments;
    if (!this._test.author)
      this._test.author = store.state.app.username;

    let test = this._test;
    console.log(test);
    store.dispatch.tests.saveTest(this._test);

    store.dispatch.testUploads.clearUploads();
  }

  _cancel() {
    this._editDialog.close();
    store.dispatch.tests.unsetTestForEdit();
    store.dispatch.testUploads.clearUploads();
  }

  _setQuestion() {
    this._question = this._questionTextArea.value;
  }

  _setAnswer() {
    this._answer = this._answerTextArea.value;
  }

  _setHint() {
    this._hint = this._hintTextArea.value;
  }

  _setSolution() {
    this._solution = this._solutionTextArea.value;
  }

  _addAttachment() {
    if (!this._test) return;

    if (!this._attachmentFile) {
      store.dispatch.shell.showMessage("unvollständig!");
      return;
    }
    else {
      this._attachments = [...this._attachments, {
        tag: '',
        name: this._attachmentFile.name,
        file: this._attachmentFile.name,
        mime: this._attachmentFile.type,
        type: "file",
      }];
      console.log("upload file");
      store.dispatch.testUploads.upload(this._attachmentFile);
    }

    this._attachmentFile = undefined;
    this.requestUpdate();
  }

  _deleteAttachment(attachment) {
    if (!this._test) return;

    let attachments = [...this._attachments];
    attachments.splice(attachments.indexOf(attachment), 1);
    this._attachments = attachments;
    this.requestUpdate();
  }

  _captureEnter(e) {
    if (!e.metaKey && e.key === "Enter")
      e.cancelBubble = true;
  }

  _switchTab(e) {
    if (e.type === "MDCTabBar:activated")
      this._tab = e.detail.index === 0 ? 'editor' : 'preview';
    else if (e.key === "p" && e.altKey === true)
      this._tabBar.activeIndex = this._tab === 'editor' ? 1 : 0;
  }

  _copy(attachment: Attachment) {
    if (attachment.file)
      navigator.clipboard.writeText(`<img width="" height="" src="inline:${attachment.file}"/>`);
  }

  static get styles() {
    // language=CSS
    return [
      fontStyles,
      colorStyles,
      formStyles,
      css`
        mwc-dialog {
          --mdc-dialog-min-width: calc(100vw - 64px);
          --mdc-dialog-max-width: calc(100vw - 64px);
        }
        mwc-icon-button, mwc-button {
          vertical-align: middle
        }
        mwc-textfield, mwc-textarea, file-drop {
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
        .preview {
          display: flex; justify-content: center; padding: 16px;
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
        .grid {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          grid-gap: 8px;
        }
        mwc-select { width: 100% }
        input[type="text"] {
          border: 1px solid var(--color-mediumgray);
          background-color: var(--color-lightgray);
          padding: 4px;
          margin: 4px;
          outline: none;
        }
        input[type="text"]:focus {
          border-bottom: 2px solid var(--color-primary-dark);
          margin-bottom: 3px;
        }
        [hidden] { display: none }
    `];
  }

  render() {
    // language=HTML
    return html`
<mwc-dialog id="editDialog" heading="Test Editor" @keydown="${this._switchTab}">
${this._test ? html`
  <mwc-tab-bar id="tabBar" @MDCTabBar:activated="${this._switchTab}">
    <mwc-tab label="Editor"></mwc-tab>
    <mwc-tab label="Preview"></mwc-tab>
  </mwc-tab-bar>
  <div ?hidden="${this._tab === 'preview'}">
    <validating-form @keydown="${this._captureEnter}" @validity="${e => this._valid = e.target.valid}">
      <div class="form">
        <mwc-select s3 required label="Kapitel" @change="${e => this._chapter = e.target.value}">
          ${this._chapters.map((chapter) => html`<mwc-list-item value="${chapter}" ?selected="${chapter === this._chapter}">${chapter}</mwc-list-item>`)}
        </mwc-select>
        <mwc-select s3 required label="Thema" @change="${e => this._topic = e.target.value}">
          ${this._topics.map((topic) => html`<mwc-list-item value="${topic}" ?selected="${topic === this._topic}">${topic}</mwc-list-item>`)}
        </mwc-select>
        <mwc-textfield s5 id="key" name="key" label="Titel" dense type="text" required disabled .value="${this._key}" @change="${e => this._key = e.target.value}" pattern="^([^./]*)$"></mwc-textfield>
        <mwc-textfield s1 id="level" name="level" label="Level" dense type="number" inputmode="numeric" min="1" max="3" step="1" .value="${this._level}" @change="${e => this._level = e.target.value}"></mwc-textfield>
        <mwc-formfield s5 alignEnd spaceBetween label="Layout Verhältnis Frage : Antwort =&nbsp;${this._balance}&nbsp;:&nbsp;${6 - this._balance}">&nbsp;&nbsp;
          <mwc-slider id="balance" style="vertical-align:middle" .value="${this._balance}" pin markers step="1" min="0" max="5" @change=${e => this._balance = e.target.value}></mwc-slider>
        </mwc-formfield>
        <div s1></div>
        <mwc-textarea s6 id="question" label="Frage" rows="4" .value=${this._question} @keyup="${this._setQuestion}"></mwc-textarea>
        <mwc-textarea s6 id="answer" label="Antwort" required rows="4" .value=${this._answer} @keyup="${this._setAnswer}"></mwc-textarea>
        <mwc-textarea s6 id="hint" label="Hinweis" rows="2" .value=${this._hint} @keyup="${this._setHint}"></mwc-textarea>
        <mwc-textarea s6 id="solution" label="Lösungsweg" rows="4" .value=${this._solution} @keyup="${this._setSolution}"></mwc-textarea>
        <div s6 class="field values">
          <label secondary>Werte (Checkboxen: true/false, Dezimalzahlen mit Punkt statt Komma)</label><br/>

          ${this._values.map((value, i) => html`<input type="text" .value="${value}" @change="${e => this._values[i] = e.target.value}"/>`)}
        </div>
      </div>
    </validating-form>

    <div class="form">
      <div s6 class="attachments">
      <label for="attachments">Materialien</label><br/>
      ${this._attachments.map((attachment) => html`
        <div class="form" style="grid-template-columns: 1fr 36px">
          <div @click="${() => this._copy(attachment)}">
            <span>${attachment.file} (${attachment.mime})</span>
          </div>
          <mwc-icon-button icon="delete" @click="${() => this._deleteAttachment(attachment)}"></mwc-icon-button>
        </div>
      `)}
    </div>
    <div s6 class="form" style="grid-template-columns: 1fr 36px">
      <file-drop id="file" @filedrop="${e => this._attachmentFile = e.detail.file}"></file-drop>
      <mwc-icon-button class="add" icon="add_circle" @click="${this._addAttachment}"></mwc-icon-button>
    </div>
    </div>
  </div>
  <div class="preview" ?hidden="${this._tab === 'editor'}">
    <kmap-test-card hideHeader hideActions ?hintVisible="${this._hint}" ?solutionVisible="${this._solution}"
        .subject="${this._subject}"
        .set="${this._set}"
        .chapter="${this._chapter}"
        .topic="${this._topic}"
        .key="${this._key}"
        .level="${this._level}"
        .balance="${this._balance}"
        .question="${this._question}"
        .answer="${this._answer}"
        .hint="${this._hint}"
        .solution="${this._solution}"
        .num="1" .of="1">
    </kmap-test-card>
  </div>
` : ''}

  <mwc-button slot="secondaryAction" @click=${this._cancel}>Abbrechen</mwc-button>
  <mwc-button ?disabled="${this._pendingUploads || !this._valid}" slot="primaryAction" @click=${this._save}>Speichern</mwc-button>
</mwc-dialog>
    `;
  }
}
