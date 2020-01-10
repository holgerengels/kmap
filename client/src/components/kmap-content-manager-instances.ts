import {LitElement, html, css, customElement, property, query} from 'lit-element';
import {connect} from '@captaincodeman/rdx';
import {State, store} from "../store";

import {colorStyles, fontStyles} from "./kmap-styles";

import 'mega-material/list';
import '@material/mwc-icon-button';
import '@material/mwc-textfield';

@customElement('kmap-content-manager-instances')
class KMapContentManagerInstances extends connect(store, LitElement) {
  @property()
  private _instances: string[] = [];
  @property()
  private _page: string = '';
  @property()
  private _selectedIndex: number = -1;
  @property()
  private _selected: string = '';

  @property()
  private _name: string = '';

  mapState(state: State) {
    return {
      _instances: state.instances.instances,
    };
  }

  updated(changedProperties) {
    if (changedProperties.has('_selectedIndex'))
      this._selected = this._instances[this._selectedIndex];
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

  _create() {
    console.log("create new instance");
    store.dispatch.instances.create(this._name)
      .then(() => this._page = '');
  }

  _drop() {
    console.log("drop instance");
    store.dispatch.instances.drop(this._selected)
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
          <label section>Instanzen</label>
          <span style="float: right">
          <mwc-icon @click="${() => this._showPage('create')}">add</mwc-icon>
          <mwc-icon @click="${() => this._showPage('drop')}" ?disabled="${this._selectedIndex === -1}">delete</mwc-icon>
          </span>
          <br style="clear: right"/>
          <div class="scroll">
          <mega-list>
            ${this._instances.map((instance, i) => html`
              <mega-list-item icon="storage" ?activated="${this._selectedIndex === i}" @click="${e => this._select(i)}">${instance}</mega-list-item>
            `)}
          </mega-list>
          </div>
        </div>
        <div class="form">
          <div class="page" ?active="${this._page === 'create'}">
            <label section>Instanz anlegen</label>
            <mwc-textfield label="Name" type="text" .value="${this._name}" @change="${e => this._name = e.target.value}"></mwc-textfield>
            <mwc-button @click="${() => this._showPage('')}">Abbrechen</mwc-button>
            <mwc-button outlined @click="${this._create}">Anlegen</mwc-button>
          </div>
          <div class="page" ?active="${this._page === 'drop'}">
            <label section>Instanz löschen</label>
            <div class="field">
              ${this._selected
                ? html`<label>Soll die Instanz '${this._selected}' wirklich gelöscht werden?</label>`
                : ''}
            </div>
            <mwc-button @click="${() => this._showPage('')}">Abbrechen</mwc-button>
            <mwc-button outlined @click="${this._drop}">Löschen</mwc-button>
          </div>
        </div>
        <div class="space"></div>
      `;
  }
}
