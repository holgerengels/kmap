import {LitElement, html, css} from 'lit-element';
import {connect} from 'pwa-helpers/connect-mixin.js';
import {config} from "../config.js";
import {store} from "../store";
import './kmap-subject-card';

import 'mega-material/icon-button';
import 'mega-material/top-app-bar';
import {handleErrors} from "../actions/fetchy";
import {logout, showMessage} from "../actions/app";

class KMapSubjects extends connect(store)(LitElement) {
  static get styles() {
    // language=CSS
    return [
      css`
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
        `
    ];
  }

  render() {
    // language=HTML
    return html`
      <mega-top-app-bar>
        <mega-icon-button icon="menu" slot="navigationIcon"></mega-icon-button>
        <div slot="title">Fächer</div>
      </mega-top-app-bar>
        <div id="subjects" class="board" tabindex="0">
            ${this.subjects.map((subject, j) => html`
                <kmap-subject-card .subject="${subject}"></kmap-subject-card>
            `)}
        </div>
`;}

    static get properties() {
        return {
          _userid: {type: String},
            subjects: {type: Array},
            active: {type: Boolean, observer: 'activeChanged'},
        };
    }

  constructor() {
        super();
        this.subjects = [];
  }

  firstUpdated(changedProperties) {
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
  }

    updated(changedProperties) {
        console.log(changedProperties);
    }

    stateChanged(state) {
      this._userid = state.app.userid;
    }
}
customElements.define('kmap-subjects', KMapSubjects);
