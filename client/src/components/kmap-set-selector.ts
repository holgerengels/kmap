import {LitElement, html, customElement, property} from 'lit-element';
import {connect} from '@captaincodeman/rdx';
import {State, store} from "../store";

import 'mega-material/list';
import {fontStyles, colorStyles} from "./kmap-styles";
import {Set} from "../models/contentSets";

@customElement('kmap-set-selector')
export class KMapSetSelector extends connect(store, LitElement) {
  @property()
  private _sets: Set[] = [];
  @property()
  private _selectedIndex: number = -1;

  // TODO load and forget modules on login and layer
  mapState(state: State) {
    return {
      _sets: state.contentSets.sets,
    };
  }

  _select(index) {
    if (this._selectedIndex === index)
      this._selectedIndex = -1;
    else
      this._selectedIndex = index;

    if (this._selectedIndex === -1)
      store.dispatch.contentSets.unselectSet();
    else
      store.dispatch.contentSets.selectSet(this._sets[this._selectedIndex]);
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
        <mega-list dense>
          ${this._sets.map((set, i) => html`
            <mega-list-item dense ?activated="${this._selectedIndex === i}" @click="${() => this._select(i)}">
              ${set.subject} - ${set.set}</mega-list-item>
          `)}
        </mega-list>
    `;
  }
}
