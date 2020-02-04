import {LitElement, html, customElement, property} from 'lit-element';
import {connect} from '@captaincodeman/rdx';
import {State, store} from "../store";

import '@material/mwc-list/mwc-list';
import '@material/mwc-list/mwc-list-item';
import {fontStyles, colorStyles} from "./kmap-styles";
import {Module} from "../models/contentMaps";

@customElement('kmap-module-selector')
export class KMapModuleSelector extends connect(store, LitElement) {
  @property()
  private _modules: Module[] = [];
  @property()
  private _selectedIndex: number = -1;

  mapState(state: State) {
    return {
      _modules: state.contentMaps.modules,
    };
  }

  _select(index) {
    if (this._selectedIndex === index)
      this._selectedIndex = -1;
    else
      this._selectedIndex = index;

    if (this._selectedIndex === -1)
      store.dispatch.contentMaps.unselectModule();
    else
      store.dispatch.contentMaps.selectModule(this._modules[this._selectedIndex]);
  }

  static get styles() {
    // language=CSS
    return [
      fontStyles,
      colorStyles
    ];
  }

  render() {
    // language=HTML
    return html`
        <mwc-list>
          ${this._modules.map((module, i) => html`
            <mwc-list-item ?activated="${this._selectedIndex === i}" @click="${() => this._select(i)}">
              <span>${module.subject} - ${module.module}</span>
            </mwc-list-item>
          `)}
        </mwc-list>
    `;
  }
}
