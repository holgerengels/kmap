import {html, css} from 'lit';
import {customElement, property, state} from 'lit/decorators.js';
import {State, store} from "../store";

import '@material/mwc-button';
import {resetStyles, colorStyles, fontStyles} from "./kmap-styles";
import {Card} from "../models/types";
import {Connected} from "./connected";

interface Module {
  subject: string,
  module: string,
}

@customElement('kmap-browser-chapter-editor')
export class KMapBrowserChapterEditor extends Connected {
  @property({type: String})
  private subject: string = '';
  @property({type: String})
  private chapter: string = '';
  @property()
  private chapterCard?: Card = undefined;
  @state()
  private _selectedModule?: Module = undefined;
  @state()
  private _enabled: boolean = false;

  mapState(state: State) {
    return {
      _selectedModule: state.contentMaps.selected,
    };
  }

  updated(changedProperties) {
    if (changedProperties.has("subject") || changedProperties.has("_selectedModule")) {
      this._enabled = this._selectedModule !== undefined && ((this.chapterCard
        && this.subject === this._selectedModule.subject
        && (this.chapterCard.module === this._selectedModule.module || this.chapterCard.module === null))
        || !this.chapterCard);
    }
  }

  _showEdit() {
    let card: Card | any = this.chapterCard && this.chapterCard.module ? {
      module: this.chapterCard.module,
      subject: this.subject,
      chapter: this.chapter,
      topic: '_',
      meta: this.chapterCard.meta,
      summary: this.chapterCard.summary,
      description: this.chapterCard.description,
      attachments: this.chapterCard.attachments,
    } : {
      added: true,
      module: this._selectedModule ? this._selectedModule.module : undefined,
      subject: this._selectedModule ? this._selectedModule.subject : undefined,
      chapter: this.chapter,
      topic: '_',
      meta: '',
      summary: '',
      description: '',
      thumb: '',
      links: '',
      depends: [],
      attachments: [],
    };
    store.dispatch.maps.setEditAction({ card: card, action: "edit" });
  }

  _showDelete() {
    let card: Partial<Card> = {
      module: this._selectedModule ? this._selectedModule.module : undefined,
      subject: this._selectedModule ? this._selectedModule.subject : undefined,
      chapter: this.chapter,
      topic: '_',
    };
    store.dispatch.maps.setEditAction({ card: card, action: "delete" });
  }

  static get styles() {
    // language=CSS
    return [
      resetStyles,
      fontStyles,
      colorStyles,
      css`
        mwc-button[disabled] {
          pointer-events: none;
          color: var(--color-darkgray);
          opacity: .5;
        }
      `
    ];
  }

  render() {
    return html`
      <mwc-button icon="edit" ?disabled="${!this._enabled}" @click="${this._showEdit}"></mwc-button>
      <mwc-button icon="delete" ?disabled="${!this._enabled}" @click="${this._showDelete}"></mwc-button>
    `;
  }
}
