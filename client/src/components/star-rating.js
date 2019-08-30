import { LitElement, html, css } from 'lit-element';
import 'mega-material/icon';

class StarRating extends LitElement {
    static get styles() {
      // language=CSS
        return [
            css`
:host {
  unicode-bidi: bidi-override;
  direction: rtl;
  text-align: center;
  cursor: pointer;
}
:host > mega-icon {
  display: inline-block;
  position: relative;
  width: 24px;
  transition: color 0.4s;
  color: var(--color-unrated);
}
:host > mega-icon:hover,
:host > mega-icon:hover ~ mega-icon {
  color: var(--color-rated);
}
:host(:not(:hover)) > mega-icon[filled],
:host(:not(:hover)) > mega-icon ~ mega-icon[filled]
{
  color: var(--color-rated);
}
mega-icon.cross {
    opacity: 0.1;
} 
:host(:hover) > mega-icon.cross {
    opacity: 1;
} 
mega-icon {
  pointer-events: all;
}
        `
        ];
    }

    render() {
        return html`
<mega-icon class="cross" @click="${this._clicked}" value="0">close</mega-icon>
<mega-icon ?filled="${this.rate >= 4}" @click="${this._clicked}" value="4">done</mega-icon><mega-icon ?filled="${this.rate >= 3}" @click="${this._clicked}" value="3">done</mega-icon><mega-icon ?filled="${this.rate >= 2}" @click="${this._clicked}" value="2">done</mega-icon><mega-icon ?filled="${this.rate >= 1}" @click="${this._clicked}" value="1">done</mega-icon>
    `;
    }

    static get properties() { return {
        rate: { type: Number },
        color_rated: { type: String },
        color_unrated: { type: String },
    }}

    constructor() {
        super();
        this.color_rated = "gold";
        this.color_unrated = "gray";
        this.style.setProperty("--color-rated", this.color_rated);
        this.style.setProperty("--color-unrated", this.color_unrated);
    }

    updated(changedProperties) {
        if (changedProperties.has("color_rated"))
            this.style.setProperty("--color-rated", this.color_rated);
        if (changedProperties.has("color_unrated"))
            this.style.setProperty("--color-unrated", this.color_unrated);
    }

    _clicked(event) {
        let i = 0;
        while (event.path[i].tagName !== "MEGA-ICON" && i < event.path.length)
            i++;
        if (event.path[i].tagName === "MEGA-ICON") {
            this.rate = event.path[i].getAttribute("value");
            this.dispatchEvent(new CustomEvent('rated', {bubbles: true, detail: {rate: this.rate}}));
        }
    }
}

window.customElements.define('star-rating', StarRating);
