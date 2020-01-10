import {LitElement, html, css, customElement, property, query} from 'lit-element';
import {connect} from '@captaincodeman/rdx';
import {State, store} from "../store";

import {colorStyles, fontStyles} from "./kmap-styles";

import 'mega-material/list';
import '@material/mwc-icon-button';
import {Module} from "../models/contentMaps";

@customElement('kmap-content-manager-modules')
class KMapContentManagerModules extends connect(store, LitElement) {
  @property()
  private _modules: Module[] = [];
  @property()
  private _page: string = '';
  @property()
  private _selectedIndex: number = -1;
  @property()
  private _selected?: Module = undefined;

  @query("#file")
  private _file?: Element;

  mapState(state: State) {
    return {
      _modules: state.modules.modules,
    };
  }

  updated(changedProperties) {
    if (changedProperties.has('_selectedIndex'))
      this._selected = this._modules[this._selectedIndex];
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
    store.dispatch.contentMaps.import(this._file.files)
      .then(() => this._page = '');
  }

  _export() {
    store.dispatch.contentMaps.export(this._selected)
      .then(() => this._page = '');
  }

  _delete() {
    store.dispatch.contentMaps.delete(this._selected)
      .then(() => this._page = '');
  }

  static get styles() {
    // language=CSS
    return [
      fontStyles,
      colorStyles,
      css`
        :host {
          display: contents;
        }
        .board {
          height: auto;
          padding: 8px;
          padding-bottom: 36px;
          display: flex;
          flex-flow: row wrap;
          justify-content: flex-start;
        }
        .form {
          max-width: 300px;
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
          height: 160px;
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
        <div class="form">
          <label section>Module</label>
          <span style="float: right">
          <mwc-icon @click="${() => this._showPage('import')}"><svg viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet" focusable="false" style="display: block; width: 24px; height: 24px;"><g><path d="M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z"></path></g></svg></mwc-icon>
          <mwc-icon @click="${() => this._showPage('export')}" ?disabled="${this._selectedIndex === -1}"><svg viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet" focusable="false" style="display: block; width: 24px; height: 24px;"><g><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"></path></g></svg></mwc-icon>
          <mwc-icon @click="${() => this._showPage('delete')}" ?disabled="${this._selectedIndex === -1}">delete</mwc-icon>
          </span>
          <br style="clear: right"/>
          <div class="scroll">
          <mega-list>
            ${this._modules.map((module, i) => html`
              <mega-list-item icon="folder" ?activated="${this._selectedIndex === i}" @click="${() => this._select(i)}">${module.subject} - ${module.module}
              <span slot="secondary">${module.count} Karten</span>
              </mega-list-item>
            `)}
          </mega-list>
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
        <div class="space"></div>
    `;
  }
}
