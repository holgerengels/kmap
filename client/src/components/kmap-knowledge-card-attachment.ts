import {css, customElement, html, LitElement, property} from 'lit-element';
import {urls} from '../urls';

import '@material/mwc-icon';
import {Attachment} from "../models/maps";

@customElement('kmap-knowledge-card-attachment')
export class KMapKnowledgeCardAttachment extends LitElement {
  @property({type: String})
  private instance: string = '';
  @property()
  private _supportsDownload: boolean = !(/iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream);
  @property({type: Object})
  private attachment?: Attachment;
  @property()
  private _handler: string = '';
  @property()
  private _mimeIcon: string = '';
  @property()
  private _isDownload?: string = undefined;
  @property()
  private _isTarget?: string = undefined;

  updated(changedProperties) {
    if (changedProperties.has("attachment") && this.attachment) {
      this._handler = this.attachment.mime === "application/vnd.geogebra.file" ? "/geogebra.html?path=" + urls.server : "";
      this._mimeIcon = this.mimeIcon(this.attachment.mime);
      this._isDownload = this.attachment.type === "file" && this.attachment.mime !== "text/html" && this._supportsDownload ? this.attachment.name : undefined;
      this._isTarget = this.attachment.type === "link" || this.attachment.mime === "text/html" || !this._supportsDownload ? "_blank" : undefined;
    }
  }

  mimeIcon(mimeType) {
    var icon = fileIcons[mimeType];
    if (icon)
      return icon;

    if (mimeType === "link")
      return "link";
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

  /*
  mimeSrc(mimeType) {
    if (!this.mimeIcon(mimeType))
      return "icons/" + mimeType + ".png";
  }
  */

  static get styles() {
    // language=CSS
    return [
      css`
            a {
                text-decoration: none;
                color: inherit
            }
            a:hover {
                text-decoration: underline;
            }
            p {
                margin-top: 16px;
                margin-bottom: 0px;
            }
            mwc-icon {
                font-size: 18px;
                vertical-align: middle;
            }
        `];
  }

  render() {
    return html`
            <p>
                <mwc-icon>${this._mimeIcon}</mwc-icon>&nbsp;
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
            <a href="${this.attachment.href}" target="_blank" rel="external noopener">${this.attachment.name}</a>
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
    "application/octet-stream": "scatter_plot",
    "application/pdf": "description",
};
