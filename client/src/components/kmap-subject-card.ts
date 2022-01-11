import {LitElement, html, css} from 'lit';
import {customElement, property, state} from 'lit/decorators.js';

import {Subject} from "../models/subjects";
import './kmap-card';
import {StyleInfo, styleMap} from 'lit/directives/style-map.js';

@customElement('kmap-subject-card')
export class KMapSubjectCard extends LitElement {

  @property()
  private subject?: Subject;
  @state()
  private _states: object = {};
  @state()
  private _hasStates: boolean = false;
  @property()
  // @ts-ignore
  private _state: number = 0;
  @state()
  private _progressNum: number = 0;
  @state()
  private _progressOf: number = 0;
  @property()
  // @ts-ignore
  private _progressPercent: number = 0;

  @property()
  // @ts-ignore
  private _colorStyles: StyleInfo = { backgroundColor: "white" };

  constructor() {
    super();
    this._colorize(0);
  }

  /*
  mapState(state: State) {
    return {
      //_states: state.rates.rates,
    };
  }
   */

  _colorize(rate) {
    this._colorStyles = {
      backgroundColor: rate !== 0 ? "hsl(" + 120 * (rate - 1) / 4 + ", 100%, 90%)" : "white",
    };
  }

  willUpdate(changedProperties) {
    if (changedProperties.has("_states") || changedProperties.has("subject")) {
      this._hasStates = this._states && Object.keys(this._states).length !== 0;

      if (this._hasStates && this.subject) {
        this._state = this._getStateValue(this.subject.name);
        this._progressNum = this._getStateValue(this.subject.name + "*");
        this._progressOf = this._getStateValue(this.subject.name + "#");
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
    return css`
      kmap-card {
        width: 300px;
      }
    `;
  }


  render() {
    return this.subject ? html`
      <kmap-card header="${this.subject.name}" subheader="${this.subject.count} Wissenskarten"
          primaryLink="/app/browser/${this.subject.name}/${this.subject.name}" primaryLinkTitle="Wissenslandkarte ${this.subject.name}"
          style=${styleMap(this._colorStyles)}>
      </kmap-card>
    ` : '';
  }
}
