import {html, css} from 'lit';
import {customElement, query, state} from 'lit/decorators.js';
import {Connected} from "./connected";
import {State, store} from "../store";

import {resetStyles, colorStyles, fontStyles} from "./kmap-styles";

import '@material/mwc-icon';
import '@material/mwc-icon-button';
import '@material/mwc-list/mwc-list';
import '@material/mwc-list/mwc-list-item';
import {Set} from "../models/contentSets";

@customElement('kmap-content-manager-sets')
export class KMapContentManagerSets extends Connected {
  @state()
  private _sets: Set[] = [];
  @state()
  private _page: string = '';
  @state()
  private _selectedIndex: number = -1;
  @state()
  private _selected?: Set = undefined;

  @state()
  private _working: boolean = false;

  @query("#file")
  // @ts-ignore
  private _file: HTMLInputElement;

  mapState(state: State) {
    return {
      _sets: state.contentSets.sets || [],
      _working: state.contentSets.importing || state.contentSets.exporting || state.contentSets.deleting
    };
  }

  updated(changedProperties) {
    if (changedProperties.has('_selectedIndex'))
      this._selected = this._sets[this._selectedIndex];

    if (changedProperties.has("_working") && !this._working)
      this._page = '';
  }

  _select(index) {
    if (this._selectedIndex === -1)
      this._selectedIndex = index;
    else if (this._selectedIndex === index)
      this._selectedIndex = -1;
    else
      this._selectedIndex = index;
  }

  _showPage(page) {
    this._page = page;
  }

  _import() {
    if (!this._file.files) return;
    store.dispatch.contentSets.import(this._file.files);
  }

  _export() {
    if (!this._selected) return;
    store.dispatch.contentSets.export(this._selected);
  }

  _delete() {
    if (!this._selected) return;
    store.dispatch.contentSets.delete(this._selected);
  }

  static get styles() {
    // language=CSS
    return [
      resetStyles,
      fontStyles,
      colorStyles,
      css`
        :host {
          display: contents;
        }
        div.main {
          width: 700px;
          margin: 8px;
          display: flex;
        }
        .form {
          margin: 12px;
          flex: 0 1 50%;
          align-items: stretch;
        }
        .scroll {
          height: 232px;
          width: 326px;
          overflow-x: hidden;
          overflow-y: auto;
        }
        mwc-icon {
          pointer-events: all;
          cursor: default;
        }
        [disabled], [disabled] svg {
          color: gray;
          fill: gray;
          pointer-events: none;
        }
        .page {
          display: none;
          opacity: 0.0;
          transition: opacity .8s;
        }
        .page[active] {
          display: block;
          opacity: 1.0;
        }
        .page > * {
          display: flex;
          justify-content: space-between;
          margin: 8px;
        }
        `];
  }

  render() {
    return html`
      <div class="main elevation-02">
        <div class="form">
          <label>Test Sets</label>
          <span style="float: right">
          <mwc-icon @click="${() => this._showPage('import')}"><svg viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet" focusable="false" style="display: block; width: 24px; height: 24px;"><g><path d="M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z"></path></g></svg></mwc-icon>
          <mwc-icon @click="${() => this._showPage('export')}" ?disabled="${this._selectedIndex === -1}"><svg viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet" focusable="false" style="display: block; width: 24px; height: 24px;"><g><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"></path></g></svg></mwc-icon>
          <mwc-icon @click="${() => this._showPage('delete')}" ?disabled="${this._selectedIndex === -1}">delete</mwc-icon>
          </span>
          <br style="clear: right"/>
          <div class="scroll">
          <mwc-list>
            ${this._sets.map((set, i) => html`
              <mwc-list-item icon="folder" ?activated="${this._selectedIndex === i}" @click="${() => this._select(i)}" graphic="icon" twoline>
                <span>${set.subject} - ${set.set}</span>
                <span slot="secondary">${set.count} Karten</span>
                <mwc-icon slot="graphic">folder</mwc-icon>
              </mwc-list-item>
            `)}
          </mwc-list>
          </div>
        </div>
        <div class="form">
          <div class="page" ?active="${this._page === 'import'}">
            <label>Set importieren</label>
            <div class="field">
                <label for="file">Datei</label>
                <input id="file" required type="file" multiple/>
            </div>
            <div>
              <mwc-button @click="${() => this._showPage('')}">Abbrechen</mwc-button>
              <mwc-button outlined @click="${this._import}">Importieren</mwc-button>
            </div>
          </div>
          <div class="page" ?active="${this._page === 'export'}">
            <label>Set exportieren</label>
            ${this._selected
              ? html`<label secondary>Set '${this._selected.subject} - ${this._selected.set}' exportieren?</label>`
              : ''}
            <div>
              <mwc-button @click="${() => this._showPage('')}">Abbrechen</mwc-button>
              <mwc-button outlined @click="${this._export}">Exportieren</mwc-button>
            </div>
          </div>
          <div class="page" ?active="${this._page === 'delete'}">
            <label>Set löschen</label>
            ${this._selected
              ? html`<label secondary>Soll das Modul '${this._selected.subject} - ${this._selected.set}' wirklich gelöscht werden?</label>`
              : ''}
            <div>
              <mwc-button @click="${() => this._showPage('')}">Abbrechen</mwc-button>
              <mwc-button outlined @click="${this._delete}">Löschen</mwc-button>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}
