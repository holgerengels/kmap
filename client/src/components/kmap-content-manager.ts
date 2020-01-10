import {LitElement, html, css, customElement, property, query} from 'lit-element';
import {connect} from '@captaincodeman/rdx';
import {State, store} from "../store";

import '@material/mwc-dialog';
import '@material/mwc-icon-button';
import '@material/mwc-button';
import '@material/mwc-textfield';
import '@material/mwc-top-app-bar';
import './kmap-content-manager-instances';
import './kmap-content-manager-modules';
import './kmap-content-manager-sets';
import {set} from "idb-keyval";
import {colorStyles, fontStyles} from "./kmap-styles";
import {Dialog} from "@material/mwc-dialog/mwc-dialog";
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
  private _dialog: Dialog;
  @query('#instance')
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

  _switchInstance() {
    this._dialog.show();
  }

  _chooseInstance() {
    let instance = this._textfield.value;
    set("instance", instance)
      .then(() => location.reload());
    this._dialog.close();
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
        <mwc-icon-button icon="menu" slot="navigationIcon" @click="${() => this._fire('toggleDrawer')}"></mwc-icon-button>
        <div slot="title">Content Manager</div>
        <mwc-icon-button icon="polymer" slot="actionItems" @click="${this._switchInstance}"></mwc-icon-button>
        <kmap-login-button slot="actionItems" @lclick="${() => this._fire('login')}"></kmap-login-button>
      </mwc-top-app-bar>
      <div id="content" class="board">
        ${this._roles.includes('admin') ? html`<kmap-content-manager-instances></kmap-content-manager-instances>` : ''}
        ${this._roles.includes('teacher') ? html`<kmap-content-manager-modules></kmap-content-manager-modules>` : ''}
        ${this._roles.includes('teacher') ? html`<kmap-content-manager-sets></kmap-content-manager-sets>` : ''}
      </div>
    <mwc-dialog id="dialog" title="Instanz wechseln">
      <mwc-textfield id="instance" name="instance" label="Instanz" type="text" required dialogInitialFocus></mwc-textfield>
      <mwc-button slot="primaryAction" @click=${this._chooseInstance}>Auswählen</mwc-button>
   </mwc-dialog>
`;
  }
}
