import {LitElement, html, css, customElement, property, query} from 'lit-element';
import {connect} from '@captaincodeman/rdx';
import {State, store} from "../store";

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
import {colorStyles, fontStyles} from "./kmap-styles";

import {Attachment, Card} from "../models/maps";
import {Dialog} from "@material/mwc-dialog/mwc-dialog";
import {TextArea} from "@material/mwc-textarea/mwc-textarea";

@customElement('kmap-editor-edit-dialog')
export class KMapEditorEditDialog extends connect(store, LitElement) {
  @property()
  private _card?: Card = undefined;
  @property()
  private _summary: string = '';
  @property()
  private _description: string = '';
  @property()
  private _showSummaryPreview: boolean = false;
  @property()
  private _showDescriptionPreview: boolean = false;
  @property()
  private _depends: string = '';
  @property()
  private _attachmentTag: string = '';
  @property()
  private _attachmentName: string = '';
  @property()
  private _attachmentHref: string = '';

  @property()
  private _navigateAfterSave?: string = '';

  @property()
  private _syncedAttachments: Attachment[] = [];
  @property()
  private _cloudPath?: string = undefined;

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
      _card: state.maps.cardForEdit,
      _syncedAttachments: state.cloud.attachments,
      _cloudPath: state.cloud.path,
    };
  }

  constructor() {
    super();
    this._setSummary = this._debounce(this._setSummary.bind(this), 1000, false);
    this._setDescription = this._debounce(this._setDescription.bind(this), 1000, false);
  }

  updated(changedProperties) {
    if (changedProperties.has('_card') && this._card) {
      if (!this._card.subject)
        this._card.subject = store.state.maps.subject;
      if (!this._card.chapter)
        this._card.chapter = store.state.maps.chapter;

      this._navigateAfterSave = store.state.maps.subject !== this._card.subject || store.state.maps.chapter !== this._card.chapter
        ? "/app/browser/" + this._card.subject + "/" + this._card.chapter
        : undefined;

      if (!this._card.summary)
        this._card.summary = '';
      if (!this._card.description)
        this._card.description = '';
      if (!this._card.links)
        this._card.links = '';
      if (!this._card.depends)
        this._card.depends = [];
      if (!this._card.attachments)
        this._card.attachments = [];

      this._attachmentTag = '';
      this._attachmentName = '';
      this._attachmentHref = '';
      this._summary = this._card.summary;
      this._description = this._card.description;
      this._depends = this._card.depends.join(", ");
      this._syncAttachments();

      this._editDialog.show();
    }
    if (changedProperties.has("_syncedAttachments") && this._card) {
      console.log(this._syncedAttachments);

      var attachments: Attachment[] = [];
      if (this._card.attachments)
        attachments.push(...this._card.attachments);

      var i = attachments.length;
      while (i--) {
        if (attachments[i].type !== "link") {
          attachments.splice(i, 1);
        }
      }

      if (this._syncedAttachments) {
        for (let attachment of this._syncedAttachments) {
          if (attachment.tag)
            attachments.unshift(attachment);
          else {
            console.log(attachment.name + " ist nicht getaggt");
          }
        }
      }

      this._card.attachments = attachments;
      this.requestUpdate();
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
    card.depends = this._depends.split(",").map(d => d.trim()).filter(d => d.length > 0);
    console.log(card);

    store.dispatch.maps.saveTopic(card);
    window.setTimeout(function (subject, chapter, navigateAfterSafe) {
      if (navigateAfterSafe) {
        // @ts-ignore
        store.dispatch.routing.replace(navigateAfterSafe);
      }
      else
        store.dispatch.maps.load({subject: subject, chapter: chapter});
    }.bind(undefined, card.subject, card.chapter, this._navigateAfterSave), 1000);
  }

  _cancel() {
    this._editDialog.close();
    store.dispatch.maps.unsetCardForEdit();
  }

  _setSummary() {
    this._summary = this._summaryTextArea.value;
  }

  _setDescription() {
    this._description = this._descriptionTextArea.value;
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

  _addAttachment() {
    if (!this._card) return;

    if (!this._attachmentTag || !this._attachmentName || !this._attachmentHref) {
      store.dispatch.shell.showMessage("unvollständig!");
    }
    else {
      this._card.attachments = [...this._card.attachments, {
        tag: this._attachmentTag,
        name: this._attachmentName,
        href: this._attachmentHref,
        type: "link",
      }];
      this._attachmentTag = '';
      this._attachmentName = '';
      this._attachmentHref = '';
      this.requestUpdate();
    }
  }

  _deleteAttachment(attachment) {
    if (!this._card) return;

    let attachments = [...this._card.attachments];
    attachments.splice(attachments.indexOf(attachment), 1);
    this._card.attachments = attachments;
    this.requestUpdate();
  }

  _syncAttachments() {
    if (!this._card) return;

    store.dispatch.cloud.fetchAttachments({
      subject: this._card.subject,
      chapter: this._card.chapter,
      topic: this._card.topic
    });
  }

  _createDirectory() {
    if (!this._card) return;

    store.dispatch.cloud.createDirectory({
      subject: this._card.subject,
      chapter: this._card.chapter,
      topic: this._card.topic
    });
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
        .attachment {
          display: block;
        }
        .attachments mwc-icon {
          pointer-events: all;
          cursor: pointer;
          vertical-align: middle;
          float: right;
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
        select {
          font-size:16px;
          border: none;
          border-bottom: 1px solid var(--color-mediumgray);
          padding: 18px 6px;
          background-color: var(--color-lightgray);
          outline: none;
        }
        select:focus {
          border-bottom: 2px solid var(--color-primary);
          padding-bottom: 17px;
        }
        option {
          font-size:16px;
          background-color:#ffffff;
        }
        mwc-icon.add {
          margin-left: 4px;
          margin-top: 16px;
        }
        [hidden] {
          display: none;
        }
    `];
  }

  render() {
    // language=HTML
    return html`
  ${this._showSummaryPreview ? html`<kmap-summary-card-summary .summary="${this._summary}"></kmap-summary-card-summary>` : ''}
  ${this._showDescriptionPreview ? html`<div class="preview-scroller"><kmap-knowledge-card-description
    .subject="${this._card.subject}"
    .chapter="${this._card.chapter}"
    .topic="${this._card.topic}"
    .description="${this._description}"
    ></kmap-knowledge-card-description></div>` : ''}

<mwc-dialog id="editDialog" heading="Editor">
${this._card ? html`
  <form @focus="${this._focus}" @keydown="${this._captureEnter}">
    <mwc-textfield id="topic" name="topic" disabled label="Thema" dense type="text" .value="${this._card.topic !== '_' ? this._card.topic : "Allgemeines zu " + this._card.chapter}"></mwc-textfield>
    <br/>
    <mwc-textfield ?hidden="${this._card.topic === '_'}" id="links" name="links" label="Verweist auf ..." dense type="text" .value="${this._card.links}" @change="${e => this._card.links = e.target.value}"></mwc-textfield>
    <mwc-textfield ?hidden="${this._card.topic === '_'}" id="priority" name="priority" label="Priorität" dense type="number" inputmode="numeric" min="0" step="1" .value="${this._card.priority}" @change="${e => this._card.priority = e.target.value}"></mwc-textfield>
    <mwc-textarea ?hidden="${this._card.topic === '_'}" ?dialogInitialFocus="${this._card.topic !== '_'}" id="depends" placeholder="Basiert auf ..." dense fullwidth rows="2" .value=${this._depends} @change="${e => this._depends = e.target.value}"></mwc-textarea>
    <mwc-textarea id="summary" placeholder="Kurztext" ?dialogInitialFocus="${this._card.topic === '_'}" dense fullwidth rows="2" .value=${this._card.summary} @keyup="${this._setSummary}" @focus="${this._focus}" @blur="${this._focus}"></mwc-textarea>
    <mwc-textarea id="description" placeholder="Langtext" dense fullwidth rows="7" .value=${this._card.description} @keyup="${this._setDescription}" @focus="${this._focus}" @blur="${this._focus}"></mwc-textarea>

    <div class="field attachments">
      <label for="attachments">Materialien</label><br/>
      ${this._card.attachments.map((attachment) => html`
        <div class="attachment">
          ${attachment.type === 'link' ? html`<mwc-icon @click="${() => this._deleteAttachment(attachment)}">delete</mwc-icon>` : ''}
          <span class="tag">[${_tags.get(attachment.tag)}]</span> ${attachment.name}
          ${attachment.type === 'link' ? html`<span slot="secondary">${attachment.href}</span>` : ''}
        </div>
      `)}
      <mwc-select id="tag" placeholder="Tag" .value="${this._attachmentTag}" @change="${e => this._attachmentTag = e.target.value}" required>
        ${Array.from(_tags).map(([key, value]) => html`
          <mwc-list-item value="${key}">${value}</mwc-list-item>
        `)}
      </mwc-select>
      <mwc-textfield id="name" type="text" required placeholder="Name" .value="${this._attachmentName}" @change="${e => this._attachmentName = e.target.value}"></mwc-textfield>
      <mwc-textfield id="href" type="url" required placeholder="Link" .value="${this._attachmentHref}" @change="${e => this._attachmentHref = e.target.value}"></mwc-textfield>
      <mwc-icon class="add" @click="${this._addAttachment}">add_circle</mwc-icon>
    </div>
  </form>` : ''}

  <mwc-icon-button slot="secondaryAction" icon="cached" title="Materialien aus Cloud synchronisieren" @click=${this._syncAttachments}></mwc-icon-button>
  <mwc-icon-button slot="secondaryAction" icon="folder_open" title="Cloud Verzeichnis öffnen" @click=${this._createDirectory}></mwc-icon-button>
  <mwc-button slot="secondaryAction" @click=${this._cancel}>Abbrechen</mwc-button>
  <mwc-button slot="primaryAction" @click=${this._save}>Speichern</mwc-button>
</mwc-dialog>
    `;
  }
}

const _tags = new Map([
  ["explanation", "Erklärung "],
  ["example",     "Beispiel  "],
  ["usage",       "Anwendung "],
  ["idea",        "Anschauung"],
  ["exercise",    "Aufgaben  "],
]);
