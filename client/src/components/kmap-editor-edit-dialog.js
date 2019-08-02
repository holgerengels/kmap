import {css, html, LitElement} from 'lit-element';
import {connect} from "pwa-helpers/connect-mixin";
import {store} from "../store";
import {logout, unsetCardForEdit, showMessage} from "../actions/app";
import {saveTopic} from "../actions/editor";
import {fetchMapIfNeeded, invalidateMap} from "../actions/maps";
import {handleErrors} from "../actions/fetchy";
import {config} from "../config";
import {colorStyles, fontStyles} from "./kmap-styles";
import 'mega-material/button';
import 'mega-material/dialog';
import 'mega-material/list';
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
textarea {
  width: 100%;
  resize: vertical;
}
.preview {
  height: 52px;
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
  top: -20px;
  left: 24px;
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
    `];
  }

  render() {
    // language=HTML
    return html`
<mwc-dialog id="editDialog" title="Editor">
${this._card ? html`
  <form @focus="${this._focus}">
    <div class="field">
      <label for="topic">Thema</label>
      <span id="topic">${this._card.name}</span>
    </div>
    <div class="field">
      <label for="links"></label>
      <input id="links" type="text" placeholder="Verweist auf ..." .value="${this._card.links}" @change="${e => this._card.links = e.target.value}"/>
      <label for="priority"></label>
      <input id="priority" type="number" placeholder="Priorität" inputmode="numeric" min="0" step="1" .value="${this._card.priority}" @change="${e => this._card.priority = e.target.value}"/>
    </div>
    <div class="field">
      <label for="depends">Basiert auf ...</label>
      <textarea id="depends" rows="3" @change="${e => this._depends = e.target.value}">${this._depends}</textarea>
    </div>
    <div class="field">
      <label for="summary">Kurztext</label>
      <textarea id="summary" rows="3" @keyup="${this._setSummary}" @focus="${this._focus}" @blur="${this._focus}">${this._card.summary}</textarea>
    </div>
    <div class="field">
      <label for="description">Langtext</label>
      <textarea id="description" rows="7" @keyup="${this._setDescription}" @focus="${this._focus}" @blur="${this._focus}">${this._card.description}</textarea>
    </div>
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
  <mwc-icon-button slotd="action" icon="cached" @click=${this._syncAttachments}></mwc-icon-button>
  <mwc-button class="button" slotd="action" primary @click=${this._save}>Speichern</mwc-button>
  <mwc-button class="button" slotd="action" @click=${this._cancel}>Abbrechen</mwc-button>
  <div class="preview" slot="action">
  <label style="text-align: center; display: block">» Preview «</label>
  ${this._showSummaryPreview ? html`<kmap-summary-card-summary .summary="${this._summary}"></kmap-summary-card-summary>` : ''}
  ${this._showDescriptionPreview ? html`<div class="preview-scroller"><kmap-knowledge-card-description 
    .subject="${this._subject}"
    .chapter="${this._chapter}"
    .topic="${this._card.name}"
    .description="${this._description}"
    ></kmap-knowledge-card-description></div>` : ''}
  </div>
</mwc-dialog>
    `;
    }

  static get properties() {
    return {
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
    };
  }

  constructor() {
    super();
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
  }

  firstUpdated(changedProperties) {
    this._editDialog = this.shadowRoot.getElementById('editDialog');
  }

  updated(changedProperties) {
    if (changedProperties.has('_card') && this._card) {
      this._attachmentTag = '';
      this._attachmentName = '';
      this._attachmentHref = '';
      this._editDialog.open();

      this._summary = this._card.summary;
      this._description = this._card.description;
      this._depends = this._card.depends.join(", ");

      this._syncAttachments();
    }
  }

  stateChanged(state) {
    this._card = state.app.cardForEdit;

    if (state.maps.map) {
      if (this._card) {
        this._subject = this._card.subject ? this._card.subject : state.maps.map.subject;
        this._chapter = this._card.chapter ? this._card.chapter : state.maps.map.chapter;

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
      if (e.path[0].id === "summary")
        this._showSummaryPreview = true;
      else if (e.path[0].id === "description")
        this._showDescriptionPreview = true;
    }
  }

  _save() {
    this._editDialog.close();
    this._card.subject = this._subject;
    this._card.chapter = this._chapter;
    this._card.topic = this._card.name;
    this._card.summary = this._summary;
    this._card.description = this._description;
    this._card.depends = this._depends.split(",").map(d => d.trim()).filter(d => d.length > 0);
    console.log(this._card);
    store.dispatch(saveTopic(this._subject, this._card.module, {
      summary: this._summary,
      description: this._description,
    } = this._card))
      .then(store.dispatch(invalidateMap(this._subject, this._chapter)))
      .then(store.dispatch(unsetCardForEdit()))
      .then(lala => window.setTimeout(function(subject, chapter){ store.dispatch(fetchMapIfNeeded(subject, chapter)) }.bind(undefined, this._subject, this._chapter), 1000));
  }

  _cancel() {
    this._editDialog.close();
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
    fetch(`${config.server}edit?attachments=${this._subject}/${this._chapter}/${this._card.name}`, {
      method: "GET",
      mode: "cors",
      cache: "no-cache",
      credentials: "include",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
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
}

const _tags = new Map([
  ["explanation", "Erklärung "],
  ["example",     "Beispiel  "],
  ["usage",       "Anwendung "],
  ["idea",        "Anschauung"],
  ["exercise",    "Aufgabe   "],
]);

window.customElements.define('kmap-editor-edit-dialog', KMapEditorEditDialog);


/*
  synchronize: function () {
      this.$$('#cloudSynchronizer').params = { attachments: this.subject + "/" + this.chapter + "/" + this.topic };
      this.$$('#cloudSynchronizer').body = { subject: this.subject, chapter: this.chapter, topic: this.topic };
      console.log(this.$$('#cloudSynchronizer').headers);
      this.$$('#cloudSynchronizer').generateRequest();
  },

  createDirectory: function () {
      this.$$('#cloudDirectory').params = { directory: this.subject + "/" + this.chapter + "/" + this.topic };
      this.$$('#cloudDirectory').body = { subject: this.subject, chapter: this.chapter, topic: this.topic };
      this.$$('#cloudDirectory').generateRequest();
  },

 */
