import {LitElement, html, css} from 'lit-element';
import { connect } from '@captaincodeman/rdx';
import {store} from "../store";
import {loadSet, forgetSet} from "../actions/test-editor";
import {setTestForDelete, setTestForEdit} from "../actions/app";
import {fontStyles, colorStyles, elevationStyles} from "./kmap-styles";
import 'mega-material/surface';
import './kmap-test-card';

class KMapTestEditorScroller extends connect(store, LitElement) {

    static get styles() {
      // language=CSS
        return [
          fontStyles,
          colorStyles,
          elevationStyles,
          css`
            .box {
              overflow: auto;
              margin: 8px;
              padding: 16px;
              background-color: whitesmoke;
            }
            kmap-test-card {
            }
            .scroller {
              height: 102px;
              overflow-y: auto;
            }
            .item {
              padding: 8px;
            }
            .item[activated] {
              color: var(--color-primary-dark);
              background-color: var(--color-primary-lighter);
            }
            .item mwc-icon {
              pointer-events: all;
              cursor: pointer;
              vertical-align: middle;
              float: right;
            }
          `];
    }

  render() {
    return html`
  <div class="box elevation-01">
    <div class="scroller">
          ${this._tests.map((test, i) => html`
            <div class="item" ?activated="${this._selectedIndex === i}" @click="${e => this._select(i)}">${test.key}
                <span class="secondary">${test.chapter} - ${test.topic}</span>
                <mwc-icon @click="${e => { e.stopPropagation(); this._deleteTest(test)}}">delete</mwc-icon>
                <mwc-icon @click="${e => { e.stopPropagation(); this._editTest(test)}}">edit</mwc-icon>
            </div>
          `)}
    </div>
    <div style="margin: 32px">
    ${this._selected ? html`<kmap-test-card
                                .subject="${this._selected.subject}"
                                .chapter="${this._selected.chapter}"
                                .topic="${this._selected.topic}"
                                .level="${this._selected.level}"
                                .balance="${this._selected.balance}"
                                .question="${this._selected.question}"
                                .answer="${this._selected.answer}"
                                .num="1" .of="1"></kmap-test-card>` : ''}
    </div>
  </div>
    `;
    }

  static get properties() {
    return {
      _userid: {type: String},
      _set: {type: Object},
      _tests: {type: Array},
      _selectedIndex: {type: Number},
      _selected: {type: Object},
    };
  }

  constructor() {
    super();
    this._set = null;
    this._tests = [];
    this._selectedIndex = -1;
  }

  updated(changedProperties) {
  }

  stateChanged(state) {
    if (this._set !== state.contentSets.selectedSet) {
      this._set = state.contentSets.selectedSet;
      if (this._set)
        store.dispatch(loadSet(this._set.subject, this._set.set));
      else
        store.dispatch(forgetSet())
    }

    this._tests = state.testEditor.tests;
  }

  _select(index) {
    if (this._selectedIndex === index)
      this._selectedIndex = -1;
    else
      this._selectedIndex = index;

    if (this._selectedIndex !== -1)
      this._selected = this._tests[this._selectedIndex];
  }

  _deleteTest(test) {
    console.log("delete " + test.key);
    store.dispatch(setTestForDelete(test));
  }

  _editTest(test) {
    console.log("edit " + test.key);
    store.dispatch(setTestForEdit(test));
  }
}

window.customElements.define('kmap-test-editor-scroller', KMapTestEditorScroller);
