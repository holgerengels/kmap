import {html, css} from 'lit';
import {customElement, property, query, state} from 'lit/decorators.js';
import {Connected} from "./connected";
import {State, store} from "../store";

import '@material/mwc-button';
import '@material/mwc-dialog';
import '@material/mwc-formfield';
import '@material/mwc-icon-button';
import '@material/mwc-icon-button-toggle';
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
import {Upload} from "../models/types";
import {Attachment, Card} from "../models/types";
import {FileDrop} from "./file-drop";
import {styleMap} from "lit/directives/style-map.js";

@customElement('kmap-editor-edit-dialog')
export class KMapEditorEditDialog extends Connected {
  @state()
  private _instance: string = '';

  @state()
  private _card?: Card = undefined;
  @state()
  private _summary: string = '';
  @state()
  private _description: string = '';
  @state()
  private _thumb: string = '';
  @state()
  private _keywords: string = '';
  @state()
  private _sgs: string = '';
  @state()
  private _educationalLevel: string = '';
  @state()
  private _educationalContext: string = '';
  @state()
  private _typicalAgeRange: string = '';
  @state()
  private _tab: string = 'editor';

  @state()
  private _depends: string = '';
  @state()
  private _links: string = '';
  @state()
  private _priority: string = '';

  @state()
  private _attachmentType: string = 'link';
  @state()
  private _attachmentTag: string = '';
  @state()
  private _attachmentName: string = '';
  @state()
  private _attachmentMime: string = '';
  @state()
  private _attachmentHref: string = '';
  @state()
  private _attachmentFile?: File = undefined;
  @property()
  // @ts-ignore
  private _attachmentValid: boolean = false;

  @state()
  private _attachments: Attachment[] = [];
  @state()
  private _uploads: Upload[] = [];
  @state()
  private _pendingUploads: boolean = false;

  @state()
  private _navigateAfterSave?: string = '';

  @query('#editDialog')
  private _editDialog: Dialog;
  @query('#summary')
  private _summaryTextArea: TextArea;
  @query('#description')
  private _descriptionTextArea: TextArea;
  @query('#tabBar')
  private _tabBar: TabBar;

  @state()
  private _valid: boolean = false;

  @query('#attachmentForm')
  private _attachmentForm: HTMLFormElement;
  @query('#file')
  private _file: FileDrop;


  mapState(state: State) {
    return {
      _instance: state.app.instance,
      _card: state.maps.editAction?.action === "edit" ? state.maps.editAction.card : undefined,
      _uploads: state.uploads.uploads,
    };
  }

  constructor() {
    super();
    this._setSummary = throttle(this._setSummary, 1000, this);
    this._setDescription = throttle(this._setDescription, 1000, this);
  }

  updated(changedProperties) {
    if (changedProperties.has('_card') && this._card !== undefined) {
      this._navigateAfterSave = store.state.maps.subject !== this._card.subject || store.state.maps.chapter !== this._card.chapter
        ? "/app/browser/" + this._card.subject + "/" + this._card.chapter
        : undefined;

      this._attachmentTag = '';
      this._attachmentName = '';
      this._attachmentMime = '';
      this._attachmentHref = '';
      this._attachmentFile = undefined;
      this._summary = this._card.summary;
      this._description = this._card.description;
      this._thumb = this._card.thumb || '';
      this._keywords = this._card.keywords || '';
      this._sgs = this._card.sgs || '';
      this._educationalLevel = this._card.educationalLevel || '';
      this._educationalContext = this._card.educationalContext || '';
      this._typicalAgeRange = this._card.typicalAgeRange || '';
      this._depends = this._card.depends ? this._card.depends.join(" / ") : '';
      this._links = this._card.links || '';
      this._priority = this._card.priority !== undefined ? this._card.priority + '' : '';
      this._attachments = this._card.attachments;

      this._editDialog.show();
      this._editDialog.forceLayout();
    }

    if (changedProperties.has("_uploads")) {
      this._pendingUploads = this._uploads.some(u => u.uploading);
    }

    if (changedProperties.has("_educationalLevel")) {
      const levels = this._educationalLevel?.split(",").map(l => l.trim()).map(l => Number.parseInt(l));
      if (!levels)
        this._typicalAgeRange = "";
      else {
        const min = Math.min(...levels) + 5;
        const max = Math.max(...levels) + 5;
        this._typicalAgeRange = min === max ? "" + min : min + "-" + max;
      }
    }
  }

  async _save() {
    this._editDialog.close();
    if (!this._card)
      return;

    const card: Card = this._card;
    card.summary = this._summary;
    card.description = this._description;
    card.thumb = this._thumb;
    card.keywords = this._keywords;
    card.sgs = this._sgs;
    card.educationalLevel = this._educationalLevel;
    card.educationalContext = this._educationalContext;
    card.typicalAgeRange = this._typicalAgeRange;
    card.depends = this._depends.split("/").map(d => d.trim()).filter(d => d.length > 0);
    card.links = this._links;
    card.priority = this._priority !== '' ? parseInt(this._priority) : undefined;
    card.attachments = this._attachments;
    if (!card.author)
      card.author = store.state.app.username;

    console.log(card);

    await store.dispatch.maps.saveTopic(card);
    window.setTimeout(function (navigateAfterSafe) {
      if (navigateAfterSafe) {
        store.dispatch.routing.replace(navigateAfterSafe);
      } else {
        store.dispatch.maps.load();
      }
    }.bind(undefined, this._navigateAfterSave), 1000);

    store.dispatch.uploads.clearUploads();
  }

  _cancel() {
    this._editDialog.close();
    store.dispatch.maps.unsetEditAction();
    store.dispatch.uploads.clearUploads();
  }

  _setSummary() {
    this._summary = this._summaryTextArea.value;
  }

  _setDescription() {
    this._description = this._descriptionTextArea.value;
  }

  _addAttachment() {
    if (!this._card) return;

    if (!this._attachmentName || !(this._attachmentHref || (this._attachmentFile && this._attachmentMime))) {
      store.dispatch.shell.showMessage("unvollständig!");
      return;
    }
    else if (this._attachmentHref && this._attachmentType === "link") {
      this._attachments = [...this._attachments, {
        tag: this._attachmentTag,
        name: this._attachmentName,
        href: this._attachmentHref,
        type: "link",
      }];
    }
    else if (this._attachmentFile && this._attachmentType === "file") {
      this._attachments = [...this._attachments, {
        tag: this._attachmentTag,
        name: this._attachmentName,
        file: this._attachmentFile.name,
        mime: this._attachmentMime,
        type: "file",
      }];
      console.log("upload file");
      store.dispatch.uploads.upload(this._attachmentFile);
    }

    this._attachmentTag = '';
    this._attachmentName = '';
    this._attachmentMime = '';
    this._attachmentHref = '';
    this._attachmentFile = undefined;
    this._attachmentForm.reset();
    this._file.clear();
    this.requestUpdate();
  }

  _deleteAttachment(attachment) {
    if (!this._card) return;

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
    const old = this._tab;
    if (e.type === "MDCTabBar:activated")
      this._tab = e.detail.index === 0 ? 'editor' : 'preview';
    else if (e.key === "p" && e.altKey === true)
      this._tabBar.activeIndex = this._tab === 'editor' ? 1 : 0;

    if (old !== this._tab && this._tab === 'editor')
      this._descriptionTextArea.focus();
  }

  _copy(attachment: Attachment) {
    if (attachment.file)
      navigator.clipboard.writeText(`<img width="" height="" src="inline:${attachment.file}" alt=""/>`);
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
        mwc-select { width: 100% }
        .attachment {
          display: block;
        }
        .attachment span[slot=secondary] {
          display: block;
          width: 100%;
          overflow: hidden;
          text-overflow: ellipsis;
          font-size: small;
        }
        .tag {
          font-family: 'Robot Mono', monospace;
          white-space: pre;
          font-size: small;
          letter-spacing: 0px;
          vertical-align: middle;
        }
        [hidden] {
          display: none;
        }
    `];
  }

  render() {
    const styles = this._attachmentType === "link"
      ? {
        gridTemplateColumns: "1fr 1fr 36px 2fr 36px"
      } : {
        gridTemplateColumns: "1fr 1fr 36px 1fr 1fr 36px"
      };

    // language=HTML
    return html`
<mwc-dialog id="editDialog" heading="Editor" @keydown="${this._switchTab}">
${this._card ? html`
  <mwc-tab-bar id="tabBar" @MDCTabBar:activated="${this._switchTab}">
    <mwc-tab label="Editor"></mwc-tab>
    <mwc-tab label="Preview"></mwc-tab>
  </mwc-tab-bar>
  <div ?hidden="${this._tab === 'preview'}">
    <validating-form @keydown="${this._captureEnter}" @validity="${e => this._valid = e.target.valid}">
      <div class="form">
        <mwc-textfield s3 id="topic" name="topic" disabled label="Thema" dense type="text" .value="${this._card.topic !== '_' ? this._card.topic : "Allgemeines zu " + this._card.chapter}"></mwc-textfield>
        <mwc-textfield s2 ?hidden="${this._card.topic === '_'}" id="links" name="links" label="Verweist auf ..." dense type="text" .value="${this._links}" @change="${e => this._links = e.target.value}" pattern="^([^/.]*)$"></mwc-textfield>
        <mwc-textfield s1 ?hidden="${this._card.topic === '_'}" id="priority" name="priority" label="Priorität" dense type="number" inputmode="numeric" min="0" step="1" .value="${this._priority}" @change="${e => this._priority = e.target.value}"></mwc-textfield>
        <mwc-textfield s5 ?hidden="${this._card.topic === '_'}" ?dialogInitialFocus="${this._card.topic !== '_'}" id="depends" label="Basiert auf ..." dense .value=${this._depends} @change="${e => this._depends = e.target.value}"></mwc-textfield>
        <mwc-textfield s1 ?hidden="${this._card.topic === '_'}" id="thumb" label="Thumbnail" dense .value=${this._thumb} @change="${e => this._thumb = e.target.value}"></mwc-textfield>
        <mwc-textfield s5 ?hidden="${this._card.topic === '_'}" id="keywords" label="Keywords" dense .value=${this._keywords} @change="${e => this._keywords = e.target.value}"></mwc-textfield>
        <mwc-textfield s1 ?hidden="${this._card.topic === '_'}" id="sgs" label="SGS" dense .value=${this._sgs} @change="${e => this._sgs = e.target.value}"></mwc-textfield>
        <mwc-textfield s2 ?hidden="${this._card.topic === '_'}" id="educationalLevel" label="Klassenstufe" helper="Z.B. 11, 12" dense .value=${this._educationalLevel} @change="${e => this._educationalLevel = e.target.value}" pattern="^ ?[0-9]{1,2} ?(, ?[0-9]{1,2} ?)*"></mwc-textfield>
        <mwc-textfield s2 ?hidden="${this._card.topic === '_'}" id="educationalContext" label="Kontext" helper="Z.B. Primarstufe, Sekundarstufe I" dense .value=${this._educationalContext} @change="${e => this._educationalContext = e.target.value}"></mwc-textfield>
        <mwc-textfield s2 ?hidden="${this._card.topic === '_'}" id="typicalAgeRange" label="Alter" disabled dense .value=${this._typicalAgeRange}></mwc-textfield>
        <mwc-textarea s6 id="summary" label="Kurztext" ?dialogInitialFocus="${this._card.topic === '_'}" dense ?required=${this._description} fullwidth rows="2" .value=${this._card.summary} @keyup="${this._setSummary}"></mwc-textarea>
        <mwc-textarea s6 id="description" label="Langtext" dense fullwidth rows="9" .value=${this._card.description} @keyup="${this._setDescription}"></mwc-textarea>
      </div>
    </validating-form>

    <div class="attachments">
      <label for="attachments">Materialien</label><br/>
      ${this._attachments.map((attachment) => html`
        <div class="form" style="grid-template-columns: 1fr 36px">
          <div @click="${() => this._copy(attachment)}">
            <span>[${this._tag(attachment.tag)}] ${attachment.name}</span><br/>
            ${attachment.type === 'link' ? html`
              <span slot="secondary">${attachment.href}</span>
            ` : html`
              <span slot="secondary">${attachment.file} (${attachment.mime})</span>
            `}
          </div>
          <mwc-icon-button icon="delete" @click="${() => this._deleteAttachment(attachment)}"></mwc-icon-button>
        </div>
      `)}
    </div>
    <validating-form id="attachmentForm" @validity="${e => this._attachmentValid = e.target.valid}">
      <div class="form" style="${styleMap(styles)}" @dragover="${() => this._attachmentType = 'file'}">
        <mwc-select id="tag" label="Tag" .value="${this._attachmentTag}" @change="${e => this._attachmentTag = e.target.value}">
          <mwc-list-item value="">Kein Tag</mwc-list-item>
          ${Array.from(_tags).map(([key, value]) => html`
            <mwc-list-item value="${key}">${value}</mwc-list-item>
          `)}
        </mwc-select>
        <mwc-textfield id="name" type="text" label="Name" .value="${this._attachmentName}" @change="${e => this._attachmentName = e.target.value}"></mwc-textfield>
        <mwc-icon-button-toggle ?on="${this._attachmentType === 'file'}" onIcon="attachment" offIcon="link" @MDCIconButtonToggle:change="${e => this._attachmentType = e.detail.isOn ? 'file' : 'link'}"></mwc-icon-button-toggle>
        <mwc-textfield ?hidden="${this._attachmentType === "file"}" id="href" type="url" label="Link" .value="${this._attachmentHref}" @change="${e => this._attachmentHref = e.target.value}"></mwc-textfield>
        <file-drop ?hidden="${this._attachmentType === "link"}" id="file" @filedrop="${this._fileDrop}"></file-drop>
        <mwc-textfield ?hidden="${this._attachmentType === "link"}" id="mime" type="text" label="MimeType" .value="${this._attachmentMime}" @change="${e => this._attachmentMime = e.target.value}"></mwc-textfield>
        <mwc-icon-button class="add" icon="add_circle" @click="${this._addAttachment}"></mwc-icon-button>
      </div>
    </validating-form>
  </div>
    <div ?hidden="${this._tab === 'editor'}">
      <kmap-summary-card-summary .summary="${this._summary}"></kmap-summary-card-summary>
      <hr/>
      <kmap-knowledge-card-description
        .subject="${this._card.subject}"
        .chapter="${this._card.chapter}"
        .topic="${this._card.topic}"
        .description="${this._description}"
        .instance="${this._instance}">
      </kmap-knowledge-card-description>
    </div>
` : ''}

  <mwc-button slot="secondaryAction" @click=${this._cancel}>Abbrechen</mwc-button>
  <mwc-button ?disabled="${this._pendingUploads || !this._valid}" slot="primaryAction" @click=${this._save}>Speichern</mwc-button>
</mwc-dialog>
    `;
  }

  private _fileDrop(e) {
    this._attachmentFile = e.detail.file as File;
    if (this._attachmentName === "") {
      this._attachmentName = this._attachmentFile.name.includes(".") ? this._attachmentFile.name.substr(0, this._attachmentFile.name.lastIndexOf(".")) : this._attachmentFile.name;
    }
    if (this._attachmentMime === "") {
      this._attachmentMime = this._attachmentFile.type;
    }
  }

  private _tag(tag: string) {
    return !tag ? "---" : _tags.get(tag);
  }
}

const _tags = new Map([
  ["explanation", "Erklärung"],
  ["example",     "Beispiel"],
  ["usage",       "Anwendung"],
  ["idea",        "Anschauung"],
  ["exercise",    "Aufgaben"],
]);
