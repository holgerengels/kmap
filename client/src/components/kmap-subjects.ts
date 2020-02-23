import {LitElement, html, css, customElement, property, query} from 'lit-element';
import { connect } from '@captaincodeman/rdx';
import {State, store} from "../store";

import {colorStyles, fontStyles, themeStyles} from "./kmap-styles";
import '@material/mwc-icon-button';
import '@material/mwc-top-app-bar';
import './kmap-login-button';
import './kmap-subject-card';
import {TopAppBar} from "@material/mwc-top-app-bar/mwc-top-app-bar";


@customElement('kmap-subjects')
export class KMapSubjects extends connect(store, LitElement) {
  @property()
  private _subjects: string[] = [];

  @query('#bar')
  // @ts-ignore
  private _bar: TopAppBar;
  @query('#content')
  // @ts-ignore
  private _content: HTMLElement;

  // @ts-ignore
  firstUpdated(changedProperties) {
    this._bar.scrollTarget = this._content;
  }

  mapState(state: State) {
    return {
      _subjects: state.subjects.subjects,
    };
  }

  _fire(name) {
    this.dispatchEvent(new CustomEvent(name, {bubbles: true, composed: true}));
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
        <mwc-icon-button icon="menu" slot="navigationIcon" @click="${() => this._fire('toggleDrawer')}"></mwc-icon-button>
        <div slot="title">Fächer</div>
        <kmap-login-button slot="actionItems" @lclick="${() => this._fire('login')}"></kmap-login-button>
      </mwc-top-app-bar>
        <div id="content" class="board" tabindex="0">
            ${this._subjects.map((subject) => html`
                <kmap-subject-card .subject="${subject}"></kmap-subject-card>
            `)}
        </div>
`;}
}
