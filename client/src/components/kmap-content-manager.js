import {LitElement, html, css} from 'lit-element';
import {connect} from 'pwa-helpers/connect-mixin.js';
import {store} from "../store";

import 'mega-material/icon-button';
import 'mega-material/list';
import 'mega-material/top-app-bar';
import {colorStyles, fontStyles} from "./kmap-styles";
import {updateTitle} from "../actions/app";
import './kmap-content-manager-instances';
import './kmap-content-manager-modules';
import './kmap-content-manager-sets';

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
      <mega-top-app-bar>
        <mega-icon-button icon="menu" slot="navigationIcon"></mega-icon-button>
        <div slot="title">Content Manager</div>
      </mega-top-app-bar>
      <div class="board">
        ${this._roles.includes('admin') ? html`<kmap-content-manager-instances></kmap-content-manager-instances>` : ''}
        ${this._roles.includes('teacher') ? html`<kmap-content-manager-modules></kmap-content-manager-modules>` : ''}
        ${this._roles.includes('teacher') ? html`<kmap-content-manager-sets></kmap-content-manager-sets>` : ''}
      </div>
`;}

  static get properties() {
    return {
      _roles: {type: Array},
    };
  }

  constructor() {
    super();
    this._roles = [];
  }

  firstUpdated(changedProperties) {
    store.dispatch(updateTitle("Content Manager"));
  }

  updated(changedProperties) {
  }

  stateChanged(state) {
    this._roles = state.app.roles;
  }
}
customElements.define('kmap-content-manager', KMapContentManager);
