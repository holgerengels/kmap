import {LitElement, html, css, customElement, property, query} from 'lit-element';
import {connect} from '@captaincodeman/rdx';
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
import './kmap-summary-card-summary';
import './kmap-knowledge-card-description';
import './file-drop';
import './validating-form';
import {colorStyles, fontStyles} from "./kmap-styles";

import {Test} from "../models/tests";
import {Attachment, Upload} from "../models/types";
import {Dialog} from "@material/mwc-dialog/mwc-dialog";
import {TextArea} from "@material/mwc-textarea/mwc-textarea";
import {throttle} from "../debounce";
import {TabBar} from "@material/mwc-tab-bar/mwc-tab-bar";

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
  private _tab: string = 'editor';

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
  @query('#tabBar')
  private _tabBar: TabBar;

  @property()
  private _valid: boolean = false;

  mapState(state: State) {
    return {
      _test: state.tests.testForEdit,
      _allTopics: state.maps.allTopics ? state.maps.allTopics.topics : undefined,
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
      this._chapter  = this._test.chapter || '';
      this._topic    = this._test.topic || '';
      this._key      = this._test.key || '';
      this._level    = "" + (this._test.level || 1);
      this._balance  = this._test.balance || 3;
      this._question = this._test.question || '';
      this._answer   = this._test.answer || '';
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
    this._test.values = this._values;
    this._test.attachments = this._attachments;

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

  static get styles() {
    // language=CSS
    return [
      fontStyles,
      colorStyles,
      css`
        mwc-dialog {
          --mdc-dialog-max-width: 810px;
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
        div.fields {
          display: flex;
          flex-flow: row wrap;
        }
        [hidden] { display: none }
    `];
  }

  render() {
    // language=HTML
    return html`
<mwc-dialog id="editDialog" heading="Test Editor" @keydown="${this._switchTab}">
${this._test ? html`
  <validating-form @keydown="${this._captureEnter}" @validity="${e => this._valid = e.target.valid}">
    <mwc-tab-bar id="tabBar" @MDCTabBar:activated="${this._switchTab}">
      <mwc-tab label="Editor"></mwc-tab>
      <mwc-tab label="Preview"></mwc-tab>
    </mwc-tab-bar>
    <div class="grid" ?hidden="${this._tab === 'preview'}">
      <mwc-select style="grid-column: span 3" required label="Kapitel" @change="${e => this._chapter = e.target.value}">
        ${this._chapters.map((chapter) => html`<mwc-list-item value="${chapter}" ?selected="${chapter === this._chapter}">${chapter}</mwc-list-item>`)}
      </mwc-select>
      <mwc-select style="grid-column: span 3" required label="Thema" @change="${e => this._topic = e.target.value}">
        ${this._topics.map((topic) => html`<mwc-list-item value="${topic}" ?selected="${topic === this._topic}">${topic}</mwc-list-item>`)}
      </mwc-select>
    <mwc-textfield style="grid-column: span 4" id="key" name="key" label="Titel" dense type="text" required disabled .value="${this._key}" @change="${e => this._key = e.target.value}" pattern="^([^/]*)$"></mwc-textfield>
    <mwc-textfield style="grid-column: span 2" id="level" name="level" label="Level" dense type="number" inputmode="numeric" min="1" max="3" step="1" .value="${this._level}" @change="${e => this._level = e.target.value}"></mwc-textfield>
    <mwc-formfield style="grid-column: span 4" alignEnd spaceBetween label="Layout Verhältnis Frage : Antwort = ${this._balance} : ${6 - this._balance}">&nbsp;&nbsp;
      <mwc-slider id="balance" style="vertical-align:middle" .value="${this._balance}" pin markers step="1" min="0" max="5" @change=${e => this._balance = e.target.value}></mwc-slider>
    </mwc-formfield>
    <div style="grid-column: span 2"></div>
    <mwc-textarea style="grid-column: span 6" id="question" placeholder="Frage" fullwidth rows="4" .value=${this._question} @keyup="${this._setQuestion}"></mwc-textarea>
    <mwc-textarea style="grid-column: span 6" id="answer" placeholder="Antwort" required fullwidth rows="4" .value=${this._answer} @keyup="${this._setAnswer}"></mwc-textarea>

    <div style="grid-column: span 6" class="field values">
      <label secondary>Werte (Checkboxen: true/false, Dezimalzahlen mit Punkt statt Komma)</label><br/>

      ${this._values.map((value, i) => html`<input type="text" .value="${value}" @change="${e => this._values[i] = e.target.value}"/>`)}
    </div>

    <div style="grid-column: span 6" class="attachments">
      <label for="attachments">Materialien</label><br/>
      ${this._attachments.map((attachment) => html`
        <div class="fields">
          <div style="flex: 1 0 auto">
            <span>${attachment.file} (${attachment.mime})</span>
          </div>
          <mwc-icon-button icon="delete" @click="${() => this._deleteAttachment(attachment)}" style="flex: 0 0 36px; --mdc-icon-button-size: 36px"></mwc-icon-button>
        </div>
      `)}
    </div>
    <div style="grid-column: span 6" class="fields">
      <file-drop id="file" @filedrop="${e => this._attachmentFile = e.detail.file}" style="flex: 1 0 75%"></file-drop>
      <mwc-icon-button class="add" icon="add_circle" @click="${this._addAttachment}" style="flex: 0 0 36px; --mdc-icon-button-size: 36px; align-self: center"></mwc-icon-button>
    </div>
</div>
  </validating-form>
<kmap-test-card hideHeader hideActions ?hidden="${this._tab === 'editor'}"
    .subject="${this._subject}"
    .chapter="${this._chapter}"
    .topic="${this._topic}"
    .level="${this._level}"
    .balance="${this._balance}"
    .question="${this._question}"
    .answer="${this._answer}"
    .num="1" .of="1">
</kmap-test-card>
` : ''}

  <mwc-button slot="secondaryAction" @click=${this._cancel}>Abbrechen</mwc-button>
  <mwc-button ?disabled="${this._pendingUploads || !this._valid}" slot="primaryAction" @click=${this._save}>Speichern</mwc-button>
</mwc-dialog>
    `;
  }
}
