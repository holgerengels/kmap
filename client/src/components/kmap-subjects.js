import {LitElement, html, css} from 'lit-element';
import {connect} from 'pwa-helpers/connect-mixin.js';
import {config} from "../config.js";
import {store} from "../store";
import {handleErrors} from "../actions/fetchy";
import {logout, showMessage, updateTitle} from "../actions/app";

import {colorStyles, fontStyles} from "./kmap-styles";
import '@material/mwc-icon-button';
import '@material/mwc-top-app-bar';
import './kmap-login-button';
import './kmap-subject-card';


class KMapSubjects extends connect(store)(LitElement) {
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
  outline: none;
  padding: 8px;
  padding-bottom: 36px;
}
kmap-subject-card {
  display: inline-block;
  margin-bottom: 16px;
  margin-left: 6px;
  margin-right: 6px;
  vertical-align: top;
}
      `];
  }

  render() {
    // language=HTML
    return html`
      <mwc-top-app-bar id="bar" dense>
        <mwc-icon-button icon="menu" slot="navigationIcon" @click="${e => this._fire('toggleDrawer')}"></mwc-icon-button>
        <div slot="title">Fächer</div>
        <kmap-login-button slot="actionItems" @lclick="${e => this._fire('login')}"></kmap-login-button>
      </mwc-top-app-bar>
        <div id="content" class="board" tabindex="0">
            ${this.subjects.map((subject, j) => html`
                <kmap-subject-card .subject="${subject}"></kmap-subject-card>
            `)}
        </div>
`;}

  static get properties() {
    return {
      _userid: {type: String},
      subjects: {type: Array},
    };
  }

  constructor() {
    super();
    this.subjects = [];
  }

  firstUpdated(changedProperties) {
    let bar = this.shadowRoot.getElementById('bar');
    let content = this.shadowRoot.getElementById('content');
    bar.scrollTarget = content;

      fetch(`${config.server}data?subjects=all`, {
          method: "GET",
          mode: "cors",
          cache: "no-cache",
          credentials: "include",
          headers: {
              "Content-Type": "application/json; charset=utf-8",
          }
      })
        .then(handleErrors)
        .then(res => res.json())
        .then(subjects => this.subjects = subjects)
        .catch((error) => {
          store.dispatch(showMessage(error.message));
          if (error.message === "invalid session")
            store.dispatch(logout({userid: this._userid}));
        });
    store.dispatch(updateTitle("Fächer"));
  }

  updated(changedProperties) {
  }

    stateChanged(state) {
      this._userid = state.app.userid;
    }


    _fire(name) {
    this.dispatchEvent(new CustomEvent(name, {bubbles: true, composed: true}));
  }
}
customElements.define('kmap-subjects', KMapSubjects);
