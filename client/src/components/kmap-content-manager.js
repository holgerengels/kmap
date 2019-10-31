import {LitElement, html, css} from 'lit-element';
import {connect} from 'pwa-helpers/connect-mixin.js';
import {store} from "../store";
import {updateTitle} from "../actions/app";

import {colorStyles, fontStyles} from "./kmap-styles";
import '@material/mwc-icon-button';
import '@material/mwc-top-app-bar';
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
  padding: 8px;
}
.page[active] {
  display: block;
}
      `];
  }

  render() {
    // language=HTML
    return html`
      <mwc-top-app-bar id="bar" dense>
        <mwc-icon-button icon="menu" slot="navigationIcon" @click="${e => this._fire('toggleDrawer')}"></mwc-icon-button>
        <div slot="title">Content Manager</div>
        <kmap-login-button slot="actionItems" @lclick="${e => this._fire('login')}"></kmap-login-button>
      </mwc-top-app-bar>
      <div id="content" class="board">
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
    let bar = this.shadowRoot.getElementById('bar');
    let content = this.shadowRoot.getElementById('content');
    bar.scrollTarget = content;
    store.dispatch(updateTitle("Content Manager"));
  }

  updated(changedProperties) {
  }

  stateChanged(state) {
    this._roles = state.app.roles;
  }

  _fire(name) {
    this.dispatchEvent(new CustomEvent(name, {bubbles: true, composed: true}));
  }
}
customElements.define('kmap-content-manager', KMapContentManager);
