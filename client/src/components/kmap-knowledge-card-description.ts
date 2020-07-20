import {LitElement, html, css, customElement, property} from 'lit-element';
import {unsafeHTML} from 'lit-html/directives/unsafe-html';
import {urls} from "../urls";
import {colorStyles, fontStyles} from "./kmap-styles";
import {katexStyles} from "../katex-css";
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

  constructor() {
    super();
    // @ts-ignore
    if (!window.mark) {
      // @ts-ignore
      window.mark = function (that, ids: string[]) {
        for (const id of ids) {
          // @ts-ignore
          var el = that.getRootNode().getElementById(id);
          if (el)
            el.classList.add("marked");
        }
      }
      // @ts-ignore
      window.unmark = function (that, ids: string[]) {
        for (const id of ids) {
          // @ts-ignore
          var el = that.getRootNode().getElementById(id);
          if (el)
            el.classList.remove("marked");
        }
      }
    }
  }

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
      katexStyles,
      css`
        :host {
          display: block;
          padding: 12px;
          transition: background-color .5s ease-in-out;
          font-family: Roboto,sans-serif;
          -webkit-font-smoothing: antialiased;
          font-size: 0.95rem;
          font-weight: 400;
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
        calculation {
          display: grid;
          grid-gap: 16px;
          grid-template-columns: max-content auto;
        }
        step {
          grid-column: 1;
        }
        notes {
          grid-column: 2;
          font-size: 90%;
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
