import {LitElement, html, css} from 'lit';
import {customElement} from 'lit/decorators.js';
import '@material/mwc-icon';
import {resetStyles, fontStyles, elevationStyles} from "./kmap-styles";

@customElement('share-facebook')
export class ShareFacebook extends LitElement {

  static get styles() {
    // language=CSS
    return [
      resetStyles,
      fontStyles,
      elevationStyles,
      css`
        :host {
          display: flex;
          justify-content: right;
        }
        a {
          display: flex;
          align-items: center;
          width: fit-content;
          padding: 4px 8px;
          gap: 8px;
          background-color: #4267b2;
          color: white;
          border-radius: 2px;
          cursor: pointer;
          box-shadow: var(--elevation-01);
          transition: 200ms ease-in-out background-color, var(--elevation-transition);
        }
        a:hover {
          background-color: #365899;
          text-decoration: none;
          box-shadow: var(--elevation-03);
        }
        a:active {
          background-color: #29487d;
        }
        a:focus {
          box-shadow: var(--elevation-03);
          outline: none;
        }
      `];
  }

  _href() {
    return 'https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(document.location.href);
  }

  render() {
    //language=HTML
    return html`
      <a href="${this._href()}" title="Auf Facebook teilen"><img src="icons/facebook.svg" width="16" height="16" alt="f"/><label>teilen</label></a>
    `;
  }
}
