import {LitElement, html, css, customElement} from 'lit-element';
import '@material/mwc-icon';
import {fontStyles} from "./kmap-styles";

@customElement('share-facebook')
export class ShareFacebook extends LitElement {

  static get styles() {
    // language=CSS
    return [
      fontStyles,
      css`
        :host {
          display: flex;
          justify-content: right;
        }
        a {
          display: flex;
          width: fit-content;
          background-color: #4267b2;
          color: white;
          border-radius: 2px;
          cursor: pointer;
        }
        a:hover {
          background-color: #365899;
          transition: 200ms ease-in-out background-color, 200ms ease-in-out box-shadow;
          text-decoration: none;
        }
        a:active {
          background-color: #29487d;
        }
        a:focus {
          box-shadow: 0 0 1px 2px rgba(88, 144, 255, .75), 0 1px 1px rgba(0, 0, 0, .15);
        }
        a > * {
          margin: 2px 3px;
        }
      `];
  }

  _href() {
    return 'https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(document.location.href);
  }

  render() {
    //language=HTML
    return html`
      <a href="${this._href()}" title="Auf Facebook teilen"><img src="icons/facebook.svg" width="16" height="16" alt="f"/><h6>teilen</h6></a>
    `;
  }
}
