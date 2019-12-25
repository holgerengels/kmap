import {css, html, LitElement} from 'lit-element';
import { connect } from '@captaincodeman/rdx';
import {store} from "../store";
import {colorStyles, fontStyles} from "./kmap-styles";
import './kmap-set-selector';

class KMapTestEditor extends connect(store, LitElement) {

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
        <kmap-set-selector></kmap-set-selector>
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

window.customElements.define('kmap-test-editor', KMapTestEditor);
