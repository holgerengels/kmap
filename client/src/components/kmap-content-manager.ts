import {LitElement, html, css, customElement, property, query} from 'lit-element';
import {connect} from '@captaincodeman/rdx';
import {State, store} from "../store";

import '@material/mwc-dialog';
import '@material/mwc-icon-button';
import '@material/mwc-button';
import '@material/mwc-textfield';
import '@material/mwc-top-app-bar';
import './kmap-content-manager-feedback';
import './kmap-content-manager-instances';
import './kmap-content-manager-modules';
import './kmap-content-manager-sets';
import {colorStyles, fontStyles} from "./kmap-styles";
import {TextField} from "@material/mwc-textfield/mwc-textfield";
import {TopAppBar} from "@material/mwc-top-app-bar/mwc-top-app-bar";

@customElement('kmap-content-manager')
export class KMapContentManager extends connect(store, LitElement) {
  @property()
  private _roles: string[] = [];

  @query('#bar')
  // @ts-ignore
  private _bar: TopAppBar;
  @query('#content')
  // @ts-ignore
  private _content: HTMLElement;
  @query('#dialog')
  // @ts-ignore
  private _textfield: TextField;

  // @ts-ignore
  firstUpdated(changedProperties) {
    this._bar.scrollTarget = this._content;
  }

  mapState(state: State) {
    return {
      _roles: state.app.roles,
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
      css`
        :host {
          display: contents;
        }
        .board {
          height: auto;
          padding-bottom: 36px;
          display: flex;
          flex-flow: row wrap;
          justify-content: flex-start;
        }
      `];
  }

  render() {
    // language=HTML
    return html`
      <mwc-top-app-bar id="bar" dense>
        <mwc-icon-button icon="menu" slot="navigationIcon" @click="${() => this._fire('toggleDrawer')}"></mwc-icon-button>
        <div slot="title">Content Manager</div>
        <kmap-login-button slot="actionItems" @lclick="${() => this._fire('login')}"></kmap-login-button>
      </mwc-top-app-bar>
      <div id="content" class="board">
        ${this._roles.includes('admin') ? html`<kmap-content-manager-instances></kmap-content-manager-instances>` : ''}
        ${this._roles.includes('teacher') ? html`<kmap-content-manager-modules></kmap-content-manager-modules>` : ''}
        ${this._roles.includes('teacher') ? html`<kmap-content-manager-sets></kmap-content-manager-sets>` : ''}
        ${this._roles.includes('teacher') ? html`<kmap-content-manager-feedback></kmap-content-manager-feedback>` : ''}
      </div>
    `;
  }
}
