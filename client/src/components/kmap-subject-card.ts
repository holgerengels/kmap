import {LitElement, html, css, customElement, property} from 'lit-element';

import '@material/mwc-icon';
import '@material/mwc-ripple';
import {STATE_COLORS} from './state-colors';
import {fontStyles, colorStyles, themeStyles} from "./kmap-styles";

@customElement('kmap-subject-card')
export class KMapSubjectCard extends LitElement {

  @property({type: String})
  private subject: string = '';
  @property()
  private _states: object = {};
  @property()
  private _hasStates: boolean = false;
  @property()
  // @ts-ignore
  private _state: number = 0;
  @property()
  private _progressNum: number = 0;
  @property()
  private _progressOf: number = 0;
  @property()
  // @ts-ignore
  private _progressPercent: number = 0;

  constructor() {
    super();
    this._colorize("0");
  }

  /*
  mapState(state: State) {
    return {
      //_states: state.rates.rates,
    };
  }
   */

  _colorize(rate) {
    let _opaque = STATE_COLORS[rate][0];
    let _light = STATE_COLORS[rate][1];
    let _lightest = STATE_COLORS[rate][2];
    this.style.setProperty('--color-opaque', _opaque);
    this.style.setProperty('--color-light', _light);
    this.style.setProperty('--color-lightest', _lightest);
  }

  updated(changedProperties) {
    if (changedProperties.has("_states") || changedProperties.has("subject")) {
      this._hasStates = this._states && Object.keys(this._states).length !== 0;

      if (this._hasStates) {
        this._state = this._getStateValue(this.subject);
        this._progressNum = this._getStateValue(this.subject + "*");
        this._progressOf = this._getStateValue(this.subject + "#");
        this._progressPercent = Math.round(100 * this._progressNum / this._progressOf);
      }
      else {
        this._state = 0;
        this._progressNum = 0;
        this._progressOf = 0;
        this._progressPercent = 0;
      }
    }

    //this.dispatchEvent(new CustomEvent('statecolor', { bubbles: true, composed: true, detail: {source: 'averages', key: this.key, state: this._state} }));
  }

  _getStateValue(key) {
    let value = this._states[key];
    return value !== undefined ? value : 0;
  }

  static get styles() {
    // language=CSS
    return [
      fontStyles,
      colorStyles,
      themeStyles,
      css`
        :host {
          display: block;
          --color-opaque: #f5f5f5;
          --color-light: var(--color-mediumgray);
          --color-lightest: #e0e0e0;
        }
        div.card {
          vertical-align: top;
          margin: 6px;
          margin-top: 0px;
          display: inline-block;
          box-sizing: border-box;
          width: 300px;
          border-radius: 4px;
          box-shadow: 0 2px 2px 0 rgba(0, 0, 0, 0.14),
          0 1px 5px 0 rgba(0, 0, 0, 0.12),
          0 4px 1px -2px rgba(0, 0, 0, 0.2);
          color: var(--color-darkgray);
        }
        .card-header, .card-footer {
          transition: background-color .5s ease-in-out;
          padding: 4px 8px;
          display: flex;
          flex-direction: row;
          justify-content: space-between;
        }
        .card-header {
          color: black;
          background-color: var(--color-opaque);
          border-top-left-radius: 4px;
          border-top-right-radius: 4px;
        }
        .card-footer {
          color: var(--color-darkgray);
          background-color: var(--color-light);
          border-bottom-left-radius: 4px;
          border-bottom-right-radius: 4px;
        }
        .card-header span, .card-footer span { align-self: center; }
        .card-header a, .card-footer a { height: 24px; color: black; display: block }
        .card-footer a { color: var(--color-darkgray); }
      `];
  }

  render() {
    return html`
<div class="card">
  <div class="card-header font-body">
    <span>${this.subject}</span>
    <div style="flex: 1 0 auto"></div>
    <a href="/app/browser/${this.subject}/${this.subject}" title="Wissenslandkarte"><mwc-ripple></mwc-ripple><mwc-icon style="--mdc-icon-size: 20px; margin:2px 0px">open_in_new</mwc-icon></a>
  </div>
  <div class="card-footer font-body">
      <div style="flex: 1 0 auto; height: 24px"></div>
  </div>
  </div>
    `;
  }
}
