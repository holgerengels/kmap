import {LitElement, html, css, customElement, property} from 'lit-element';
import {unsafeHTML} from 'lit-html/directives/unsafe-html';
import {config} from "../config";
import {colorStyles, fontStyles} from "./kmap-styles";

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
      if (this.description) {
        let description = this.description.replace(/inline:([^"]*)/g, config.server + "data/" + this.subject + "/" + this.chapter + "/" + this.topic + "/$1?instance=" + this.instance);
        description = description.replace(/link:/g, config.client + this.instance + "//app/browser/");

        // @ts-ignore
        window.MathJaxLoader
          .then(() => {
          let buffer = "";
          let t = false;
          description.split("`").reverse().forEach(function (element) {
            if (t) {
              // @ts-ignore
              buffer = " " + window.MathJax.asciimath2svg(element).getElementsByTagName("svg")[0].outerHTML + " " + buffer;
            } else
              buffer = element + buffer;
            t = !t;
          });
          this._description = buffer;
        });
      }
      else
        this._description = "";
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
          flex: none;
          margin: 8px;
        }
        growbox {
          flex: 1;
          flex-basis: 0.000000001px;
          margin: 8px;
        }
        box img {
          max-width: calc(100vw - 44px);
        }
      `
    ];
  }

  render() {
    // language=HTML
    return html`
        ${this._description ? html`${unsafeHTML(this._description)}` : ''}
    `;
  }
}