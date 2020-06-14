import {LitElement, html, css, customElement, property} from 'lit-element';
import {unsafeHTML} from 'lit-html/directives/unsafe-html';
import {urls} from "../urls";
import {colorStyles, fontStyles} from "./kmap-styles";
import {math} from "../math";

@customElement('kmap-knowledge-card-description')
export class KMapKnowledgeCardDescription extends LitElement {
  @property({type: String})
  private instance: string = '';
  @property({type: String})
  private subject: string = '';
  @property({type: String})
  private chapter: string = '';
  @property({type: String})
  private topic: string = '';
  @property({type: String})
  private description: string = '';
  @property()
  private _description: string = '';

  updated(changedProperties) {
    if (changedProperties.has("description")) {
      let setter = (value:string):void => { this._description = value };

      if (this.description) {
        let code = this.description.replace(/inline:([^"]*)/g, urls.server + "data/" + this.subject + "/" + this.chapter + "/" + this.topic + "/$1?instance=" + this.instance);
        code = code.replace(/link:/g, urls.client + "browser/");
        math(code, setter);
      }
      else
        setter("");
    }
  }

  static get styles() {
    // language=CSS
    return [
      fontStyles,
      colorStyles,
      css`
        :host {
          display: block;
          padding: 12px;
          transition: background-color .5s ease-in-out;
        }
        img {
          max-width: calc(100vw - 44px);
        }
        a {
          color: var(--color-opaque);
          text-decoration: none;
          font-weight: bold;
        }
        a:hover {
          text-decoration: underline;
        }
        container {
          display: flex;
          flex-direction: row;
          flex-wrap: wrap;
          margin: -8px;
        }
        box {
          flex: 0 1 auto;
          margin: 8px;
        }
        growbox {
          flex: 1 1 400px;
          margin: 8px;
        }
        box img {
          max-width: calc(100vw - 44px);
        }
        figure { margin: 0px; }
      `
    ];
  }

  render() {
    // language=HTML
    return html`
        ${this._description ? html`${unsafeHTML(this._description)}` : html`
          Zu dieser Karte gibt es noch keinen Inhalt. Nutze die Feedbackfunktion, um Inhalt oder Links vorzuschlagen!
        `}
    `;
  }
}
