import { LitElement, html, css } from 'lit-element';
import {unsafeHTML} from 'lit-html/directives/unsafe-html';
import {colorStyles, fontStyles} from "./kmap-styles";
import {config} from "../config";
import {mathjaxStyles} from "./mathjax-styles";
import AsciiMathParser from "asciimath2tex";

class KMapKnowledgeCardDescription extends LitElement {
  static get styles() {
    // language=CSS
    return [
      fontStyles,
      colorStyles,
      mathjaxStyles,
      css`
.content {
  padding: 12px;
  transition: background-color .5s ease-in-out;
}
.content img {
  max-width: calc(100vw - 44px);
}
.content a {
  color: var(--color-opaque);
  text-decoration: none;
  font-weight: bold;
}
.content a:hover {
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
<div class="content">
    ${unsafeHTML(this._description)}
</div>
    `;
  }

  static get properties() {
    return {
      key: {type: String},
      subject: {type: String},
      chapter: {type: String},
      topic: {type: String},
      description: {type: String},
      _description: {type: String},
    };
  }

  constructor() {
    super();
    this.key = '';
    this.subject = '';
    this.chapter = '';
    this.topic = '';
    this.description = '';
    this._description = '';
  }

  updated(changedProperties) {
    if (changedProperties.has("description")) {
      if (this.description) {
        let description = this.description.replace(/inline:/g, config.server + "data/" + this.subject + "/" + this.chapter + "/" + this.topic + "/");
        let buffer = "";
        let t = false;
        description.split("`").reverse().forEach(function (element) {
          if (t) {
            const parser = new AsciiMathParser();
            element = parser.parse(element);
            MathJax.texReset();
            buffer = " " + MathJax.tex2svg(element).getElementsByTagName("svg")[0].outerHTML + " " + buffer;
          }
          else
            buffer = element + buffer;
          t = !t;
        });
        this._description = buffer;
      }
      else this._description = "";
    }

  }
}

window.customElements.define('kmap-knowledge-card-description', KMapKnowledgeCardDescription);
