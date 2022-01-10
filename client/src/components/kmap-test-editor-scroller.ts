import {html, css} from 'lit';
import {customElement, state} from 'lit/decorators.js';
import {Connected} from "./connected";
import {State, store} from "../store";

import {fontStyles, colorStyles, elevationStyles} from "./kmap-styles";
import './kmap-test-card';
import {Test} from "../models/tests";


@customElement('kmap-test-editor-scroller')
export class KMapTestEditorScroller extends Connected {
  @state()
  private _tests: Test[] = [];
  @state()
  private _selectedIndex: number = -1;
  @state()
  private _selected?: Test = undefined;

  mapState(state: State) {
    return {
      _tests: state.contentSets.tests,
    };
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
    store.dispatch.tests.setTestForDelete(test);
  }

  _renameTest(test) {
    console.log("rename " + test.key);
    store.dispatch.tests.setTestForRename(test);
  }

  _editTest(test) {
    console.log("edit " + test.key);
    store.dispatch.tests.setTestForEdit(test);
  }

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
        .scroller {
          height: 238px;
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
    ${this._tests ? html`<div class="scroller">
          ${this._tests.map((test, i) => html`
            <div class="item font-body" ?activated="${this._selectedIndex === i}" @click="${() => this._select(i)}">${test.key}
                <span class="secondary">${test.chapter} - ${test.topic}</span>
                <mwc-icon @click="${e => { e.stopPropagation(); this._deleteTest(test)}}">delete</mwc-icon>
                <mwc-icon @click="${e => { e.stopPropagation(); this._renameTest(test)}}">label</mwc-icon>
                <mwc-icon @click="${e => { e.stopPropagation(); this._editTest(test)}}">edit</mwc-icon>
            </div>
          `)}
    </div>` : ''}
    <div style="margin: 32px">
    ${this._selected ? html`<kmap-test-card hideActions
                                .subject="${this._selected.subject}"
                                .set="${this._selected.set}"
                                .key="${this._selected.key}"
                                .chapter="${this._selected.chapter}"
                                .topic="${this._selected.topic}"
                                .level="${this._selected.level}"
                                .balance="${this._selected.balance}"
                                .question="${this._selected.question}"
                                .answer="${this._selected.answer}"
                                .hint="${this._selected.hint}"
                                .solution="${this._selected.solution}"
                                .num="1" .of="1"></kmap-test-card>` : ''}
    </div>
  </div>
    `;
  }
}
