import {html, css, customElement, property} from 'lit-element';
import {Connected} from "./connected";
import {State, store} from "../store";

import {colorStyles, fontStyles, elevationStyles,} from "./kmap-styles";

import '@material/mwc-icon';
import '@material/mwc-icon-button';
import '@material/mwc-list/mwc-list';
import '@material/mwc-list/mwc-list-item';
import '@material/mwc-select';
import '@material/mwc-textfield';
import {Feedback} from "../models/feedback";

@customElement('kmap-content-manager-feedback')
export class KMapContentManagerFeedback extends Connected {
  @property()
  private _issues: Feedback[] = [];
  @property()
  private _page: string = '';
  @property()
  private _selectedIndex: number = -1;
  @property()
  private _selected?: Feedback = undefined;

  mapState(state: State) {
    return {
      _issues: state.feedback.issues || [],
    };
  }

  updated(changedProperties) {
    if (changedProperties.has('_selectedIndex'))
      this._selected = this._issues[this._selectedIndex];
  }

  _select(index) {
    if (this._selectedIndex === -1)
      this._selectedIndex = index;
    else if (this._selectedIndex === index)
      this._selectedIndex = -1;
    else
      this._selectedIndex = index;
  }

  _showPage(page) {
    this._page = page;
  }

  _resolve() {
    if (this._selected === undefined)
      return;

    console.log("resolve issue");
    store.dispatch.feedback.resolve(this._selected);
  }

  static get styles() {
    // language=CSS
    return [
      fontStyles,
      colorStyles,
      elevationStyles,
      css`
        :host {
          display: contents;
        }
        div.main {
          width: 700px;
          margin: 8px;
          display: flex;
        }
        .form {
          margin: 12px;
          flex: 0 1 50%;
          align-items: stretch;
        }
        .scroll {
          height: 232px;
          width: 326px;
          overflow-x: hidden;
          overflow-y: auto;
        }
        mwc-icon {
          pointer-events: all;
          cursor: default;
        }
        [disabled], [disabled] svg {
          color: gray;
          fill: gray;
          pointer-events: none;
        }
        .page {
          display: none;
          opacity: 0.0;
          transition: opacity .8s;
        }
        .page[active] {
          display: block;
          opacity: 1.0;
        }
        .page > * {
          display: flex;
          justify-content: space-between;
          margin: 8px;
        }
        `];
  }

  render() {
    return html`
      <div class="main elevation-02">
        <div class="form">
          <label>Feedback</label>
          <span style="float: right">
          <mwc-icon @click="${() => this._showPage('resolve')}" ?disabled="${this._selectedIndex === -1}">check</mwc-icon>
          </span>
          <br style="clear: right"/>
          <div class="scroll">
          <mwc-list>
            ${this._issues.map((issue, i) => html`
              ${issue.type === 'bug' ? html`
                <mwc-list-item ?activated="${this._selectedIndex === i}" @click="${() => this._select(i)}" graphic="icon" twoline>
                  <span>${issue.title} ${issue.userid ? " (" + issue.userid + ")" : ''}</span>
                  <span slot="secondary"><span style="display: inline-block; overflow: hidden; max-width: 230px; text-overflow: ellipsis">${issue.text.substr(0, 20)} …</span></span>
                  <mwc-icon slot="graphic">error</mwc-icon>
                </mwc-list-item>
              ` : html`
                <mwc-list-item ?activated="${this._selectedIndex === i}" @click="${() => this._select(i)}" graphic="icon" twoline>
                  <span>${issue.title} ${issue.userid ? " (" + issue.userid + ")" : ''}</span>
                  <span slot="secondary"><span style="display: inline-block; overflow: hidden; max-width: 230px; text-overflow: ellipsis">${issue.subject + " " + issue.chapter + " " + issue.topic}</span></span>
                  <mwc-icon slot="graphic">${issue.type === 'error' ? 'error_outline' : 'add_circle_outline'}</mwc-icon>
                </mwc-list-item>
              `}
            `)}
          </mwc-list>
          </div>
        </div>
        <div class="form">
          <div class="page" ?active="${this._page === 'resolve'}">
            <label>Feedback bearbeiten</label>
            ${this._selected !== undefined ? html`
              ${this._selected.type !== 'bug' ? html`
                <p>${this._selected.topic !== undefined ? this._selected.subject + " → " + this._selected.chapter + " → " + this._selected.topic : this._selected.subject + " → " + this._selected.chapter}
                ${this._selected.test ? " → " + this._selected.test : ''}
                </p>
              ` : ''}
              <label secondary>${this._selected.title} ${this._selected.userid ? " (" + this._selected.userid + ")" : ''}</label>
              <div style="max-height: 100px; max-width: 300px; overflow-y: auto">
                <label class="font-body">${this._selected.text}</label>
              </div>
              <div>
                <mwc-button @click="${() => this._showPage('')}">Abbrechen</mwc-button>
                <mwc-button outlined @click="${this._resolve}">Bearbeitet</mwc-button>
              </div>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  }
}
