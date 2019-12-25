import {LitElement, html, css} from 'lit-element';
import { connect } from '@captaincodeman/rdx';
import {store} from "../store";
import 'mega-material/list';
import {loadModules, forgetModules, selectModule} from "../actions/content-maps";
import {fontStyles, colorStyles} from "./kmap-styles";

class KMapModuleSelector extends connect(store, LitElement) {

    static get styles() {
      // language=CSS
        return [
          fontStyles,
          colorStyles,
          css``];
    }

  render() {
    return html`
<mega-list dense>
  ${this._modules.map((module, i) => html`
    <mega-list-item dense ?activated="${this._selectedIndex === i}" @click="${e => this._select(i)}">
      ${module.subject} - ${module.module}</mega-list-item>
  `)}
</mega-list>
    `;
    }

  static get properties() {
    return {
      _userid: {type: String},
      _modules: {type: Array},
      _selectedIndex: {type: Number},
    };
  }

  constructor() {
    super();
    this._modules = [];
    this._selectedIndex = -1;
  }

  _select(index) {
    if (this._selectedIndex === index)
      this._selectedIndex = -1;
    else
      this._selectedIndex = index;

    store.dispatch(selectModule(this._selectedIndex !== -1 ? this._modules[this._selectedIndex] : null));
  }

  stateChanged(state) {
    if (this._userid !== state.app.userid) {
      this._userid = state.app.userid;
      if (this._userid)
        store.dispatch(loadModules());
      else
        store.dispatch(forgetModules())
    }
    this._modules = state.contentMaps.modules;
  }

  updated(changedProperties) {
  }
}

window.customElements.define('kmap-module-selector', KMapModuleSelector);
