import {html, css} from 'lit';
import {customElement, state} from 'lit/decorators.js';
import {Connected} from "./connected";
import {State, store} from "../store";

import '@material/mwc-list/mwc-list';
import '@material/mwc-list/mwc-list-item';
import {fontStyles, colorStyles} from "./kmap-styles";
import {Module} from "../models/contentMaps";

@customElement('kmap-module-selector')
export class KMapModuleSelector extends Connected {
  @state()
  private _modules: Module[] = [];
  @state()
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
      colorStyles,
      css`
        mwc-list { --mdc-list-vertical-padding: 0px; }
      `
    ];
  }

  render() {
    // language=HTML
    return html`
        <mwc-list>
          ${this._modules.map((module, i) => html`
            <mwc-list-item ?activated="${this._selectedIndex === i}" @click="${() => this._select(i)}" title="${module.subject} - ${module.module}">
              <span>${module.subject} - ${module.module}</span>
            </mwc-list-item>
          `)}
        </mwc-list>
    `;
  }
}
