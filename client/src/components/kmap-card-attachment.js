/**
 @license
 Copyright (c) 2018 The Polymer Project Authors. All rights reserved.
 This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
 The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
 The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
 Code distributed by Google as part of the polymer project is also
 subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
 */

import {LitElement, html, css} from 'lit-element';
import {config} from '../config';
import 'mega-material/icon';

class KMapCardAttachment extends LitElement {
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
        `
        ];
    }

    render() {
        return html`
            <p>
                <mwc-icon>${this._mimeIcon}</mwc-icon>&nbsp;
                ${this._renderAttachment()}
            </p>
        `;
    }

    _renderAttachment() {
      if (this.attachment.type === "link")
        return html `
            <a href="${this.attachment.href}" target="_blank">${this.attachment.name}</a>
        `;
      else if (this._handler)
        return html `
            <a href="${this._handler}${this.attachment.href}" target="_blank">${this.attachment.name}&nbsp;<mwc-icon>open_in_new</mwc-icon></a>
            <a href="${config.server}${this.attachment.href}?client=${config.instance}" download="${this._isDownload}" target="${this._isTarget}"><mwc-icon>cloud_download</mwc-icon></a>
        `;
      else
        return html `
            <a href="${config.server}${this.attachment.href}?client=${config.instance}" ?download="${this._isDownload}" ?target="${this._isTarget}">${this.attachment.name}</a>
        `;

    }

    static get properties() {
        return {
            attachment: {type: Object},
            _fileServer: {type: String},
            _supportsDownload: {type: Boolean},
            _handler: {type: String},
            _mimeIcon: {type: String},
            _isDownload: {type: String},
            _isTarget: {type: String},
        }
    }

    firstUpdated() {
        this._supportsDownload = !(/iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream);
    }

    updated(changedProperties) {
        if (changedProperties.has("attachment")) {
            let attachment = this.attachment;
            this._handler = attachment.type === "application/vnd.geogebra.file" ? "geogebra.html?path=" + config.server : "";
            this._mimeIcon = this.mimeIcon(attachment.type);
            this._isDownload = attachment.type !== "link" && attachment.type !== "text/html" && this._supportsDownload ? attachment.name : null;
            this._isTarget = attachment.type === "link" || attachment.type === "text/html" || !this._supportsDownload ? "_blank" : null;
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

    mimeSrc(mimeType) {
        if (!this.mimeIcon(mimeType))
            return "icons/" + mimeType + ".png";
    }
}

window.customElements.define('kmap-card-attachment', KMapCardAttachment);

const fileIcons  = {
    "application/octet-stream": "scatter_plot",
    "application/pdf": "description",
};
