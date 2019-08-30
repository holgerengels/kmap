import {LitElement, html, css} from 'lit-element';
import {connect} from 'pwa-helpers/connect-mixin.js';
import {store} from "../store";

import 'mega-material/icon-button';
import 'mega-material/list';
import {colorStyles, fontStyles} from "./kmap-styles";
import {loadInstances, forgetInstances, createInstance, dropInstance} from "../actions/instances";

class KMapContentManagerInstances extends connect(store)(LitElement) {
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
mega-icon {
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
        `
    ];
  }

  render() {
    return html`
        <div class="form">
          <label section>Instanzen</label>
          <span style="float: right">
          <mega-icon @click="${e => this._showPage('create')}">add</mega-icon>
          <mega-icon @click="${e => this._showPage('drop')}" ?disabled="${this._selectedIndex === -1}">delete</mega-icon>
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
            <div class="field">
                <label for="name">Name</label>
                <input id="name" required type="text" .value=${this._name} @change=${e => this._name = e.target.value}/>
            </div>
            <mega-button @click="${e => this._showPage('')}">Abbrechen</mega-button>
            <mega-button outlined @click="${this._create}">Anlegen</mega-button>
          </div>
          <div class="page" ?active="${this._page === 'drop'}">
            <label section>Instanz löschen</label>
            <div class="field">
              ${this._selected
                ? html`<label>Soll die Instanz '${this._selected}' wirklich gelöscht werden?</label>`
                : ''}
            </div>
            <mega-button @click="${e => this._showPage('')}">Abbrechen</mega-button>
            <mega-button outlined @click="${this._drop}">Löschen</mega-button>
          </div>
        </div>
        <div class="space"></div>
`;}

  static get properties() {
    return {
      _userid: {type: String},
      _instances: {type: Array},
      _page: {type: String},
      _selectedIndex: {type: Number},
      _selected: {type: Object},

      _name: {type: String},
    };
  }

  constructor() {
    super();
    this._page = '';
    this._instances = [];
    this._selectedIndex = -1;

    this._name = '';
  }

  firstUpdated(changedProperties) {
  }

  updated(changedProperties) {
    if (changedProperties.has('_selectedIndex'))
      this._selected = this._instances[this._selectedIndex];
  }

  stateChanged(state) {
    if (this._userid !== state.app.userid) {
      this._userid = state.app.userid;
      if (this._userid)
        store.dispatch(loadInstances());
      else
        store.dispatch(forgetInstances())
    }
    this._instances = state.instances.instances;
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
    store.dispatch(createInstance(this._name))
      .then(lala => this._page = '');
  }

  _drop() {
    console.log("drop instance");
    store.dispatch(dropInstance(this._selected))
      .then(lala => this._page = '');
  }
}
customElements.define('kmap-content-manager-instances', KMapContentManagerInstances);
