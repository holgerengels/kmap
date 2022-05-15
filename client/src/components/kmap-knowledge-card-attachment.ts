import {css, html, LitElement} from 'lit';
import {customElement, property, state} from 'lit/decorators.js';
import {urls} from '../urls';

import '@material/mwc-icon';
import {Attachment} from "../models/types";
import {fontStyles} from "./kmap-styles";
import {unsafeHTML} from "lit/directives/unsafe-html.js";

@customElement('kmap-knowledge-card-attachment')
export class KMapKnowledgeCardAttachment extends LitElement {
  @property({type: String})
  private instance: string = '';
  @state()
  private _supportsDownload: boolean = !(/iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream);
  @property({type: Object})
  private attachment?: Attachment;
  @state()
  private _handler: string = '';
  @state()
  private _mimeIcon: string = '';
  @state()
  private _isDownload?: string = undefined;
  @state()
  private _isTarget?: string = undefined;

  willUpdate(changedProperties) {
    if (changedProperties.has("attachment") && this.attachment !== undefined) {
      this._handler = this.getHandler(this.attachment.mime);
      this._mimeIcon = this.mimeIcon(this.attachment.mime);
      this._isDownload = this.attachment.type === "file" && this.attachment.mime !== "text/html" && this._supportsDownload ? this.attachment.file : undefined;
      this._isTarget = this.attachment.type === "link" || this.attachment.mime === "text/html" || !this._supportsDownload ? "_blank" : undefined;
    }
  }

  private getHandler(mime?: string) {
    switch (mime) {
      case "application/vnd.geogebra.file":
      case "application/vnd.geogebra-classic.file":
        return "/app/geogebra.html?path=" + urls.server;
      case "application/vnd.geogebra-3d.file":
        return "/app/geogebra.html?app=3d&path=" + urls.server;
      case "application/vnd.geogebra-graphing.file":
        return "/app/geogebra.html?app=graphing&path=" + urls.server;
      case "application/vnd.geogebra-geometry.file":
        return "/app/geogebra.html?app=geometry&path=" + urls.server;
      default:
        return "";
    }
  }

  mimeIcon(mimeType) {
    console.log(mimeType);
    var icon = fileIcons[mimeType];
    if (icon)
      return icon;

    if (mimeType.startsWith("text"))
      return "description";
    if (mimeType.startsWith("image"))
      return "photo";
    if (mimeType.startsWith("video"))
      return "movie";
    if (mimeType.startsWith("audio"))
      return "audio";

    console.log("no icon for " + mimeType);
    return "scatter_plot";
  }

  static get styles() {
    // language=CSS
    return [
      fontStyles,
      css`
        p {
          margin-top: 16px !important;
          margin-bottom: 0px;
          text-align: start;
        }
        mwc-icon {
          font-size: 18px;
          vertical-align: middle;
        }
      `];
  }

  render() {
    // language=HTML
    return html`
      <p>
        ${this.attachment?.type === 'link'
          ? html`<mwc-icon>link</mwc-icon>`
          : html`<mwc-icon>${unsafeHTML(this._mimeIcon)}</mwc-icon>&nbsp`}
        ${this._renderAttachment()}
      </p>
    `;
  }

  // TODO spread
  _renderAttachment() {
    if (this.attachment === undefined) {
      return html `attachment undefined`;
    }
    else if (this.attachment.type === "link")
      return html `
            <a href="${this.attachment.href}" target="_blank" rel="external noopener">${this.attachment.name} <mwc-icon>open_in_new</mwc-icon></a>
        `;
    else if (this._handler && this._isTarget)
      return html `
            <a href="${this._handler}${this.attachment.href}?instance=${this.instance}" target="_blank" rel="external noopener nofollow">${this.attachment.name}&nbsp;<mwc-icon>open_in_new</mwc-icon></a>
            <a href="${urls.server}${this.attachment.href}?instance=${this.instance}" download="${this._isDownload}" target="${this._isTarget}"><mwc-icon>cloud_download</mwc-icon></a>
        `;
    else if (this._handler)
      return html `
            <a href="${this._handler}${this.attachment.href}?instance=${this.instance}" target="_blank" rel="external noopener nofollow">${this.attachment.name}&nbsp;<mwc-icon>open_in_new</mwc-icon></a>
            <a href="${urls.server}${this.attachment.href}?instance=${this.instance}" download="${this._isDownload}"><mwc-icon>cloud_download</mwc-icon></a>
        `;
    else if (this._isDownload && this._isTarget)
      return html `
            <a href="${urls.server}${this.attachment.href}?instance=${this.instance}" download="${this._isDownload}" target="${this._isTarget}">${this.attachment.name}</a>
        `;
    else if (this._isDownload)
      return html `
            <a href="${urls.server}${this.attachment.href}?instance=${this.instance}" download="${this._isDownload}">${this.attachment.name}</a>
        `;
    else if (this._isTarget)
      return html `
            <a href="${urls.server}${this.attachment.href}?instance=${this.instance}" target="${this._isTarget}">${this.attachment.name}</a>
        `;
    else
      return html `
            <a href="${urls.server}${this.attachment.href}?instance=${this.instance}">${this.attachment.name}</a>
        `;
  }
}

const fileIcons  = {
    "link": "link",
    "application/octet-stream": "scatter_plot",
    "application/pdf": "picture_as_pdf",
    "application/vnd.geogebra.file": "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"18\" height=\"18\" viewBox=\"0 0 28 28\">" +
      "<path fill=\"none\" stroke=\"#666\" stroke-width=\"2.2\" d=\"m15.3,4.7a11.4,9.1-26 1,0 1,0z\"/>" +
      "<g stroke-linecap=\"round\">" +
      "<path stroke=\"#000\" stroke-width=\"6\" d=\"m13.2,4.9h0M3.8,11.8h0M7.2,22.9h0M20.1,21.2h0M24.4,10.1h0\"/>" +
      "<path stroke=\"#99F\" stroke-width=\"4.3\" d=\"m13.2,4.9h0M3.8,11.8h0M7.2,22.9h0M20.1,21.2h0M24.4,10.1h0\"/>" +
      "</g></svg>",
};
