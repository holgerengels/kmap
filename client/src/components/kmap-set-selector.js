import {LitElement, html, css} from 'lit-element';
import { connect } from '@captaincodeman/rdx';
import {store} from "../store";
import 'mega-material/list';
import {loadSets, forgetSets, selectSet} from "../actions/content-sets";
import {fontStyles, colorStyles} from "./kmap-styles";

class KMapSetSelector extends connect(store, LitElement) {

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
  ${this._sets.map((set, i) => html`
    <mega-list-item dense ?activated="${this._selectedIndex === i}" @click="${e => this._select(i)}">
      ${set.subject} - ${set.set}</mega-list-item>
  `)}
</mega-list>
    `;
    }

  static get properties() {
    return {
      _userid: {type: String},
      _sets: {type: Array},
      _selectedIndex: {type: Number},
    };
  }

  constructor() {
    super();
    this._sets = [];
    this._selectedIndex = -1;
  }

  _select(index) {
    if (this._selectedIndex === index)
      this._selectedIndex = -1;
    else
      this._selectedIndex = index;

    store.dispatch(selectSet(this._selectedIndex !== -1 ? this._sets[this._selectedIndex] : ''));
  }

  stateChanged(state) {
    if (this._userid !== state.app.userid) {
      this._userid = state.app.userid;
      if (this._userid)
        store.dispatch(loadSets());
      else
        store.dispatch(forgetSets())
    }
    this._sets = state.contentSets.sets;
  }

  updated(changedProperties) {
  }
}

window.customElements.define('kmap-set-selector', KMapSetSelector);
