import {LitElement, html, css, customElement, property} from 'lit-element';
import {unsafeHTML} from 'lit-html/directives/unsafe-html';
import {urls} from "../urls";
import {colorStyles, fontStyles} from "./kmap-styles";
import {katexStyles} from "../katex-css";
import {math} from "../math";

import {KmapTermTree} from "kmap-term-tree";
window.customElements.define('kmap-term-tree', KmapTermTree);

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
          font-family: Roboto,sans-serif;
          -webkit-font-smoothing: antialiased;
          font-size: 0.95rem;
          font-weight: 400;
        }
        container {
          display: flex;
          flex-direction: row;
          flex-wrap: wrap;
          margin: -8px;
        }
        img {
          max-width: calc(var(--content-width, 100vw) - 64px);
        }
        box {
          flex: 0 1 0px;
          margin: 8px;
        }
        growbox {
          flex: 1 1 300px;
          margin: 8px;
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
