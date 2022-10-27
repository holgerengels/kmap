import {LitElement, html, css, PropertyValues} from 'lit';
import {customElement, property, query, state, eventOptions} from 'lit/decorators.js';

import '@material/mwc-icon';
import '@material/mwc-ripple/mwc-ripple';
import {Ripple} from '@material/mwc-ripple/mwc-ripple';
import {RippleHandlers} from '@material/mwc-ripple/ripple-handlers';
import {fontStyles, colorStyles, elevationStyles} from "./kmap-styles";
import {StyleInfo, styleMap} from 'lit/directives/style-map.js';
import {unsafeHTML} from "lit/directives/unsafe-html.js";

@customElement('kmap-card')
export class KMapCard extends LitElement {
  @property({type: String})
  private header?: string = undefined;
  @property({type: String})
  private subHeader?: string = undefined;
  @property()
  private primaryLink?: string = undefined;
  @property()
  private primaryLinkTitle?: string = undefined;

  // @ts-ignore
  private _inside: boolean = false;
  @property({reflect: true, type: Boolean})
  // @ts-ignore
  private hover: boolean = false;
  @query('#ripple')
  private _ripple: Ripple;
  private _rippleHandlers: RippleHandlers;

  private _teaserElements: Element[] = [];
  private _primaryElements: Element[] = [];
  private _secondaryElements: Element[] = [];
  private _buttonElements: Element[] = [];
  private _iconElements: Element[] = [];

  @state()
  private _primaryStyles: StyleInfo = { padding: "0" };
  @state()
  private _secondaryStyles: StyleInfo = { padding: "0" };
  @state()
  private _actionStyles: StyleInfo = { padding: "0" };

  protected firstUpdated(_changedProperties: PropertyValues) {
    this._rippleHandlers = new RippleHandlers(async () => this._ripple);
  }

  protected updated(_changedProperties: PropertyValues) {
    if (_changedProperties.has("hover") && _changedProperties.get("hover") !== undefined) {
      this.dispatchEvent(new CustomEvent('hover', {bubbles: true, composed: true, detail: {hover: this.hover}}));
    }
  }

  _slotChange(e) {
    switch (e.target.name) {
      case "teaser":
        this._teaserElements = (e.target as HTMLSlotElement).assignedElements({flatten: true});
        break;
      case "primary":
        this._primaryElements = (e.target as HTMLSlotElement).assignedElements({flatten: true});
        break;
      case "button":
        this._buttonElements = (e.target as HTMLSlotElement).assignedElements({flatten: true});
        break;
      case "icon":
        this._iconElements = (e.target as HTMLSlotElement).assignedElements({flatten: true});
        break;
      default:
        this._secondaryElements = (e.target as HTMLSlotElement).assignedElements({flatten: true});
        break;
    }
    const hasPrimary = this._primaryElements.length !== 0 || this.header !== undefined || this.subHeader !== undefined;
    const hasSecondary = this._secondaryElements.length !== 0;
    const hasActions = (this._buttonElements.length + this._iconElements.length) !== 0;
    this._primaryStyles = { paddingTop: hasPrimary ? "16px" : "0", paddingBottom: hasPrimary && !hasSecondary && !hasActions ? "16px" : "0" };
    this._secondaryStyles = { paddingTop: !hasPrimary && hasSecondary ? "16px" : "0", paddingBottom: !hasActions && hasSecondary ? "16px" : "0" };
    this._actionStyles = { minHeight: hasActions ? "52px" : "0", padding: hasActions ? "8px" : "0" };
  }

  _mouseenter() {
    this._inside = true;
    setTimeout((that) => {
      if (that._inside)
        this.hover = true;
    }, 500, this);
  }
  _mouseleave() {
    this._inside = false;
    this.hover = false;
  }
  _mousedown(e) {
    const onMouseUp = () => {
      window.removeEventListener('mouseup', onMouseUp);
      this._rippleHandlers.endPress();
    };

    window.addEventListener('mouseup', onMouseUp);
    this._rippleHandlers.startPress(e);
  }

  @eventOptions({passive: true})
  _touchstart(e) {
    //e.preventDefault();
    const onTouchEnd = () => {
      window.removeEventListener('touchend', onTouchEnd);
      this._rippleHandlers.endPress();
    };

    window.addEventListener('touchend', onTouchEnd);
    this._rippleHandlers.startPress(e);
  }

  static get styles() {
    // language=CSS
    return [
      fontStyles,
      colorStyles,
      elevationStyles,
      css`
        :host {
          position: relative;
          display: flex;
          flex-direction: column;
          border-radius: 4px;
          background-color: var(--mdc-theme-surface, #fff);
          box-shadow: 0px 2px 1px -1px rgba(0, 0, 0, 0.2), 0px 1px 1px 0px rgba(0, 0, 0, 0.14), 0px 1px 3px 0px rgba(0,0,0,.12);
          transition: background-color 280ms cubic-bezier(0.4, 0, 0.2, 1), border-color 280ms cubic-bezier(0.4, 0, 0.2, 1), opacity 280ms cubic-bezier(0.4, 0, 0.2, 1), box-shadow 280ms cubic-bezier(0.4, 0, 0.2, 1);
        }
        :host([hover]) {
          box-shadow: 0px 5px 5px -3px rgba(0, 0, 0, 0.2),0px 8px 10px 1px rgba(0, 0, 0, 0.14),0px 3px 14px 2px rgba(0, 0, 0, 0.12);
        }
        a.primary {
          text-decoration: none;
          color: var(--color-darkgray);
        }
        .primary {
          position: relative;
          cursor: pointer;
        }
        .primary, .secondary {
          display: flex;
          flex-direction: column;
        }
        div.teaser {
          position: absolute; top: 16px; right: 16px;
          z-index: 2;
          --foreground: rgba(0, 0, 0, 0.2);
          align-items: center;
        }
        .actions {
          position: relative;
          display: flex;
          flex-direction: row;
          align-items: center;
          justify-content: space-between;
          box-sizing: border-box;
          padding: 8px;
        }
        .buttons {
          display: flex;
          flex-direction: row;
          flex-wrap: wrap;
          align-items: center;
          justify-content: flex-start;
        }
        .icons {
          display: flex;
          flex-direction: row;
          align-self: end;
          align-items: center;
          justify-content: flex-end;
          --mdc-icon-button-size: 32px;
        }
        [hidden] {
          display: none;
        }
      `];
  }

  render() {
    // language=HTML
    return html`
      <mwc-ripple id="ripple"></mwc-ripple>
      ${this._renderTeaser()}
      ${this._renderPrimary()}
      ${this._renderSecondary()}
      ${this._renderActions()}
      <slot name="plane">
    `;
  }
  _renderTeaser() {
    return this._teaserElements.length !== 0 ? html`
      <div class="teaser"><slot name="teaser" @slotchange=${this._slotChange}></slot></div>
    ` : html`<slot name="teaser" @slotchange=${this._slotChange}></slot>`;
  }
  _renderPrimary() {
    return this.primaryLink === undefined ? html`
      <div class="primary" style="${styleMap(this._primaryStyles)}" @mouseenter="${this._mouseenter}" @mouseleave="${this._mouseleave}" @mousedown="${this._mousedown}" @touchstart="${this._touchstart}">
        ${this.header ? html`<kmap-card-text type="header">${unsafeHTML(this.header)}</kmap-card-text>` : ''}
        ${this.subHeader ? html`<kmap-card-text type="subheader">${unsafeHTML(this.subHeader)}</kmap-card-text>` : ''}
        <slot name="primary"></slot>
      </div>
    ` : html`
      <a href="${this.primaryLink}" style="${styleMap(this._primaryStyles)}" title="${this.primaryLinkTitle}" class="primary" @mouseenter="${this._mouseenter}" @mouseleave="${this._mouseleave}" @mousedown="${this._mousedown}" @touchstart="${this._touchstart}">
        ${this.header ? html`<kmap-card-text type="header">${unsafeHTML(this.header)}</kmap-card-text>` : ''}
        ${this.subHeader ? html`<kmap-card-text type="subheader">${unsafeHTML(this.subHeader)}</kmap-card-text>` : ''}
        <slot name="primary"></slot>
        <mwc-ripple id="ripple"></mwc-ripple>
      </a>
    `;
  }
  _renderSecondary() {
    return html`
      <div class="secondary" style="${styleMap(this._secondaryStyles)}">
        <slot @slotchange=${this._slotChange}></slot>
      </div>
      ${this._secondaryElements.length === 7 ? html`<kmap-card-spacer></kmap-card-spacer>` : ''}
    `;
  }
  _renderActions() {
    return html`
      <div class="actions" style="${styleMap(this._actionStyles)}">
        <div class="buttons"><slot name="button" @slotchange=${this._slotChange}></slot></div>
        <div class="icons"><slot name="icon" @slotchange=${this._slotChange}></slot></div>
      </div>
    `;
  }
}

@customElement('kmap-card-text')
export class KMapCardText extends LitElement {
  @property({ type: String, reflect: true })
  private type: "header" | "subheader" | "content" = "content";

  static get styles() {
    // language=CSS
    return css`
        :host {
          font-family: Roboto, sans-serif;
          text-decoration: inherit;
          text-transform: inherit;
          padding-left: 16px;
          padding-right: 16px;
        }
        div[type=header] {
          font-size: 1.0rem;
          line-height: 1.5rem;
          font-weight: 500;
          letter-spacing: .0125em;
        }
        div[type=subheader], div[type=content] {
          font-size: .875rem;
          line-height: 1.25rem;
          font-weight: 400;
          letter-spacing: .0178571429em;
          color: var(--color-darkgray);
        }
      `;
  }

  render() {
    // language=HTML
    return html`
       <div type="${this.type}"><slot></slot></div>
    `;
  }
}

@customElement('kmap-card-divider')
export class KMapCardDivider extends LitElement {

  static get styles() {
    // language=CSS
    return [
      css`
        hr {
          width: calc(100% - 32px);
          margin-top: 16px;
          margin-bottom: 16px;
          border: none;
          background-color: lightgrey;
          height: 1px;
        }
      `];
  }

  render() {
    // language=HTML
    return html`
       <hr/>
    `;
  }
}

@customElement('kmap-card-spacer')
export class KMapCardSpacer extends LitElement {

  static get styles() {
    // language=CSS
    return css`
        :host {
          display: block;
          height: 8px;
        }
      `;
  }

  render() {
    // language=HTML
    return html``;
  }
}

@customElement('kmap-card-element')
export class KMapCardElement extends LitElement {

  render() {
    // language=HTML
    return html`<slot></slot>`;
  }
}

@customElement('kmap-card-actions')
export class KMapCardActions extends LitElement {

  static get styles() {
    // language=CSS
    return css`
        :host {
          display: flex;
          flex-direction: row;
          align-items: center;
          justify-content: space-between;
          box-sizing: border-box;
          min-height: 52px;
          padding: 8px;
        }
        .buttons {
          display: flex;
          flex-direction: row;
          align-items: center;
          justify-content: flex-start;
        }
        .icons {
          display: flex;
          flex-direction: row;
          align-items: center;
          justify-content: flex-end;
        }
      `;
  }

  render() {
    // language=HTML
    return html`
      <div class="buttons"><slot name="button"></slot></div>
      <div class="icons"><slot name="icon"></slot></div>
      <slot name="fullbleed"></slot>
    `;
  }
}

/*
<style>
.marker {
    position: absolute;
    width: 100%;
    height: 8px;
    background-color: lightgreen;
    z-index: 10;
}
.top {
    top: 0;
    border-top-left-radius: 4px;
    border-top-right-radius: 4px;
}
.bottom {
    bottom: 0;
    border-bottom-left-radius: 4px;
    border-bottom-right-radius: 4px;
}
</style>
 */
