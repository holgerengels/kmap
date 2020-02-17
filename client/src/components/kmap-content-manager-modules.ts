import {LitElement, html, css, customElement, property, query} from 'lit-element';
import {connect} from '@captaincodeman/rdx';
import {State, store} from "../store";

import {colorStyles, elevationStyles, fontStyles} from "./kmap-styles";

import '@material/mwc-icon';
import '@material/mwc-icon-button';
import '@material/mwc-list/mwc-list';
import '@material/mwc-list/mwc-list-item';
import {Module} from "../models/contentMaps";

@customElement('kmap-content-manager-modules')
export class KMapContentManagerModules extends connect(store, LitElement) {
  @property()
  private _modules: Module[] = [];
  @property()
  private _page: string = '';
  @property()
  private _selectedIndex: number = -1;
  @property()
  private _selected?: Module = undefined;

  @property()
  private _working: boolean = false;

  @query("#file")
  private _file?: HTMLInputElement;

  mapState(state: State) {
    return {
      _modules: state.contentMaps.modules,
      _working: state.contentMaps.importing || state.contentMaps.exporting || state.contentMaps.deleting,
    };
  }

  updated(changedProperties) {
    if (changedProperties.has('_selectedIndex'))
      this._selected = this._modules[this._selectedIndex];

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
    if (!this._file) return;
    store.dispatch.contentMaps.import(this._file.files);
  }

  _export() {
    if (!this._selected) return;
    store.dispatch.contentMaps.export(this._selected);
  }

  _delete() {
    if (!this._selected) return;
    store.dispatch.contentMaps.delete(this._selected);
  }

  static get styles() {
    // language=CSS
    return [
      fontStyles,
      colorStyles,
      elevationStyles,
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
          flex: 0 0 50%;
          align-items: stretch;
        }
        .space {
          margin: 12px;
          flex: 1 1 100%;
        }
        .field {
          display: flex;
          justify-content: space-between;
          margin: 12px;
        }
        .field input {
          width: 180px;
        }
        .scroll {
          height: 224px;
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
        `];
  }

  render() {
    return html`
      <div class="main elevation-02">
        <div class="form">
          <label section>Module</label>
          <span style="float: right">
          <mwc-icon @click="${() => this._showPage('import')}"><svg viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet" focusable="false" style="display: block; width: 24px; height: 24px;"><g><path d="M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z"></path></g></svg></mwc-icon>
          <mwc-icon @click="${() => this._showPage('export')}" ?disabled="${this._selectedIndex === -1}"><svg viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet" focusable="false" style="display: block; width: 24px; height: 24px;"><g><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"></path></g></svg></mwc-icon>
          <mwc-icon @click="${() => this._showPage('delete')}" ?disabled="${this._selectedIndex === -1}">delete</mwc-icon>
          </span>
          <br style="clear: right"/>
          <div class="scroll">
          <mwc-list>
            ${this._modules.map((module, i) => html`
              <mwc-list-item ?activated="${this._selectedIndex === i}" @click="${() => this._select(i)}" graphic="icon" twoline>
                <span>${module.subject} - ${module.module}</span>
                <span slot="secondary">${module.count} Karten</span>
                <mwc-icon slot="graphic">folder</mwc-icon>
              </mwc-list-item>
            `)}
          </mwc-list>
          </div>
        </div>
        <div class="form">
          <div class="page" ?active="${this._page === 'import'}">
            <label section>Modul importieren</label>
            <div class="field">
                <label for="file">Datei</label>
                <input id="file" required type="file" multiple/>
            </div>
            <mwc-button @click="${() => this._showPage('')}">Abbrechen</mwc-button>
            <mwc-button outlined @click="${this._import}">Importieren</mwc-button>
          </div>
          <div class="page" ?active="${this._page === 'export'}">
            <label section>Modul exportieren</label>
            <div class="field">
              ${this._selected
                ? html`<label>Modul '${this._selected.subject} - ${this._selected.module}' exportieren?</label>`
                : ''}
            </div>
            <mwc-button @click="${() => this._showPage('')}">Abbrechen</mwc-button>
            <mwc-button outlined @click="${this._export}">Exportieren</mwc-button>
          </div>
          <div class="page" ?active="${this._page === 'delete'}">
            <label section>Modul löschen</label>
            <div class="field">
              ${this._selected
                ? html`<label>Soll das Modul '${this._selected.subject} - ${this._selected.module}' wirklich gelöscht werden?</label>`
                : ''}
            </div>
            <mwc-button @click="${() => this._showPage('')}">Abbrechen</mwc-button>
            <mwc-button outlined @click="${this._delete}">Löschen</mwc-button>
          </div>
        </div>
      </div>
    `;
  }
}
