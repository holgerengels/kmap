import {LitElement, html, css, customElement, property, query} from 'lit-element';
import {connect} from '@captaincodeman/rdx';
import {State, store} from "../store";

import '@material/mwc-button';
import '@material/mwc-dialog';
import '@material/mwc-formfield';
import '@material/mwc-icon-button';
import '@material/mwc-icon-button-toggle';
import '@material/mwc-list/mwc-list-item';
import '@material/mwc-select';
import '@material/mwc-slider';
import '@material/mwc-textarea';
import '@material/mwc-textfield';
import './kmap-summary-card-summary';
import './kmap-knowledge-card-description';
import './file-drop';
import {colorStyles, fontStyles, themeStyles} from "./kmap-styles";

import {Dialog} from "@material/mwc-dialog/mwc-dialog";
import {TextArea} from "@material/mwc-textarea/mwc-textarea";
import {throttle} from "../debounce";
import {Upload} from "../models/types";
import {Attachment, Card} from "../models/types";


@customElement('kmap-editor-edit-dialog')
export class KMapEditorEditDialog extends connect(store, LitElement) {
  @property()
  private _instance: string = '';

  @property()
  private _card?: Card = undefined;
  @property()
  private _summary: string = '';
  @property()
  private _description: string = '';
  @property()
  private _thumb: string = '';
  @property()
  private _showSummaryPreview: boolean = false;
  @property()
  private _showDescriptionPreview: boolean = false;
  @property()
  private _depends: string = '';
  @property()
  private _links: string = '';
  @property()
  private _priority: string = '';

  @property()
  private _attachmentType: string = 'link';
  @property()
  private _attachmentTag: string = '';
  @property()
  private _attachmentName: string = '';
  @property()
  private _attachmentHref: string = '';
  @property()
  private _attachmentFile?: File = undefined;

  @property()
  private _attachments: Attachment[] = [];
  @property()
  private _uploads: Upload[] = [];
  @property()
  private _pendingUploads: boolean = false;

  @property()
  private _navigateAfterSave?: string = '';

  @query('#editDialog')
  // @ts-ignore
  private _editDialog: Dialog;
  @query('#summary')
  // @ts-ignore
  private _summaryTextArea: TextArea;
  @query('#description')
  // @ts-ignore
  private _descriptionTextArea: TextArea;

  mapState(state: State) {
    return {
      _instance: state.app.instance,
      _card: state.maps.cardForEdit,
      _uploads: state.uploads.uploads,
    };
  }

  constructor() {
    super();
    this._setSummary = throttle(this._setSummary, 1000, this);
    this._setDescription = throttle(this._setDescription, 1000, this);
  }

  updated(changedProperties) {
    if (changedProperties.has('_card') && this._card) {
      this._navigateAfterSave = store.state.maps.subject !== this._card.subject || store.state.maps.chapter !== this._card.chapter
        ? "/app/browser/" + this._card.subject + "/" + this._card.chapter
        : undefined;

      this._attachmentTag = '';
      this._attachmentName = '';
      this._attachmentHref = '';
      this._attachmentFile = undefined;
      this._summary = this._card.summary;
      this._description = this._card.description;
      this._thumb = this._card.thumb || '';
      this._depends = this._card.depends ? this._card.depends.join(", ") : '';
      this._links = this._card.links || '';
      this._priority = this._card.priority !== undefined ? this._card.priority + '' : '';
      this._attachments = this._card.attachments;

      this._editDialog.show();
      this._editDialog.forceLayout();
    }

    if (changedProperties.has("_uploads")) {
      this._pendingUploads = this._uploads.some(u => u.uploading);
    }
  }

  _focus(e) {
    if (e.type === "blur") {
      this._showSummaryPreview = false;
      this._showDescriptionPreview = false;
    }
    else if (e.type === "focus") {
      if (e.srcElement.id === "summary")
        this._showSummaryPreview = true;
      else if (e.srcElement.id === "description")
        this._showDescriptionPreview = true;
    }
  }

  _save() {
    this._editDialog.close();
    if (!this._card)
      return;

    const card: Card = this._card;
    card.summary = this._summary;
    card.description = this._description;
    card.thumb = this._thumb;
    card.depends = this._depends.split(",").map(d => d.trim()).filter(d => d.length > 0);
    card.links = this._links;
    card.priority = this._priority !== '' ? parseInt(this._priority) : undefined;
    card.attachments = this._attachments;
    console.log(card);

    store.dispatch.maps.saveTopic(card);
    window.setTimeout(function (subject, chapter, navigateAfterSafe) {
      if (navigateAfterSafe) {
        store.dispatch.routing.replace(navigateAfterSafe);
      }
      else
        store.dispatch.maps.load({subject: subject, chapter: chapter});
    }.bind(undefined, card.subject, card.chapter, this._navigateAfterSave), 1000);

    store.dispatch.uploads.clearUploads();
  }

  _cancel() {
    this._editDialog.close();
    store.dispatch.maps.unsetCardForEdit();
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

    if (!this._attachmentName || !(this._attachmentHref || this._attachmentFile)) {
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
        mime: this._attachmentFile.type,
        type: "file",
      }];
      console.log("upload file");
      store.dispatch.uploads.upload(this._attachmentFile);
    }

    this._attachmentTag = '';
    this._attachmentName = '';
    this._attachmentHref = '';
    this._attachmentFile = undefined;
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
        kmap-summary-card-summary {
          z-index: 10000000;
          position: fixed;
          top: 16px;
          left: 16px;
          width: 300px;
          display: block;
          box-sizing: border-box;
          background-color: var(--color-lightgray);
          border-radius: 3px;
          box-shadow: 0 2px 2px 0 rgba(0, 0, 0, 0.14),
          0 1px 5px 0 rgba(0, 0, 0, 0.12),
          0 3px 1px -2px rgba(0, 0, 0, 0.2);
        }
        kmap-knowledge-card-description {
          display: block;
          box-sizing: border-box;
          background-color: var(--color-lightgray);
        }
        div.fields {
          display: flex;
          flex-flow: row wrap;
        }
        div.fields > [s1] {
          flex: 1 1 33.3%;
        }
        div.fields > [s2] {
          flex: 1 1 66.6%;
        }
        div.fields > [s3] {
          flex: 1 1 100%;
        }
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
    // language=HTML
    return html`
${this._card ? html`
  ${this._showSummaryPreview ? html`<kmap-summary-card-summary .summary="${this._summary}"></kmap-summary-card-summary>` : ''}
  ${this._showDescriptionPreview ? html`<div class="preview-scroller"><kmap-knowledge-card-description
    .subject="${this._card.subject}"
    .chapter="${this._card.chapter}"
    .topic="${this._card.topic}"
    .description="${this._description}"
    .instance="${this._instance}">
</kmap-knowledge-card-description></div>` : ''}
  ` : ''}

<mwc-dialog id="editDialog" heading="Editor">
${this._card ? html`
  <form @focus="${this._focus}" @keydown="${this._captureEnter}">
  <div class="fields">
    <mwc-textfield s1 id="topic" name="topic" disabled label="Thema" dense type="text" .value="${this._card.topic !== '_' ? this._card.topic : "Allgemeines zu " + this._card.chapter}"></mwc-textfield>
    <mwc-textfield s1 ?hidden="${this._card.topic === '_'}" id="links" name="links" label="Verweist auf ..." dense type="text" .value="${this._links}" @change="${e => this._links = e.target.value}"></mwc-textfield>
    <mwc-textfield s1 ?hidden="${this._card.topic === '_'}" id="priority" name="priority" label="Priorität" dense type="number" inputmode="numeric" min="0" step="1" .value="${this._priority}" @change="${e => this._priority = e.target.value}"></mwc-textfield>
    <mwc-textfield s2 ?hidden="${this._card.topic === '_'}" ?dialogInitialFocus="${this._card.topic !== '_'}" id="depends" label="Basiert auf ..." dense .value=${this._depends} @change="${e => this._depends = e.target.value}"></mwc-textfield>
    <mwc-textfield s1 ?hidden="${this._card.topic === '_'}" id="thumb" label="Thumbnail" dense .value=${this._thumb} @change="${e => this._thumb = e.target.value}"></mwc-textfield>
    <mwc-textarea s3 id="summary" placeholder="Kurztext" ?dialogInitialFocus="${this._card.topic === '_'}" dense fullwidth rows="2" .value=${this._card.summary} @keyup="${this._setSummary}" @focus="${this._focus}" @blur="${this._focus}"></mwc-textarea>
    <mwc-textarea s3 id="description" placeholder="Langtext" dense fullwidth rows="9" .value=${this._card.description} @keyup="${this._setDescription}" @focus="${this._focus}" @blur="${this._focus}"></mwc-textarea>
</div>

    <div class="attachments">
      <label for="attachments">Materialien</label><br/>
      ${this._attachments.map((attachment) => html`
        <div class="fields">
          <div style="flex: 1 0 auto">
            <span>[${_tags.get(attachment.tag)}] ${attachment.name}</span><br/>
            ${attachment.type === 'link' ? html`
              <span slot="secondary">${attachment.href}</span>
            ` : html`
              <span slot="secondary">${attachment.file} (${attachment.mime})</span>
            `}
          </div>
          <mwc-icon-button icon="delete" @click="${() => this._deleteAttachment(attachment)}" style="flex: 0 0 48px"></mwc-icon-button>
        </div>
      `)}
    </div>
    <div class="fields" @dragover="${() => this._attachmentType = 'file'}">
      <mwc-select id="tag" label="Tag" .value="${this._attachmentTag}" @change="${e => this._attachmentTag = e.target.value}" style="flex: 1 0 15%">
        <mwc-list-item value="">Kein Tag</mwc-list-item>
        ${Array.from(_tags).map(([key, value]) => html`
          <mwc-list-item value="${key}">${value}</mwc-list-item>
        `)}
      </mwc-select>
      <mwc-textfield id="name" type="text" required label="Name" .value="${this._attachmentName}" @change="${e => this._attachmentName = e.target.value}" style="flex: 1 0 25%"></mwc-textfield>
      <mwc-icon-button-toggle ?on="${this._attachmentType === 'file'}" onIcon="attachment" offIcon="link" @MDCIconButtonToggle:change="${e => this._attachmentType = e.detail.isOn ? 'file' : 'link'}" style="flex: 0 0 48px"></mwc-icon-button-toggle>
      <mwc-textfield ?hidden="${this._attachmentType === "file"}" id="href" type="url" required label="Link" .value="${this._attachmentHref}" @change="${e => this._attachmentHref = e.target.value}" style="flex: 1 0 35%"></mwc-textfield>
      <file-drop ?hidden="${this._attachmentType === "link"}" id="file" required @filedrop="${e => this._attachmentFile = e.detail.file}" style="flex: 1 0 35%"></file-drop>
      <mwc-icon-button class="add" icon="add_circle" @click="${this._addAttachment}" style="flex: 0 0 48px"></mwc-icon-button>
    </div>
  </form>` : ''}

  <mwc-button slot="secondaryAction" @click=${this._cancel}>Abbrechen</mwc-button>
  <mwc-button ?disabled="${this._pendingUploads}" slot="primaryAction" @click=${this._save}>Speichern</mwc-button>
</mwc-dialog>
    `;
  }
}

const _tags = new Map([
  [undefined, "---"],
  ["", "---"],
  ["explanation", "Erklärung"],
  ["example",     "Beispiel"],
  ["usage",       "Anwendung"],
  ["idea",        "Anschauung"],
  ["exercise",    "Aufgaben"],
]);
