import {LitElement, html, css, customElement, property} from 'lit-element';
import {connect} from '@captaincodeman/rdx';
import {State, store} from "../store";

import '@material/mwc-button';
import {Card} from "../models/maps";
import {colorStyles, fontStyles} from "./kmap-styles";

interface Module {
  subject: string,
  module: string,
}

@customElement('kmap-browser-chapter-editor')
export class KMapBrowserChapterEditor extends connect(store, LitElement) {
  @property({type: String})
  private subject: string = '';
  @property({type: String})
  private chapter: string = '';
  @property()
  private chapterCard?: Card = undefined;
  @property()
  private _selectedModule?: Module = undefined;
  @property()
  private _enabled: boolean = false;

  mapState(state: State) {
    return {
      _selectedModule: state.contentMaps.selected,
    };
  }

  updated(changedProperties) {
    if (changedProperties.has("subject") || changedProperties.has("_selectedModule")) {
      this._enabled = this._selectedModule && ((this.chapterCard
        && this.subject === this._selectedModule.subject
        && (this.chapterCard.module === this._selectedModule.module || this.chapterCard.module === null))
        || !this.chapterCard);
    }
  }

  stateChanged(state) {
    this._selectedModule = state.contentMaps.selectedModule;
  }

  _showEdit() {
    let card: Card = this.chapterCard && this.chapterCard.module ? {
      module: this.chapterCard.module,
      subject: this.subject,
      chapter: this.chapter,
      topic: '_',
      summary: this.chapterCard.summary,
      description: this.chapterCard.description,
      attachments: this.chapterCard.attachments,
    } : {
      added: true,
      module: this._selectedModule.module,
      subject: this._selectedModule.subject,
      chapter: this.chapter,
      topic: '_',
      summary: '',
      description: '',
      links: '',
      depends: [],
      attachments: [],
    };
    store.dispatch.maps.setCardForEdit(card);
  }

  _showDelete() {
    let card: Card = {
      module: this._selectedModule.module,
      subject: this._selectedModule.subject,
      chapter: this.chapter,
      topic: '_',
    };
    store.dispatch.maps.setCardForDelete(card);
  }

  static get styles() {
    // language=CSS
    return [
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
