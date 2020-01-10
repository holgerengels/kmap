import {LitElement, html, css, customElement, property} from 'lit-element';
import '@material/mwc-icon';

@customElement('star-rating')
export class StarRating extends LitElement {

  @property()
  private rate: number = 0;

  _clicked(event) {
    this.rate = event.srcElement.getAttribute("value");
    this.dispatchEvent(new CustomEvent('clicked', {bubbles: true, composed: true, detail: {rate: this.rate}}));
  }

  static get styles() {
    // language=CSS
    return [
      css`
        :host {
          display: block;
          height: 24px;
          unicode-bidi: bidi-override;
          direction: rtl;
          text-align: center;
          cursor: pointer;
        }
        :host > mwc-icon {
          display: inline-block;
          position: relative;
          width: 24px;
          transition: color 0.4s;
          color: var(--color-unrated);
        }
        :host > mwc-icon:hover,
        :host > mwc-icon:hover ~ mwc-icon {
          color: var(--color-rated);
        }
        :host(:not(:hover)) > mwc-icon[filled],
        :host(:not(:hover)) > mwc-icon ~ mwc-icon[filled]
        {
          color: var(--color-rated);
        }
        mwc-icon.cross {
          opacity: 0.1;
        }
        :host(:hover) > mwc-icon.cross {
          opacity: 1;
        }
        mwc-icon {
          pointer-events: all;
        }
        `
    ];
  }

  render() {
    //language=HTML
    return html`
        <mwc-icon class="cross" @click="${this._clicked}" value="0">close</mwc-icon>
        <mwc-icon ?filled="${this.rate >= 4}" @click="${this._clicked}" value="4">done</mwc-icon><mwc-icon ?filled="${this.rate >= 3}" @click="${this._clicked}" value="3">done</mwc-icon><mwc-icon ?filled="${this.rate >= 2}" @click="${this._clicked}" value="2">done</mwc-icon><mwc-icon ?filled="${this.rate >= 1}" @click="${this._clicked}" value="1">done</mwc-icon>
    `;
  }
}
