import {LitElement, html, css, customElement, property} from 'lit-element';
import { connect } from '@captaincodeman/rdx';
import {State, store} from "../store";

import {colorStyles, fontStyles, themeStyles} from "./kmap-styles";
import '@material/mwc-icon-button';
import '@material/mwc-top-app-bar';
import './kmap-login-button';
import './kmap-subject-card';


@customElement('kmap-subjects')
export class KMapSubjects extends connect(store, LitElement) {
  @property()
  private _subjects: string[] = [];

  mapState(state: State) {
    return {
      _subjects: state.subjects.subjects,
    };
  }

  static get styles() {
    // language=CSS
    return [
      fontStyles,
      colorStyles,
      themeStyles,
      css`
        :host {
          display: contents;
        }
        .board {
          height: auto;
          outline: none;
          padding: 16px 8px 8px 8px;
          padding-bottom: 36px;
        }
        kmap-subject-card {
          display: inline-block;
          margin-bottom: 16px;
          vertical-align: top;
        }
      `];
  }

  render() {
    // language=HTML
    return html`
      <main id="content" class="board" tabindex="0">
          ${this._subjects.map((subject) => html`
              <kmap-subject-card .subject="${subject}"></kmap-subject-card>
          `)}
      </main>
`;}
}
