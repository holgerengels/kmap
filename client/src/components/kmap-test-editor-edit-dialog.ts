import {html, css} from 'lit';
import {customElement, query, state} from 'lit/decorators.js';
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
import { KmapHtmlEditor } from "kmap-html-editor";
import './kmap-knowledge-card-description';
import './file-drop';
import './validating-form';
import {resetStyles, colorStyles, fontStyles, formStyles, elevationStyles} from "./kmap-styles";

import {Dialog} from "@material/mwc-dialog/mwc-dialog";
import {TabBar} from "@material/mwc-tab-bar/mwc-tab-bar";
import {Attachment, Upload} from "../models/types";
import {Test} from "../models/tests";
import {FileDrop} from "./file-drop";
import {styleMap} from "lit/directives/style-map.js";

@customElement('kmap-test-editor-edit-dialog')
export class KMapTestEditorEditDialog extends Connected {
  @state()
  private _allTopics?: string[] = undefined;
  @state()
  private _chapters: string[] = [];
  @state()
  private _topics: string[] = [];

  @state()
  private _test?: Test = undefined;
  @state()
  private _question: string = '';
  @state()
  private _answer: string = '';
  @state()
  private _hint: string = '';
  @state()
  private _solution: string = '';
  @state()
  private _subject: string = '';
  @state()
  private _set: string = '';
  @state()
  private _chapter: string = '';
  @state()
  private _topic: string = '';
  @state()
  private _key: string = '';
  @state()
  private _author: string = '';
  @state()
  private _level: string = "1";
  @state()
  private _repetitions: string = "1";
  @state()
  private _balance: number = 3;

  @state()
  private _oldValues: string[] = [];
  @state()
  private _values: string[] = [];

  @state()
  private _attachmentFile?: File = undefined;

  @state()
  private _attachments: Attachment[] = [];
  @state()
  private _uploads: Upload[] = [];
  @state()
  private _pendingUploads: boolean = false;

  @state()
  private _wide: boolean = false;
  @state()
  private _tab: string = 'editor';
  @state()
  private _innerTab: string = 'meta';
  @state()
  private _metaVisible: boolean = false;
  @state()
  private _qnaVisible: boolean = false;
  @state()
  private _hnsVisible: boolean = false;
  @state()
  private _previewVisible: boolean = false;

  @query('#editDialog')
  private _editDialog: Dialog;
  //@query('#question')
  //private _questionEditor: KmapHtmlEditor;
  @query('#answer')
  private _answerEditor: KmapHtmlEditor;
  //@query('#hint')
  //private _hintEditor: KmapHtmlEditor;
  //@query('#solution')
  //private _solutionEditor: KmapHtmlEditor;
  @query('#tabBar')
  private _tabBar: TabBar;

  @state()
  private _metaValid: boolean = false;
  @state()
  private _contentValid: boolean = false;

  @query('#file')
  private _file: FileDrop;

  mapState(state: State) {
    return {
      _wide: state.shell.wide,
      _test: state.tests.testForEdit,
      _allTopics: state.maps.allTopics,
      _uploads: state.uploads.uploads,
    };
  }

  constructor() {
    super();
    //this._setQuestion = throttle(this._setQuestion, 1000, this);
    //this._setAnswer = throttle(this._setAnswer, 1000, this);
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
      this._author      = this._test.author || store.state.app.username || '';
      this._repetitions    = "" + (this._test.repetitions || 1);
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

      this._metaValid = true;
      this._contentValid = true;
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

    if (changedProperties.has("_tab") || changedProperties.has("_innerTab") || changedProperties.has("_wide")) {
      if (this._wide) {
        this._metaVisible = this._innerTab === 'meta';
        this._qnaVisible = this._innerTab === 'qna';
        this._hnsVisible = this._innerTab === 'hns';
        this._previewVisible = true;
      }
      else {
        this._metaVisible = this._tab === 'meta';
        this._qnaVisible = this._tab === 'qna';
        this._hnsVisible = this._tab === 'hns';
        this._previewVisible = this._tab === 'preview';
      }
    }
  }

  async _save() {
    this._editDialog.close();
    if (!this._test)
      return;

    const test: Test = this._test;
    test.subject = this._subject;
    test.chapter = this._chapter;
    test.topic = this._topic;
    test.key = this._key;
    test.author = this._author;
    test.repetitions = this._repetitions ? parseInt(this._repetitions, 10) : 1;
    test.level = this._level ? parseInt(this._level, 10) : undefined;
    test.balance = this._balance;
    test.question = this._question;
    test.answer = this._answer;
    test.hint = this._hint;
    test.solution = this._solution;
    test.values = this._values;
    test.attachments = this._attachments;

    console.log(test);

    await store.dispatch.tests.saveTest(test);

    store.dispatch.testUploads.clearUploads();
  }

  _cancel() {
    this._editDialog.close();
    store.dispatch.tests.unsetTestForEdit();
    store.dispatch.testUploads.clearUploads();
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
    this._file.clear();
    this.requestUpdate();
  }

  _deleteAttachment(attachment) {
    if (!this._test) return;

    let attachments = [...this._attachments];
    attachments.splice(attachments.indexOf(attachment), 1);
    this._attachments = attachments;
    this.requestUpdate();
  }

  _captureKeys(e) {
    if (!e.metaKey && (e.key === "Enter" || e.key === 'Esc'))
      e.cancelBubble = true;
    else if (e.key === "p" && e.altKey === true) {
      if (!this._wide)
        this._tabBar.activeIndex = 2;
    }
  }

  _switchTab(e) {
    if (e.type === "MDCTabBar:activated")
      this._tab = !this._wide ? ['meta', 'qna', 'hns', 'preview'][e.detail.index] : ['editor', 'preview'][e.detail.index];

    if (this._qnaVisible)
      this._answerEditor.focus();
  }

  _switchInnerTab(e) {
    if (e.type === "MDCTabBar:activated")
      this._innerTab = ['meta', 'qna', 'hns'][e.detail.index];

    if (this._qnaVisible)
      this._answerEditor.focus();
  }

  _copy(attachment: Attachment) {
    if (attachment.file)
      navigator.clipboard.writeText(`<img width="" height="" src="inline:${attachment.file}" alt=""/>`);
  }

  static get styles() {
    // language=CSS
    return [
      resetStyles,
      fontStyles,
      colorStyles,
      formStyles,
      elevationStyles,
      css`
        mwc-dialog {
          --mdc-dialog-min-width: calc(100vw - 32px);
          --mdc-dialog-max-width: calc(100vw - 32px);
          --mdc-dialog-min-height: calc(100vh - 32px);
          --mdc-dialog-max-height: calc(100vh - 32px);
        }
        .dialog {
          height: calc(100vh - 166px);
        }
        .tab {
          display: grid;
          grid-template-rows: min-content 1fr;
        }
        .wide {
          display: grid;
          grid-template-columns: 1fr 1fr;
          column-gap: 32px;
          justify-items: stretch;
          height: inherit;
        }
        .qna {
          display: grid;
          grid-template-rows: 2fr 2fr min-content 1fr min-content;
        }
        .hns {
          display: grid;
          grid-template-rows: 2fr 2fr 1fr min-content;
        }
        .preview {
          overflow-y: auto;
        }
        .form {
          align-self: start;
        }
        .scrollcontainer {
          position: relative; height: 100%; width: 100%
        }
        .scrollcontainer > * {
          position: absolute; inset: 0 0 0 0;
        }
        .attachments {
          overflow-y: auto;
          overflow-x: hidden;
          padding: 16px 8px;
        }
        .attachment span[slot=secondary] {
          display: block;
          width: 100%;
          overflow: hidden;
          text-overflow: ellipsis;
          font-size: small;
        }
        kmap-test-card {
          display: block;
          box-sizing: border-box;
          background-color: var(--color-lightgray);
          border-radius: 3px;
          box-shadow: var(--elevation-01),
          0 1px 5px 0 rgba(0, 0, 0, 0.12),
          0 3px 1px -2px rgba(0, 0, 0, 0.2);
        }
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
        mwc-icon-button, mwc-button {
          vertical-align: middle
        }
        mwc-textfield, mwc-textarea, file-drop {
          margin-bottom: 4px;
        }
        mwc-select { width: 100% }
        .attachment {
          display: block;
        }
        [hidden] { display: none }
    `];
  }

  render() {
    // language=HTML
    return this._test ? html`
      <mwc-dialog id="editDialog" heading="Test Editor" @keydown="${this._captureKeys}">
        <div class="dialog tab">
          ${!this._wide ? html`
            <mwc-tab-bar id="tabBar" @MDCTabBar:activated="${this._switchTab}">
              <mwc-tab label="Metadaten" ?hidden="${this._wide}"></mwc-tab>
              <mwc-tab label="${this._wide ? 'Editor' : 'Frage & Antwort'}"></mwc-tab>
              <mwc-tab label="${this._wide ? 'Editor' : 'Hinweis & Lösung'}"></mwc-tab>
              <mwc-tab label="Preview"></mwc-tab>
            </mwc-tab-bar>
            ${this.renderMeta()}
            ${this.renderQuestionAndAnswer()}
            ${this.renderHintAndSolution()}
            ${this.renderPreview()}
          ` : html`
            <div class="wide">
              <div class="tab">
                <mwc-tab-bar id="innerTabBar" @MDCTabBar:activated="${this._switchInnerTab}" ?hidden="${!this._wide}">
                  <mwc-tab label="Metadaten"></mwc-tab>
                  <mwc-tab label="Frage & Antwort"></mwc-tab>
                  <mwc-tab label="Hinweis & Lösung"></mwc-tab>
                </mwc-tab-bar>
                ${this.renderMeta()}
                ${this.renderQuestionAndAnswer()}
                ${this.renderHintAndSolution()}
              </div>
              ${this.renderPreview()}
            </div>
          `}
        </div>

        <mwc-button slot="secondaryAction" @click=${this._cancel}>Abbrechen</mwc-button>
        <mwc-button ?disabled="${this._pendingUploads || !this._metaValid || !this._contentValid}" slot="primaryAction" @click=${this._save}>Speichern</mwc-button>
      </mwc-dialog>` : '';
  }

  renderMeta() {
    // language=HTML
    return this._test ? html`
    <validating-form @keydown="${this._captureKeys}" @validity="${e => this._metaValid = e.target.valid}" ?hidden="${!this._metaVisible}">
      <div class="form">
        <mwc-select s3 required label="Kapitel" @change="${e => this._chapter = e.target.value}">
          ${this._chapters.map((chapter) => html`<mwc-list-item value="${chapter}" ?selected="${chapter === this._chapter}">${chapter}</mwc-list-item>`)}
        </mwc-select>
        <mwc-select s3 required label="Thema" @change="${e => this._topic = e.target.value}">
          ${this._topics.map((topic) => html`<mwc-list-item value="${topic}" ?selected="${topic === this._topic}">${topic}</mwc-list-item>`)}
        </mwc-select>
        <mwc-textfield s5 id="key" name="key" label="Titel" dense type="text" required disabled .value="${this._key}" @change="${e => this._key = e.target.value}" pattern="[^.\\/]*"></mwc-textfield>
        <mwc-textfield s1 id="level" name="level" label="Level" dense type="number" inputmode="numeric" min="1" max="3" step="1" .value="${this._level}" @change="${e => this._level = e.target.value}"></mwc-textfield>
        <mwc-textfield s2 id="author" name="author" label="Autor" dense type="text" required .value="${this._author}" @change="${e => this._author = e.target.value}"></mwc-textfield>
        <mwc-formfield s3 style="padding-left: 16px" alignEnd nowrap label="Layout Frage : Antwort =&nbsp;${this._balance}&nbsp;:&nbsp;${6 - this._balance}">
          <mwc-slider id="balance" style="vertical-align:middle; width: min(50%, 200px)" .value="${this._balance}" withTickMarks discrete step="1" min="0" max="5" @input=${e => this._balance = e.target.value}></mwc-slider>
        </mwc-formfield>
        <mwc-textfield s1 id="repetitions" name="repetitions" label="Wiederholungen" dense type="number" inputmode="numeric" min="1" max="3" step="1" .value="${this._repetitions}" @change="${e => this._repetitions = e.target.value}"></mwc-textfield>
      </div>
    </validating-form>
    ` : '';
  }

  renderQuestionAndAnswer() {
    const styles = { gridTemplateRows: `${2*this._balance}fr ${2*(6-this._balance)}fr min-content 1fr min-content` };
    // language=HTML
    return this._test ? html`
      <div class="qna" style="${styleMap(styles)}" ?hidden="${!this._qnaVisible}">
        <validating-form @keydown="${this._captureKeys}" @validity="${e => this._contentValid = e.target.valid}">
          <div class="scrollcontainer">
            <kmap-html-editor id="question" placeholder="Frage" .value=${this._question} @change="${e => this._question = e.detail.value}"></kmap-html-editor>
          </div>
          <div class="scrollcontainer">
            <kmap-html-editor id="answer" placeholder="Antwort" .value=${this._answer} @change="${e => this._answer = e.detail.value}"></kmap-html-editor>
          </div>
          <div class="field values">
            <label secondary>Werte (Checkboxen: true/false, Dezimalzahlen mit Punkt statt Komma)</label><br/>
            ${this._values.map((value, i) => html`<input type="text" .value="${value}" @change="${e => this._values[i] = e.target.value}"/>`)}
          </div>
        </validating-form>

        ${this.renderAttachments()}
      </div>
    ` : '';
  }

  renderHintAndSolution() {
    // language=HTML
    return this._test ? html`
      <div class="hns" ?hidden="${!this._hnsVisible}">
        <validating-form @keydown="${this._captureKeys}" @validity="${e => this._contentValid = e.target.valid}">
          <div class="scrollcontainer">
            <kmap-html-editor id="hint" placeholder="Tipp" .value=${this._hint} @change="${e => this._hint = e.detail.value}"></kmap-html-editor>
          </div>
          <div class="scrollcontainer">
            <kmap-html-editor id="solution" placeholder="Lösung" .value=${this._solution} @change="${e => this._solution = e.detail.value}"></kmap-html-editor>
          </div>
        </validating-form>

        ${this.renderAttachments()}
      </div>
    ` : '';
  }

  renderAttachments() {
    // language=HTML
    return html`
      <div class="scrollcontainer attachmentscontainer" ?hidden="${!(this._qnaVisible || this._hnsVisible)}">
        <div class="attachments">
          <label for="attachments">Materialien</label><br/>
          ${this._attachments.map((attachment) => html`
          <div class="form" style="grid-template-columns: 1fr 36px">
            <div @click="${() => this._copy(attachment)}">
              <span slot="secondary">${attachment.file} (${attachment.mime})</span>
            </div>
            <mwc-icon-button icon="delete" @click="${() => this._deleteAttachment(attachment)}"></mwc-icon-button>
          </div>
        `)}
        </div>
      </div>
      <div class="form" style="grid-template-columns: 1fr 36px"  ?hidden="${!(this._qnaVisible || this._hnsVisible)}">
        <file-drop id="file" @filedrop="${e => this._attachmentFile = e.detail.file}"></file-drop>
        <mwc-icon-button class="add" icon="add_circle" @click="${this._addAttachment}"></mwc-icon-button>
      </div>
    `;
  }
  renderPreview() {
    // language=HTML
    return this._test ? html`
      <div class="preview" ?hidden="${!this._previewVisible}">
        <br/>
        <kmap-test-card
          hideHeader hideActions ?hintVisible="${this._hint}" ?solutionVisible="${this._solution}"
          .set="${this._set}"
          .subject="${this._subject}"
          .chapter="${this._chapter}"
          .topic="${this._topic}"
          .key="${this._key}"
          .repetitions="${this._repetitions}"
          .level="${this._level}"
          .balance="${this._balance}"
          .question="${this._question}"
          .answer="${this._answer}"
          .hint="${this._hint}"
          .solution="${this._solution}"
          .num="1" .of="1">
        </kmap-test-card>
      </div>
    ` : '';
  }
}
