import {LitElement, html, css} from 'lit-element';
import {connect} from 'pwa-helpers/connect-mixin.js';
import {store} from "../store";

import 'mega-material/icon-button';
import 'mega-material/list';
import 'mega-material/top-app-bar';
import {colorStyles, fontStyles} from "./kmap-styles";
import {importMap, exportMap, deleteMap, modules} from "../actions/content-maps";
import {importSet, exportSet, deleteSet, sets} from "../actions/content-sets";
import {updateTitle} from "../actions/app";

class KMapContentManager extends connect(store)(LitElement) {
  static get styles() {
    // language=CSS
    return [
      fontStyles,
      colorStyles,
      css`
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
        `
    ];
  }

  render() {
    return html`
      <mwc-top-app-bar>
        <mwc-icon-button icon="menu" slot="navigationIcon"></mwc-icon-button>
        <div slot="title">Content Manager</div>
      </mwc-top-app-bar>
      <div class="board">
        <div class="form">
          <label section>Module</label>
          <span style="float: right">
          <mwc-icon @click="${e => this._showPageMap('import')}"><svg viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet" focusable="false" style="display: block; width: 24px; height: 24px;"><g><path d="M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z"></path></g></svg></mwc-icon>
          <mwc-icon @click="${e => this._showPageMap('export')}" ?disabled="${this._selectedIndexMap === -1}"><svg viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet" focusable="false" style="display: block; width: 24px; height: 24px;"><g><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"></path></g></svg></mwc-icon>
          <mwc-icon @click="${e => this._showPageMap('delete')}" ?disabled="${this._selectedIndexMap === -1}">delete</mwc-icon>
          </span>
          <br style="clear: right"/>
          <div class="scroll">
          <mwc-list>
            ${this._modules.map((module, i) => html`
              <mwc-list-item icon="folder" ?activated="${this._selectedIndexMap === i}" @click="${e => this._selectMap(i)}">${module.subject} - ${module.module}
              <span slot="secondary">${module.count} Karten</span>
              </mwc-list-item>
            `)}
          </mwc-list>
          </div>
        </div>
        <div class="form">
          <div class="page" ?active="${this._pageMap === 'import'}">
            <label section>Modul importieren</label>
            <div class="field">
                <label for="fileMap">Datei</label>
                <input id="fileMap" required="" type="file" />
            </div>
            <div class="field">
                <label for="subjectMap">Fach</label>
                <input id="subjectMap" required="" type="text" value=${this._subjectMap} @change=${e => this._subjectMap = e.target.value}/>
            </div>
            <div class="field">
                <label for="moduleMap">Modul</label>
                <input id="moduleMap" required="" type="text" value=${this._moduleMap} @change=${e => this._moduleMap = e.target.value}/>
            </div>
            <mwc-button @click="${this._importMap}">Importieren</mwc-button>
          </div>
          <div class="page" ?active="${this._pageMap === 'export'}">
            <label section>Modul exportieren</label>
            <div class="field">
              ${this._selectedMap
                ? html`<label>Modul '${this._selectedMap.subject} - ${this._selectedMap.module}' exportieren?</label>`
                : ''}
            </div>
            <a id="download" hidden=""></a>
            <mwc-button @click="${this._exportMap}">Exportieren</mwc-button>
          </div>
          <div class="page" ?active="${this._pageMap === 'delete'}">
            <label section>Modul löschen</label>
            <div class="field">
              ${this._selectedMap
                ? html`<label>Soll das Modul '${this._selectedMap.subject} - ${this._selectedMap.module}' wirklich gelöscht werden?</label>`
                : ''}
            </div>
            <mwc-button @click="${this._deleteMap}">Löschen</mwc-button>
          </div>
        </div>
        <div class="space"></div>
        <div class="form">
          <label section>Test Sets</label>
          <span style="float: right">
          <mwc-icon @click="${e => this._showPageSet('import')}"><svg viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet" focusable="false" style="display: block; width: 24px; height: 24px;"><g><path d="M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z"></path></g></svg></mwc-icon>
          <mwc-icon @click="${e => this._showPageSet('export')}" ?disabled="${this._selectedIndexSet === -1}"><svg viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet" focusable="false" style="display: block; width: 24px; height: 24px;"><g><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"></path></g></svg></mwc-icon>
          <mwc-icon @click="${e => this._showPageSet('delete')}" ?disabled="${this._selectedIndexSet === -1}">delete</mwc-icon>
          </span>
          <br style="clear: right"/>
          <div class="scroll">
          <mwc-list>
            ${this._sets.map((set, i) => html`
              <mwc-list-item icon="folder" ?activated="${this._selectedIndexSet === i}" @click="${e => this._selectSet(i)}">${set.subject} - ${set.set}
              <span slot="secondary">${set.count} Karten</span>
              </mwc-list-item>
            `)}
          </mwc-list>
          </div>
        </div>
        <div class="form">
          <div class="page" ?active="${this._pageSet === 'import'}">
            <label section>Set importieren</label>
            <div class="field">
                <label for="fileSet">Datei</label>
                <input id="fileSet" required="" type="file" />
            </div>
            <div class="field">
                <label for="subjectSet">Fach</label>
                <input id="subjectSet" required="" type="text" value=${this._subjectSet} @change=${e => this._subjectSet = e.target.value}/>
            </div>
            <div class="field">
                <label for="moduleSet">Modul</label>
                <input id="moduleSet" required="" type="text" value=${this._moduleSet} @change=${e => this._moduleSet = e.target.value}/>
            </div>
            <mwc-button @click="${this._importSet}">Importieren</mwc-button>
          </div>
          <div class="page" ?active="${this._pageSet === 'export'}">
            <label section>Set exportieren</label>
            <div class="field">
              ${this._selectedSet
                ? html`<label>Modul '${this._selectedSet.subject} - ${this._selectedSet.module}' exportieren?</label>`
                : ''}
            </div>
            <mwc-button @click="${this._exportSet}">Exportieren</mwc-button>
          </div>
          <div class="page" ?active="${this._pageSet === 'delete'}">
            <label section>Set löschen</label>
            <div class="field">
              ${this._selectedSet
                ? html`<label>Soll das Modul '${this._selectedSet.subject} - ${this._selectedSet.module}' wirklich gelöscht werden?</label>`
                : ''}
            </div>
            <mwc-button @click="${this._deleteSet}">Löschen</mwc-button>
          </div>
        </div>
        <div class="space"></div>
      </div>
      <a id="download" hidden=""></a>
`;}

  static get properties() {
    return {
      _userid: {type: String},
      _modules: {type: Array},
      _pageMap: {type: String},
      _fileMap: {type: String},
      _subjectMap: {type: String},
      _moduleMap: {type: String},
      _selectedIndexMap: {type: Number},
      _selectedMap: {type: Object},

      _sets: {type: Array},
      _pageSet: {type: String},
      _fileSet: {type: String},
      _subjectSet: {type: String},
      _moduleSet: {type: String},
      _selectedIndexSet: {type: Number},
      _selectedSet: {type: Object},

      _download: {type: Object},
    };
  }

  constructor() {
    super();
    this._modules = [];
    this._subjectMap = "";
    this._moduleMap = "";
    this._selectedIndexMap = -1;
    this._sets = [];
    this._subjectSet = "";
    this._moduleSet = "";
    this._selectedIndexSet = -1;
  }

  firstUpdated(changedProperties) {
    this._fileMap = this.shadowRoot.getElementById('fileMap');
    this._fileSet = this.shadowRoot.getElementById('fileSet');
    this._download = this.shadowRoot.getElementById('download');
    store.dispatch(modules());
    store.dispatch(sets());
    store.dispatch(updateTitle("Kurse"));
  }

  updated(changedProperties) {
    if (changedProperties.has('_selectedIndexMap'))
      this._selectedMap = this._modules[this._selectedIndexMap];
    if (changedProperties.has('_selectedIndexSet'))
      this._selectedSet = this._modules[this._selectedIndexSet];
  }

  stateChanged(state) {
    this._userid = state.app.userid;
    this._modules = state.contentMaps.modules;
    this._sets = state.contentSets.sets;
  }

  _selectMap(index) {
    if (this._selectedIndexMap === -1)
      this._selectedIndexMap = index;
    else if (this._selectedIndexMap === index)
      this._selectedIndexMap = -1;
    else
      this._selectedIndexMap = index;
  }

  _showPageMap(page) {
    this._pageMap = page;
  }

  _importMap() {
    let file = this._fileMap.files[0];
    let reader = new FileReader();
    let that = this;
    reader.onload = (function () {
      return function (e) {
        let content = e.target.result;
        let object = JSON.parse(content);
        console.log(object.docs);
        store.dispatch(importMap(that._subjectMap, that._moduleMap, object.docs));
      };
    })(file);
    reader.readAsText(file);
  }

  _exportMap() {
    store.dispatch(exportMap(this._selectedMap.subject, this._selectedMap.module)).then(action => {
      console.log(action.data);
      let items = [];
      for (let item of action.data) {
        items.push({
          subject: this._selectedMap.subject,
          module: item.module,
          chapter: item.chapter,
          topic: item.topic,
          links: item.links,
          priority: item.priority,
          depends: item.depends,
          description: item.description,
          summary: item.summary,
          attachments: item.attachments,
        });
      }

      let data = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ "docs": items }));
      this._download.href = 'data:' + data;
      this._download.download = this._selectedMap.subject + ' - ' + this._selectedMap.module + '.json';
      this._download.click();
    });
  }

  _deleteMap() {
    store.dispatch(deleteMap(this._selectedMap.subject, this._selectedMap.module));
  }

  _selectSet(index) {
    if (this._selectedIndexSet === -1)
      this._selectedIndexSet = index;
    else if (this._selectedIndexSet === index)
      this._selectedIndexSet = -1;
    else
      this._selectedIndexSet = index;
  }

  _showPageSet(page) {
    this._pageSet = page;
  }

  _importSet() {
    let file = this._fileSet.files[0];
    let reader = new FileReader();
    let that = this;
    reader.onload = (function () {
      return function (e) {
        let content = e.target.result;
        let object = JSON.parse(content);
        console.log(object.docs);
        store.dispatch(importSet(that._subjectSet, that._moduleSet, object.docs));
      };
    })(file);
    reader.readAsText(file);
  }

  _exportSet() {
    store.dispatch(exportSet(this._selectedSet.subject, this._selectedSet.module)).then(action => {
      console.log(action.data);
      let items = [];
      for (let item of action.data) {
        items.push({
          subject: this._selectedSet.subject,
          module: item.module,
          chapter: item.chapter,
          topic: item.topic,
          links: item.links,
          priority: item.priority,
          depends: item.depends,
          description: item.description,
          summary: item.summary,
          attachments: item.attachments,
        });
      }

      let data = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ "docs": items }));
      this._download.href = 'data:' + data;
      this._download.download = this._selectedSet.subject + ' - ' + this._selectedSet.module + '.json';
      this._download.click();
    });
  }

  _deleteSet() {
    store.dispatch(deleteSet(this._selectedSet.subject, this._selectedSet.module));
  }
}
customElements.define('kmap-content-manager', KMapContentManager);
