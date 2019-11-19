import {css, html, LitElement} from 'lit-element';
import {connect} from "pwa-helpers/connect-mixin";
import {store} from "../store";
import {navigate, logout, unsetCardForEdit, showMessage} from "../actions/app";
import {saveTopic} from "../actions/editor";
import {fetchMapIfNeeded, invalidateMap} from "../actions/maps";
import {handleErrors} from "../actions/fetchy";
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

class KMapEditorEditDialog extends connect(store)(LitElement) {
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
mwc-textfield, mwc-textarea {
    margin-bottom: 4px;
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
kmap-summary-card-summary {
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
    `];
  }

  render() {
    // language=HTML
    return html`
<mwc-dialog id="editDialog" title="Editor">
${this._card ? html`
  <form @focus="${this._focus}" @keydown="${this._captureEnter}">
    <mwc-textfield id="topic" name="topic" disabled label="Thema" dense type="text" .value="${this._card.topic !== '_' ? this._card.topic : "Allgemeines zu " + this._card.chapter}"></mwc-textfield>
    <br/>
    <mwc-textfield ?hidden="${this._card.topic === '_'}" id="links" name="links" label="Verweist auf ..." dense type="text" .value="${this._card.links}" @change="${e => this._card.links = e.target.value}"></mwc-textfield>
    <mwc-textfield ?hidden="${this._card.topic === '_'}" id="priority" name="priority" label="Priorität" dense type="number" inputmode="numeric" min="0" step="1" .value="${this._card.priority}" @change="${e => this._card.priority = e.target.value}"></mwc-textfield>
    <mwc-textarea ?hidden="${this._card.topic === '_'}" id="depends" placeholder="Basiert auf ..." dense fullwidth rows="2" .value=${this._depends}></mwc-textarea>
    <mwc-textarea id="summary" placeholder="Kurztext" dense fullwidth rows="2" .value=${this._card.summary} @keyup="${this._setSummary}" @focus="${this._focus}" @blur="${this._focus}"></mwc-textarea>
    <mwc-textarea id="description" placeholder="Langtext" dense fullwidth rows="7" .value=${this._card.description} @keyup="${this._setDescription}" @focus="${this._focus}" @blur="${this._focus}"></mwc-textarea>

    <div class="field attachments">
      <label for="attachments">Materialien</label>
      ${this._card.attachments.map((attachment, i) => html`
        <div class="attachment">
          ${attachment.type === 'link' ? html`<mwc-icon @click="${() => this._deleteAttachment(attachment)}">delete</mwc-icon>` : ''}
          <span class="tag">[${_tags.get(attachment.tag)}]</span> ${attachment.name}
          ${attachment.type === 'link' ? html`<span slot="secondary">${attachment.href}</span>` : ''}
        </div>
      `)}
      <select id="tag" placeholder="Tag" .value="${this._attachmentTag}" @change="${e => this._attachmentTag = e.target.value}">
        <option value="">- - -</option>
        ${Array.from(_tags).map(([key, value]) => html`
          <option value="${key}">${value}</option>
        `)}
      </select>
      <input id="name" type="text" placeholder="Name" .value="${this._attachmentName}" @change="${e => this._attachmentName = e.target.value}"/>
      <input id="href" type="url" placeholder="Link" .value="${this._attachmentHref}" @change="${e => this._attachmentHref = e.target.value}"/>
      <mwc-icon @click="${this._addAttachment}">add_circle</mwc-icon>
    </div>
  </form>` : ''}
  <div class="preview">
  ${this._showSummaryPreview ? html`<kmap-summary-card-summary .summary="${this._summary}"></kmap-summary-card-summary>` : ''}
  ${this._showDescriptionPreview ? html`<div class="preview-scroller"><kmap-knowledge-card-description 
    .subject="${this._subject}"
    .chapter="${this._chapter}"
    .topic="${this._card.topic}"
    .description="${this._description}"
    ></kmap-knowledge-card-description></div>` : ''}
  </div>

  <mwc-icon-button slot="secondaryAction" icon="cached" title="Materialien aus Cloud synchronisieren" @click=${this._syncAttachments}></mwc-icon-button>
  <mwc-icon-button slot="secondaryAction" icon="folder_open" title="Cloud Verzeichnis öffnen" @click=${this._createDirectory}></mwc-icon-button>
  <mwc-button slot="secondaryAction" @click=${this._cancel}>Abbrechen</mwc-button>
  <mwc-button slot="primaryAction" @click=${this._save}>Speichern</mwc-button>
</mwc-dialog>
    `;
    }

  static get properties() {
    return {
      _instance: {type: String},
      _userid: {type: String},
      _subject: {type: String},
      _chapter: {type: String},
      _card: {type: Object},
      _summary: {type: String},
      _description: {type: String},
      _showSummaryPreview: {type: Boolean},
      _showDescriptionPreview: {type: Boolean},
      _depends: {type: String},
      _attachmentTag: {type: String},
      _attachmentName: {type: String},
      _attachmentHref: {type: String},
      _navigateAfterSafe: {type: String},
    };
  }

  constructor() {
    super();
    this._instance = null;
    this._userid = '';
    this._subject = '';
    this._chapter = '';
    this._card = null;
    this._summary = '';
    this._description = '';
    this._showSummaryPreview = false;
    this._showDescriptionPreview = false;
    this._setSummary = this._debounce(this._setSummary.bind(this), 1000);
    this._setDescription = this._debounce(this._setDescription.bind(this), 1000);
    this._depends = '';
    this._attachmentTag = '';
    this._attachmentName = '';
    this._attachmentHref = '';
    this._navigateAfterSafe = null;
  }

  firstUpdated(changedProperties) {
    this._editDialog = this.shadowRoot.getElementById('editDialog');
  }

  updated(changedProperties) {
    if (changedProperties.has('_card') && this._card) {
      this._attachmentTag = '';
      this._attachmentName = '';
      this._attachmentHref = '';
      this._editDialog.open = true;

      this._summary = this._card.summary;
      this._description = this._card.description;
      this._depends = this._card.depends.join(", ");

      this._syncAttachments();
    }
  }

  stateChanged(state) {
    this._instance = state.app.instance;
    this._userid = state.app.userid;
    this._card = state.app.cardForEdit;

    if (state.maps.map) {
      if (this._card) {
        this._subject = this._card.subject ? this._card.subject : state.maps.map.subject;
        this._chapter = this._card.chapter ? this._card.chapter : state.maps.map.chapter;

        this._navigateAfterSafe = state.maps.map.subject !== this._subject || state.maps.map.chapter !== this._chapter
          ? "#browser/" + this._subject + "/" + this._chapter
          : null;

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
    this._editDialog.open = false;

    this._card.subject = this._subject;
    this._card.chapter = this._chapter;
    this._card.summary = this._summary;
    this._card.description = this._description;
    this._card.depends = this._depends.split(",").map(d => d.trim()).filter(d => d.length > 0);
    console.log(this._card);

    store.dispatch(saveTopic(this._subject, this._card.module, this._card))
      .then(store.dispatch(invalidateMap(this._subject, this._chapter)))
      .then(store.dispatch(unsetCardForEdit()))
      .then(lala => window.setTimeout(function(subject, chapter, navigateAfterSafe) {
        if (navigateAfterSafe) {
          window.location = navigateAfterSafe;
          store.dispatch(navigate(navigateAfterSafe));
        }
        else
          store.dispatch(fetchMapIfNeeded(subject, chapter));
      }.bind(undefined, this._subject, this._chapter, this._navigateAfterSafe), 1000));
  }

  _cancel() {
    this._editDialog.open = false;
    store.dispatch(unsetCardForEdit());
  }

  _setSummary() {
    this._summary = this.shadowRoot.getElementById('summary').value;
  }

  _setDescription() {
    this._description = this.shadowRoot.getElementById('description').value;
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

  _addAttachment() {
    if (!this._attachmentTag || !this._attachmentName || !this._attachmentHref) {
      store.dispatch(showMessage("unvollständig!"));
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
    let attachments = [...this._card.attachments];
    attachments.splice(attachments.indexOf(attachment), 1);
    this._card.attachments = attachments;
    this.requestUpdate();
  }

  _syncAttachments() {
    fetch(`${config.server}edit?attachments=${this._subject}/${this._chapter}/${this._card.topic}`, {
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

        var attachments = [];
        if (this._card.attachments)
          attachments.push(...this._card.attachments);

        var i = attachments.length;
        while (i--) {
          if (attachments[i].type !== "link") {
            attachments.splice(i, 1);
          }
        }

        for (let attachment of data.data) {
          if (attachment.tag)
            attachments.unshift(attachment);
          else {
            console.log(attachment.name + " ist nicht getaggt");
          }
        }

        this._card.attachments = attachments;
        this.requestUpdate();
      })
      .catch((error) => {
        store.dispatch(showMessage(error.message));
        if (error.message === "invalid session")
          store.dispatch(logout({userid: this._userid}));
      });
  }

  _createDirectory() {
    fetch(`${config.server}edit?directory=${this._subject}/${this._chapter}/${this._card.topic}`, {
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

  _captureEnter(e) {
    if (!e.metaKey && e.key === "Enter")
      e.cancelBubble = true;
  }
}

const _tags = new Map([
  ["explanation", "Erklärung "],
  ["example",     "Beispiel  "],
  ["usage",       "Anwendung "],
  ["idea",        "Anschauung"],
  ["exercise",    "Aufgaben  "],
]);

window.customElements.define('kmap-editor-edit-dialog', KMapEditorEditDialog);
