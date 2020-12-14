import {LitElement, html, customElement, property, css} from 'lit-element';
import {connect} from '@captaincodeman/rdx';
import {State, store} from "../store";

import '@material/mwc-list/mwc-list';
import '@material/mwc-list/mwc-list-item';
import {fontStyles, colorStyles} from "./kmap-styles";
import {Set} from "../models/contentSets";

@customElement('kmap-set-selector')
export class KMapSetSelector extends connect(store, LitElement) {
  @property()
  private _sets: Set[] = [];
  @property()
  private _selectedIndex: number = -1;
  @property()
  private _selectedSet?: Set = undefined;

  mapState(state: State) {
    return {
      _sets: state.contentSets.sets,
      _selectedSet: state.contentSets.set,
    };
  }

  updated(changedProperties) {
    if (changedProperties.has("_selectedSet")) {
      if (this._selectedSet && (this._selectedIndex === -1 || this._selectedSet.set != this._sets[this._selectedIndex].set))
        this._selectedIndex = this._sets.indexOf(this._selectedSet);
    }
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
          ${this._sets.map((set, i) => html`
            <mwc-list-item ?activated="${this._selectedIndex === i}" @click="${() => this._select(i)}" title="${set.subject} - ${set.set}">
              <span>${set.subject} - ${set.set}</span>
            </mwc-list-item>
          `)}
        </mwc-list>
    `;
  }
}
