import {html, css} from 'lit';
import {customElement, state} from 'lit/decorators.js';
import {Connected} from "./connected";
import {State} from "../store";

import '@material/mwc-icon';
import {resetStyles, fontStyles, colorStyles, elevationStyles} from "./kmap-styles";

@customElement('kmap-login-button')
export class KMapLoginButton extends Connected {
  @state()
  private _userid: string = '';
  @state()
  private _initials: string = '';

  mapState(state: State) {
    return {
      _userid: state.app.userid,
      _initials: state.app.username ? this._buildInitials(state.app.username) : '',
    };
  }


  static get properties() {
    return {
      _userid: {type: String},
      _initials: {type: String},
    };
  }

  _buildInitials(userid) {
    var pos = userid.indexOf('.');
    return pos !== -1 ? userid[pos+1].toUpperCase() + userid[0].toUpperCase() : userid[0].toUpperCase();
  }

  static get styles() {
    // language=CSS
    return [
      resetStyles,
      fontStyles,
      colorStyles,
      elevationStyles,
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
          background-color: var(--color-secondary);
          box-shadow: var(--elevation-02);
          transition: var(--elevation-transition);
        }
        .fab:hover {
          box-shadow: var(--elevation-06);
        }
        .fab > * {
          margin: auto;
        }
    `];
  }

  render() {
    // language=HTML
    return html`
<div class="fab" aria-haspopup="dialog" font-body" ?hidden="${!this._userid}"><span>${this._initials}</span></div>
<div class="fab" aria-haspopup="dialog" ?hidden="${this._userid}"><mwc-icon>person_outline</mwc-icon></div>
    `;
  }
}
