import {LitElement, html, css} from 'lit-element';
import {connect} from "pwa-helpers/connect-mixin";
import {store} from "../store";
import {loadSet, forgetSet} from "../actions/test-editor";
import {fontStyles, colorStyles} from "./kmap-styles";
import 'mega-material/list';
import 'mega-material/surface';
import './kmap-test-card';

class KMapTestEditorScroller extends connect(store)(LitElement) {

    static get styles() {
      // language=CSS
        return [
          fontStyles,
          colorStyles,
          css`
              mwc-surface {
                  margin: 16px;
                  padding: 16px;
                  box-shadow: var(--elevation);
                  background-color: whitesmoke;
              }
            kmap-test-card {
                
            }
            .scroller {
                height: 128px;
                overflow-y: auto;
            }
          `];
    }

  render() {
    return html`
  <mwc-surface style="--elevation: var(--elevation-01)">
    <div class="scroller">
      <mwc-list dense>
          ${this._tests.map((test, i) => html`
            <mwc-list-item dense ?activated="${this._selectedIndex === i}" @click="${e => this._select(i)}">${test.key}</mwc-list-item>
          `)}
      </mwc-list>
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
  </mwc-surface>
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

  _select(index) {
    if (this._selectedIndex === index)
      this._selectedIndex = -1;
    else
      this._selectedIndex = index;

    if (this._selectedIndex !== -1)
      this._selected = this._tests[this._selectedIndex];
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

  updated(changedProperties) {
  }
}

window.customElements.define('kmap-test-editor-scroller', KMapTestEditorScroller);
