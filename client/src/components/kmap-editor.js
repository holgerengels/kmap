import {css, html, LitElement} from 'lit-element';
import { connect } from '@captaincodeman/rdx';
import {store} from "../store";
import {colorStyles, fontStyles} from "./kmap-styles";
import './kmap-module-selector';

class KMapEditor extends connect(store, LitElement) {

  static get styles() {
    // language=CSS
    return [
      fontStyles,
      colorStyles,
      css`
        :host {
          display: contents;
        }`];
  }

  render() {
    return html`
        <kmap-module-selector></kmap-module-selector>
    `;
  }

  static get properties() {
    return {
    };
  }

  constructor() {
    super();
  }

  updated(changedProperties) {
  }

  stateChanged(state) {
  }
}

window.customElements.define('kmap-editor', KMapEditor);
