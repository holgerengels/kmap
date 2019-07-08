import {LitElement, html, css} from 'lit-element';
import {connect} from 'pwa-helpers/connect-mixin.js';
import {config} from "../config";
import {store} from "../store";
import './kmap-subject-card';

import 'mega-material/icon-button';
import 'mega-material/top-app-bar';

class KMapSubjects extends connect(store)(LitElement) {
    static get styles() {
        return [
            css`
            .board {
                height: auto;
                outline: none;
                padding: 8px;
                padding-bottom: 36px;
            }
        `
        ];
    }

    render() {
        return html`
      <mwc-top-app-bar>
        <mwc-icon-button icon="menu" slot="navigationIcon"></mwc-icon-button>
        <div slot="title">Fächer</div>
      </mwc-top-app-bar>
        <div id="subjects" class="board" tabindex="0">
            ${this.subjects.map((subject, j) => html`
                <kmap-subject-card .subject="${subject}"></kmap-subject-card>
            `)}
        </div>
`;}

    static get properties() {
        return {
            subjects: {type: Array},
            active: {type: Boolean, observer: 'activeChanged'},
        };
    }

  constructor() {
        super();
        this.subjects = [];
  }

  firstUpdated(changedProperties) {
      return fetch(`${config.server}data?subjects=all`, {
          method: "GET",
          mode: "cors",
          cache: "no-cache",
          credentials: "same-origin",
          headers: {
              "Content-Type": "application/json; charset=utf-8",
          }
      })
          .then(res => res.json())
          .then(subjects => this.subjects = subjects)
          .catch((e) => { console.log(e);});
  }

    updated(changedProperties) {
        console.log(changedProperties);
    }
}
customElements.define('kmap-subjects', KMapSubjects);
