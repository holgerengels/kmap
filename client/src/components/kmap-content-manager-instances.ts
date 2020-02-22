import {LitElement, html, css, customElement, property} from 'lit-element';
import {connect} from '@captaincodeman/rdx';
import {State, store} from "../store";

import {colorStyles, elevationStyles, fontStyles} from "./kmap-styles";

import '@material/mwc-icon';
import '@material/mwc-icon-button';
import '@material/mwc-list/mwc-list';
import '@material/mwc-list/mwc-list-item';
import '@material/mwc-select';
import '@material/mwc-textfield';
import {Instance} from "../models/instances";

@customElement('kmap-content-manager-instances')
export class KMapContentManagerInstances extends connect(store, LitElement) {
  @property()
  private _instances: Instance[] = [];
  @property()
  private _page: string = '';
  @property()
  private _selectedIndex: number = -1;
  @property()
  private _selected?: Instance = undefined;

  @property()
  private _working: boolean = false;

  @property()
  private _syncName: string = '';

  @property()
  private _newName: string = '';

  @property()
  private _newDescription: string = '';

  mapState(state: State) {
    return {
      _instances: state.instances.instances,
      _working: state.instances.creating || state.instances.dropping,
    };
  }

  updated(changedProperties) {
    if (changedProperties.has('_selectedIndex'))
      this._selected = this._instances[this._selectedIndex];

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

  _sync() {
    if (this._selected === undefined) return;

    console.log(`sync ${this._selected.name} to ${this._syncName}`);
    store.dispatch.instances.sync({ from: this._selected.name, to: this._syncName});
  }

  _create() {
    console.log("create new instance");
    store.dispatch.instances.create({ name: this._newName, description: this._newDescription});
  }

  _drop() {
    console.log("drop instance");
    // @ts-ignore
    store.dispatch.instances.drop(this._selected);
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
          flex: 0 1 50%;
          align-items: stretch;
        }
        .scroll {
          height: 232px;
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
          <label>Instanzen</label>
          <span style="float: right">
          <mwc-icon @click="${() => this._showPage('sync')}">merge_type</mwc-icon>
          <mwc-icon @click="${() => this._showPage('create')}">add</mwc-icon>
          <mwc-icon @click="${() => this._showPage('drop')}" ?disabled="${this._selectedIndex === -1}">delete</mwc-icon>
          </span>
          <br style="clear: right"/>
          <div class="scroll">
          <mwc-list>
            ${this._instances.map((instance, i) => html`
              <mwc-list-item ?activated="${this._selectedIndex === i}" @click="${() => this._select(i)}" graphic="icon">
                <span>${instance.name} <span class="secondary">${instance.description}</span></span>
                <mwc-icon slot="graphic">storage</mwc-icon>
              </mwc-list-item>
            `)}
          </mwc-list>
          </div>
        </div>
        <div class="form">
          <div class="page" ?active="${this._page === 'sync'}">
            <label>Instanz replizieren</label>
            <mwc-select required label="Von Instanz" @change="${e => this._syncName = e.target.value}">
              ${this._instances.filter(i => this._selected === undefined || i.name !== this._selected.name).map((instance) => html`
                <mwc-list-item value="${instance.name}">${instance.name}</mwc-list-item>
              `)}
            </mwc-select>
            <label secondary>Nach Instanz '${this._syncName}'</label>
            <div>
            <mwc-button @click="${() => this._showPage('')}">Abbrechen</mwc-button>
            <mwc-button outlined @click="${this._sync}">Inhalte Übertragen</mwc-button>
            </div>
          </div>
          <div class="page" ?active="${this._page === 'create'}">
            <label>Instanz anlegen</label>
            <mwc-textfield label="ID" type="text" .value="${this._newName}" @change="${e => this._newName = e.target.value}" required></mwc-textfield>
            <mwc-textfield label="Name" type="text" .value="${this._newDescription}" @change="${e => this._newDescription = e.target.value}"></mwc-textfield>
            <div>
              <mwc-button @click="${() => this._showPage('')}">Abbrechen</mwc-button>
              <mwc-button outlined @click="${this._create}">Anlegen</mwc-button>
            </div>
          </div>
          <div class="page" ?active="${this._page === 'drop'}">
            <label>Instanz löschen</label>
              ${this._selected
                ? html`<label secondary>Soll die Instanz '${this._selected.name}' wirklich gelöscht werden?</label>`
                : ''}
            <div>
              <mwc-button @click="${() => this._showPage('')}">Abbrechen</mwc-button>
              <mwc-button outlined @click="${this._drop}">Löschen</mwc-button>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}
