import {LitElement, html, css, customElement, property} from 'lit-element';
import {unsafeHTML} from 'lit-html/directives/unsafe-html';
import {urls} from "../urls";
import {colorStyles, fontStyles, themeStyles} from "./kmap-styles";

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
        let description = this.description.replace(/inline:([^"]*)/g, urls.server + "data/" + this.subject + "/" + this.chapter + "/" + this.topic + "/$1?instance=" + this.instance);
        description = description.replace(/link:/g, urls.client + "browser/");

        // @ts-ignore
        window.MathJaxLoader
          .then(() => {
          let buffer = "";
          let to = false;
          description.split("`").reverse().forEach(function (element) {
            if (to) {
              // @ts-ignore
              buffer = " " + window.MathJax.asciimath2svg(element).getElementsByTagName("svg")[0].outerHTML + " " + buffer;
            }
            else {
              let inner = "";
              let ti = false;
              element.split("´").reverse().forEach(function (ilimint) {
                if (ti) {
                  // @ts-ignore
                  inner = " " + window.MathJax.tex2svg(ilimint).getElementsByTagName("svg")[0].outerHTML + " " + inner;
                }
                else {
                  inner = ilimint + inner;
                }
                ti = !ti;
              });
              buffer = inner + buffer;
            }
            to = !to;
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
      themeStyles,
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
