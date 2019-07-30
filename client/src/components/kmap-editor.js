import {css, html, LitElement} from 'lit-element';
import {connect} from "pwa-helpers/connect-mixin";
import {store} from "../store";
import {colorStyles, fontStyles} from "./kmap-styles";
import './kmap-module-selector';

class KMapEditor extends connect(store)(LitElement) {

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
      _modules: {type: Array},
      _module: {type: String},
    };
  }

  constructor() {
    super();
    this._modules = [];
    this._module = '';
  }

  updated(changedProperties) {
  }

  stateChanged(state) {
    this._modules = state.contentMaps.modules;
  }
}

window.customElements.define('kmap-editor', KMapEditor);
