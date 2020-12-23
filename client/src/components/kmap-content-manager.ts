import {html, css, customElement, property} from 'lit-element';
import {Connected} from "./connected";
import {State} from "../store";

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

@customElement('kmap-content-manager')
export class KMapContentManager extends Connected {
  @property()
  private _roles: string[] = [];


  mapState(state: State) {
    return {
      _roles: state.app.roles,
    };
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
      <main id="content" class="board">
        ${this._roles.includes('admin') ? html`<kmap-content-manager-instances></kmap-content-manager-instances>` : ''}
        ${this._roles.includes('teacher') ? html`<kmap-content-manager-modules></kmap-content-manager-modules>` : ''}
        ${this._roles.includes('teacher') ? html`<kmap-content-manager-sets></kmap-content-manager-sets>` : ''}
        ${this._roles.includes('teacher') ? html`<kmap-content-manager-feedback></kmap-content-manager-feedback>` : ''}
      </main>
    `;
  }
}
