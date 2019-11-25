import { LitElement, html, css } from 'lit-element';
import {unsafeHTML} from 'lit-html/directives/unsafe-html';
import {colorStyles, fontStyles} from "./kmap-styles";
import {config} from "../config";

class KMapKnowledgeCardDescription extends LitElement {
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
    ${this._description
      ? html`
    ${unsafeHTML(this._description)}
        `
      : ''}
    `;
  }

  static get properties() {
    return {
      instance: {type: String},
      subject: {type: String},
      chapter: {type: String},
      topic: {type: String},
      description: {type: String},
      _description: {type: String},
    };
  }

  constructor() {
    super();
    this.instance = null;
    this.subject = '';
    this.chapter = '';
    this.topic = '';
    this.description = '';
    this._description = '';
  }

  updated(changedProperties) {
    if (changedProperties.has("description")) {
      if (this.description) {
        let description = this.description.replace(/inline:([^"]*)/g, config.server + "data/" + this.subject + "/" + this.chapter + "/" + this.topic + "/$1?instance=" + this.instance);
        description = description.replace(/link:/g, config.client + this.instance + "/#browser/");

        let buffer = "";
        let t = false;
        description.split("`").reverse().forEach(function (element) {
          if (t) {
            buffer = " " + MathJax.asciimath2svg(element).getElementsByTagName("svg")[0].outerHTML + " " + buffer;
          }
          else
            buffer = element + buffer;
          t = !t;
        });
        this._description = buffer;
      }
      else
        this._description = "";
    }
  }
}

window.customElements.define('kmap-knowledge-card-description', KMapKnowledgeCardDescription);
