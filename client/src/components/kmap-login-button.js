import {LitElement, html, css} from 'lit-element';
import { connect } from '@captaincodeman/rdx';
import {store} from "../store.js";

import {fontStyles, colorStyles} from "./kmap-styles";
import '@material/mwc-icon';

class KMapLoginButton extends connect(store, LitElement) {
  static get styles() {
    // language=CSS
    return [
      fontStyles,
      colorStyles,
      css`
:host {
    display: inline-block;
    outline: none;
    width: 48px;
}
[hidden] {
  display: none !important;
}
.fab {
  cursor: pointer;
  position: absolute;
  display: flex;
  right: 6px;
  top: 6px;
  height: 36px;
  width: 36px;
  border-radius: 50%;
  color: black;
  font-size: 0.95rem;
  background-color: var(--color-secondary);
  box-shadow: var(--elevation-06);
}
.fab > * {
  margin: auto;
}
    `];
  }

  render() {
    return html`
<div class="fab" @click="${this._click}" ?hidden="${!this._userid}"><span>${this._initials}</span></div>
<div class="fab" @click="${this._click}" ?hidden="${this._userid}"><mwc-icon>person_outline</mwc-icon></div>
    `;
  }

  static get properties() {
    return {
      _userid: {type: String},
      _initials: {type: String},
    };
  }

  firstUpdated(changedProperties) {
  }

  updated(changedProps) {
  }

  stateChanged(state) {
    this._userid = state.app.userid;
    this._initials = this._userid ? this._buildInitials(this._userid) : null;
  }

  _buildInitials(userid) {
    var pos = userid.indexOf('.');
    return pos !== -1 ? userid[pos+1].toUpperCase() + userid[0].toUpperCase() : userid[0].toUpperCase();
  }

  _click(e) {
    this.dispatchEvent(new CustomEvent('lclick', {bubbles: true, composed: true}));
  }
}

customElements.define('kmap-login-button', KMapLoginButton);
