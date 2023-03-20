import {LitElement, html, css} from 'lit';
import {customElement, property, state} from 'lit/decorators.js';
import {unsafeHTML} from 'lit/directives/unsafe-html.js';
import {urls} from '../urls';
import {calculationStyles, colorStyles, fontStyles, resetStyles} from "./kmap-styles";
import {katexStyles} from "../katex-css";
import {math} from "../math";
import {lazyComponents} from "./lazy-components";

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
  @state()
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

  willUpdate(_changedProperties) {
    if (_changedProperties.has("description")) {
      if (this.description) {
        let code = this.description.replace(/inline:([^"]*)/g, urls.server + "data/" + this.subject + "/" + this.chapter + "/" + this.topic + "/$1?instance=" + this.instance);
        code = code.replace(/link:/g, urls.client + "browser/");
        code = this.anchors(code);
        this._description = math(code);
      }
      else
        this._description = '';
    }
  }

  private anchors(code: string) {
    return code.replace(/(<h3>(.*)<\/h3>)/g, (m) => {
      let text = m.substring(4, m.length - 5)
      let id = text;
      id = id.toLowerCase();
      id = id.replaceAll(/["'`´§$%#|^°()<>{}\[\]]/g, "");
      id = id.replace(/[*~+-_ .,:;!?=&\/\\|äöüÄÖÜß]/g, (m) => {
        switch (m) {
          case 'ä':
            return 'ae';
          case 'ö':
            return 'oe';
          case 'ü':
            return 'ue';
          case 'Ä':
            return 'Ae';
          case 'Ö':
            return 'Oe';
          case 'Ü':
            return 'Ue';
          case 'ß':
            return 'ss';
          default:
            return '-';
        }
      });
      id = id.replaceAll(/ö/g, "oe");
      id = id.replaceAll(/ü/g, "ue");
      id = id.replaceAll(/Ä/g, "Ae");
      id = id.replaceAll(/Ö/g, "Oe");
      id = id.replaceAll(/Ü/g, "Ue");
      id = id.replaceAll(/ß/g, "ss");
      id = id.replaceAll(/[-_ ]/g, "-");
      return `<h3><a href="${urls.client}browser/${this.subject}/${this.chapter}/${this.topic}#${id}" id="${id}">${text}</a></h3>`;
    });
  }

  protected async updated(_changedProperties) {
    if (_changedProperties.has("_description")) {
      await lazyComponents(this._description);
      const {hash} = window.location;

      if (hash) {
        const element = this.shadowRoot!.querySelector(`[id="${hash.substring(1)}"]`);
        if (element) {
          console.log("scroll to " + element)
          window.setTimeout(() => {
            window.requestAnimationFrame(() => element.scrollIntoView({block: 'start', behavior: 'smooth'}));
          }, 200);
        }
      }
    }
  }

  static get styles() {
    // language=CSS
    return [
      resetStyles,
      fontStyles,
      colorStyles,
      katexStyles,
      calculationStyles,
      css`
        :host {
          display: block;
        }
        container {
          display: flex;
          flex-direction: row;
          flex-wrap: wrap;
          margin: -8px;
        }
        box {
          flex: 1 1 100%;
          margin: 8px;
        }
        growbox {
          flex: 1 1 100%;
          margin: 8px;
        }
        @media (min-width: 600px) {
          box {
            flex: 0 1 auto;
            margin: 8px;
          }
          growbox {
            flex: 1 1 0px;
            margin: 8px;
          }
        }
        img {
          max-width: calc(var(--content-width, 100vw) - 32px);
        }
        @media (min-width: 600px) {
            img {
                max-width: calc(var(--content-width, 100vw) - 64px);
            }
        }
        figure { margin: 0px; }

        h3:after {
          color: transparent;
          transition: color .3s ease-in-out;
          content: '\\a0 ¶';
        }
        h3:hover:after {
          text-decoration: none;
          color: var(--color-mediumgray);
        }
        h3 a {
          text-decoration: underline solid transparent;
          transition: text-decoration .3s ease-in-out;
          color: inherit;
        }
        h3:hover a {
          text-decoration: underline solid var(--color-mediumgray);
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
