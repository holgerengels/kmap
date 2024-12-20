import {html, css} from 'lit';
import {customElement, property, query, state} from 'lit/decorators.js';
import {Connected} from "./connected";
import {State, store} from "../store";

import '@material/mwc-button';
import '@material/mwc-checkbox';
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
import { KmapHtmlEditor } from "kmap-html-editor";
import './kmap-knowledge-card-description';
import './file-drop';
import './validating-form';
import {resetStyles, colorStyles, fontStyles, formStyles} from "./kmap-styles";

import {Dialog} from "@material/mwc-dialog/mwc-dialog";
import {TextArea} from "@material/mwc-textarea/mwc-textarea";
import {TabBar} from "@material/mwc-tab-bar/mwc-tab-bar";
import {throttle} from "../debounce";
import {Attachment, Upload, Card} from "../models/types";
import {FileDrop} from "./file-drop";
import {styleMap} from "lit/directives/style-map.js";

@customElement('kmap-editor-edit-dialog')
export class KMapEditorEditDialog extends Connected {
  @state()
  private _instance: string = '';

  @state()
  private _card?: Card = undefined;
  @state()
  private _meta: string = '';
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
  private _depends: string = '';
  @state()
  private _links: string = '';
  @state()
  private _priority: string = '';
  @state()
  private _author: string = '';
  @state()
  private _created: string = '';

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

  @state()
  private _attachments: Attachment[] = [];
  @state()
  private _uploads: Upload[] = [];
  @state()
  private _pendingUploads: boolean = false;

  @state()
  private _skills: string = '';

  @state()
  private _minor: boolean = false;

  @state()
  private _navigateAfterSave?: string = '';

  @state()
  private _wide: boolean = false;
  @state()
  private _tab: string = 'editor';
  @state()
  private _metaVisible: boolean = false;
  @state()
  private _contentVisible: boolean = false;
  @state()
  private _previewVisible: boolean = false;

  @query('#editDialog')
  private _editDialog: Dialog;
  @query('#meta')
  private _metaTextArea: TextArea;
  @query('#summary')
  private _summaryTextArea: TextArea;
  @query('#description')
  private _descriptionEditor: KmapHtmlEditor;
  @query('#tabBar')
  private _tabBar: TabBar;

  @state()
  private _metaValid: boolean = false;
  @state()
  private _contentValid: boolean = false;
  @property()
  // @ts-ignore
  private _attachmentValid: boolean = false;

  @query('#attachmentForm')
  private _attachmentForm: HTMLFormElement;
  @query('#file')
  private _file: FileDrop;

  mapState(state: State) {
    return {
      _wide: state.shell.wide,
      _instance: state.app.instance,
      _card: state.maps.editAction?.action === "edit" ? state.maps.editAction.card : undefined,
      _uploads: state.uploads.uploads,
    };
  }

  constructor() {
    super();
    this._setMeta = throttle(this._setMeta, 1000, this);
    this._setSummary = throttle(this._setSummary, 1000, this);
    //this._setDescription = throttle(this._setDescription, 1000, this);
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
      this._meta = this._card.meta || '';
      this._summary = this._card.summary || '';
      this._description = this._card.description || '';
      this._thumb = this._card.thumb || '';
      this._keywords = this._card.keywords || '';
      this._sgs = this._card.sgs || '';
      this._educationalLevel = this._card.educationalLevel || '';
      this._educationalContext = this._card.educationalContext || '';
      this._typicalAgeRange = this._card.typicalAgeRange || '';
      this._depends = this._card.depends ? this._card.depends.join(" / ") : '';
      this._links = this._card.links || '';
      this._priority = this._card.priority !== undefined ? this._card.priority + '' : '';
      this._author      = this._card.author || store.state.app.username || '';
      this._created     = new Date(this._card.created || new Date().getTime()).toLocaleDateString('de-DE', { year: 'numeric', month: 'numeric', day: 'numeric' });
      this._attachments = this._card.attachments;
      this._skills = this._card.skills ? this._card.skills.join("\n") : "";

      this._editDialog.show();

      this._metaValid = true;
      this._contentValid = true;
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

    if (changedProperties.has("_uploads")) {
      this._pendingUploads = this._uploads.some(u => u.uploading);
    }

    if (changedProperties.has("_tab") || changedProperties.has("_wide")) {
      this._metaVisible = this._tab === 'meta';
      this._contentVisible = this._tab === 'content';
      this._previewVisible = this._wide || this._tab === 'preview';
      if (this._tab === 'preview' && this._wide)
        this._tabBar.activeIndex = 1;
    }
  }

  async _save() {
    this._editDialog.close();
    if (!this._card)
      return;

    const card: Card = this._card;
    card.meta = this._meta;
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
    card.skills = this._skills ? this._skills.split("\n").filter(l => l.trim() !== '') : [];
    card.author = this._author;
    card.created = (this._created !== '' ? new Date(this._created.replace(/(\d{1,2})\.(\d{1,2})\.(\d{2,4})/, '$3-$2-$1')) : new Date()).getTime();
    card.minorEdit = this._minor;

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

  _setMeta() {
    this._meta = this._metaTextArea.value;
  }

  _setSummary() {
    this._summary = this._summaryTextArea.value;
  }

  /*
  _setDescription() {
    this._description = this._descriptionEditor.value;
  }
   */

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
      this._attachments = [...this._attachments.filter(a => a.name !== this._attachmentName), {
        tag: this._attachmentTag,
        name: this._attachmentName,
        file: this._attachmentFile.name,
        mime: this._attachmentMime,
        type: "file",
      }];
      console.log("upload file");
      store.dispatch.uploads.upload(this._attachmentFile);
    }

    this._attachmentFile = undefined;
    this._attachmentTag = '';
    this._attachmentName = '';
    this._attachmentMime = '';
    this._attachmentHref = '';
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
      this._tab = !this._wide ? ['meta', 'content', 'preview'][e.detail.index] : ['meta', 'content'][e.detail.index];

    if (this._contentVisible)
      this._descriptionEditor.focus();
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
        .wide {
          display: grid;
          grid-template-columns: 1fr fit-content(40%);
          grid-template-rows: min-content 3fr 1fr;
          grid-template-areas:
            "tab preview"
            "content preview"
            "attachments preview"
          ;
          column-gap: 32px;
          justify-items: stretch;
          height: inherit;
        }
        .narrow {
          display: grid;
          grid-template-columns: 1fr;
          grid-template-rows: min-content 3fr 1fr;
          justify-items: stretch;
          height: inherit;
        }
        .narrow[tab=meta] {
          grid-template-areas:
            "tab"
            "meta"
            "attachments"
          ;
        }
        .narrow[tab=content] {
          grid-template-areas:
            "tab"
            "content"
            "attachments"
          ;
        }
        .narrow[tab=preview] {
          grid-template-areas:
            "tab"
            "preview"
            "preview"
          ;
        }
        .tab { grid-area: tab; }
        .content { grid-area: content; }
        .meta { grid-area: meta; }
        .attachments { grid-area: attachments; }
        .preview { grid-area: preview; }
        .content {
          display: grid;
          grid-template-rows: min-content min-content 3fr;
        }
        .preview {
          overflow-y: auto;
          max-width: 800px;
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
        .tag {
          font-family: 'Robot Mono', monospace;
          white-space: pre;
          font-size: small;
          letter-spacing: 0px;
          vertical-align: middle;
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
    return this._card ? html`
      <mwc-dialog id="editDialog" heading="Editor" @keydown="${this._captureKeys}">
        <div class="dialog">
          <div class="${this._wide ? 'wide' : 'narrow'}" tab="${this._tab}">
            <mwc-tab-bar id="tabBar" @MDCTabBar:activated="${this._switchTab}">
              <mwc-tab label="Metadaten"></mwc-tab>
              <mwc-tab label="Inhalt"></mwc-tab>
              <mwc-tab label="Preview" ?hidden="${this._wide}"></mwc-tab>
            </mwc-tab-bar>
            ${this.renderMeta()}
            ${this.renderContent()}
            ${this.renderAttachments()}
            ${this.renderPreview()}
          </div>
        </div>

        <mwc-formfield label="Geringfügige Änderung" slot="secondaryAction" style="vertical-align: middle"><mwc-checkbox @change="${e => this._minor = e.target.checked}"></mwc-checkbox></mwc-formfield>
        <mwc-button slot="secondaryAction" @click=${this._cancel}>Abbrechen</mwc-button>
        <mwc-button ?disabled="${this._pendingUploads || !this._metaValid || !this._contentValid}" slot="primaryAction" @click=${this._save}>Speichern</mwc-button>
      </mwc-dialog>` : '';
  }

  renderMeta() {
    // language=HTML
    return this._card ? html`
      <validating-form class="meta" @keydown="${this._captureKeys}" @validity="${e => this._metaValid = e.target.valid}" ?hidden="${!this._metaVisible}">
        <div class="form">
          <mwc-textfield s3 id="topic" name="topic" disabled label="Thema" dense type="text" .value="${this._card.topic !== '_' ? this._card.topic : "Allgemeines zu " + this._card.chapter}"></mwc-textfield>
          <mwc-textfield s2 ?hidden="${this._card.topic === '_'}" id="links" name="links" label="Verweist auf ..." dense type="text" .value="${this._links}" @change="${e => this._links = e.target.value}" pattern="^([^/.]*)$"></mwc-textfield>
          <mwc-textfield s1 ?hidden="${this._card.topic === '_'}" id="priority" name="priority" label="Priorität" dense type="number" inputmode="numeric" min="0" step="1" .value="${this._priority}" @change="${e => this._priority = e.target.value}"></mwc-textfield>
          <mwc-textfield s5 ?hidden="${this._card.topic === '_'}" ?dialogInitialFocus="${this._card.topic !== '_'}" id="depends" label="Basiert auf ..." dense .value=${this._depends} @change="${e => this._depends = e.target.value}"></mwc-textfield>
          <mwc-textfield s1 ?hidden="${this._card.topic === '_'}" id="thumb" label="Thumbnail" dense .value=${this._thumb} @change="${e => this._thumb = e.target.value}"></mwc-textfield>
          <mwc-textfield s5 ?hidden="${this._card.topic === '_'}" id="keywords" label="Keywords" dense .value=${this._keywords} @change="${e => this._keywords = e.target.value}"></mwc-textfield>
          <mwc-textfield s1 ?hidden="${this._card.topic === '_'}" id="sgs" label="SGS" dense .value=${this._sgs} @change="${e => this._sgs = e.target.value}" required></mwc-textfield>
          <mwc-textfield s2 ?hidden="${this._card.topic === '_'}" id="educationalLevel" label="Klassenstufe" helper="Z.B. 11, 12" dense .value=${this._educationalLevel} @change="${e => this._educationalLevel = e.target.value}" pattern="^ ?[0-9]{1,2} ?(, ?[0-9]{1,2} ?)*" required></mwc-textfield>
          <mwc-textfield s2 ?hidden="${this._card.topic === '_'}" id="educationalContext" label="Kontext" helper="Z.B. Primarstufe, Sekundarstufe I" dense .value=${this._educationalContext} @change="${e => this._educationalContext = e.target.value}" required></mwc-textfield>
          <mwc-textfield s2 ?hidden="${this._card.topic === '_'}" id="typicalAgeRange" label="Alter" disabled dense .value=${this._typicalAgeRange}></mwc-textfield>
          <mwc-textfield s2 ?hidden="${this._card.topic === '_'}" id="author" label="Autor" dense .value=${this._author} @change="${e => this._author = e.target.value}" required></mwc-textfield>
          <mwc-textfield s2 ?hidden="${this._card.topic === '_'}" id="created" label="Erstellt" dense .value=${this._created} @change="${e => this._created = e.target.value}" pattern="^\\d{1,2}\\.\\d{1,2}\\.\\d{2,4}$" required></mwc-textfield>
          <mwc-textarea s5 ?hidden="${this._card.topic === '_'}" id="skills" label="Kompetenzen" rows="3" dense .value=${this._skills} @change="${e => this._skills = e.target.value}"></mwc-textarea>
        </div>
      </validating-form>
    ` : '';
  }

  renderContent() {
    // language=HTML
    return this._card ? html`
      <div class="content" ?hidden="${!this._contentVisible}">
        <validating-form @keydown="${this._captureKeys}" @validity="${e => this._contentValid = e.target.valid}">
          <mwc-textarea id="summary" label="Kurztext" ?dialogInitialFocus="${this._card.topic === '_'}" dense
                        ?required=${this._description} fullwidth rows="1" .value=${this._summary}
                        @keyup="${this._setSummary}"></mwc-textarea>
          <mwc-textarea id="meta" label="Metatext" dense
                        ?required=${this._summary} fullwidth rows="1" .value=${this._meta}
                        @keyup="${this._setMeta}"></mwc-textarea>
          <div class="scrollcontainer">
            <kmap-html-editor id="description" placeholder="Inhalt" .value=${this._description} @change="${e => this._description = e.detail.value}"></kmap-html-editor>
          </div>
        </validating-form>
      </div>
    ` : '';
  }

  renderAttachments() {
    // language=HTML
    return html`
        <div class="scrollcontainer" ?hidden="${!this._contentVisible && !this._metaVisible}">
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
        </div>
        <validating-form id="attachmentForm" @validity="${e => this._attachmentValid = e.target.valid}"
                         ?hidden="${!this._contentVisible && !this._metaVisible}">
          <div class="form" style="${styleMap(this._attachmentFormStyles(this._attachmentType))}"
               @dragover="${() => this._attachmentType = 'file'}">
            <mwc-select id="tag" label="Tag" .value="${this._attachmentTag}"
                        @change="${e => this._attachmentTag = e.target.value}">
              <mwc-list-item value="">Kein Tag</mwc-list-item>
              ${Array.from(_tags).map(([key, value]) => html`
                <mwc-list-item value="${key}">${value}</mwc-list-item>
              `)}
            </mwc-select>
            <mwc-textfield id="name" type="text" label="Name" .value="${this._attachmentName}"
                           @change="${e => this._attachmentName = e.target.value}"></mwc-textfield>
            <mwc-icon-button-toggle ?on="${this._attachmentType === 'file'}" onIcon="attachment" offIcon="link"
                                    @icon-button-toggle-change="${e => this._attachmentType = e.detail.isOn ? 'file' : 'link'}"></mwc-icon-button-toggle>
            <mwc-textfield ?hidden="${this._attachmentType === "file"}" id="href" type="url" label="Link"
                           .value="${this._attachmentHref}"
                           @change="${e => this._attachmentHref = e.target.value}"></mwc-textfield>
            <file-drop ?hidden="${this._attachmentType === "link"}" id="file" @filedrop="${this._fileDrop}"></file-drop>
            <mwc-textfield ?hidden="${this._attachmentType === "link"}" id="mime" type="text" label="MimeType"
                           .value="${this._attachmentMime}"
                           @change="${e => this._attachmentMime = e.target.value}"></mwc-textfield>
            <mwc-icon-button class="add" icon="add_circle" @click="${this._addAttachment}"></mwc-icon-button>
          </div>
        </validating-form>
    `;
  }
  renderPreview() {
    // language=HTML
    return this._card ? html`
      <div class="preview" ?hidden="${!this._previewVisible}">
        <br/>
        ${this._summary}
        <hr/>
        <kmap-knowledge-card-description
          .subject="${this._card.subject}"
          .chapter="${this._card.chapter}"
          .topic="${this._card.topic}"
          .description="${this._description}"
          .instance="${this._instance}">
        </kmap-knowledge-card-description>
      </div>
    ` : '';
  }

  private _attachmentFormStyles(type) {
    return type === "link"
      ? {
        gridTemplateColumns: "1fr 1fr 36px 2fr 36px"
      } : {
        gridTemplateColumns: "1fr 1fr 36px 1fr 1fr 36px"
      };
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
