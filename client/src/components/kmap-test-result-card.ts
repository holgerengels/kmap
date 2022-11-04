import {html, css} from 'lit';
import {customElement, property, state} from 'lit/decorators.js';
import {Connected} from "./connected";
import {State} from "../store";


import {StyleInfo, styleMap} from 'lit/directives/style-map.js';
import '@material/mwc-icon';
import './star-rating';
import {resetStyles, colorStyles, fontStyles} from "./kmap-styles";
import {TestResult} from "../models/tests";
import {encodePath} from "../urls";

@customElement('kmap-test-result-card')
export class KMapTestResultCard extends Connected {
  @state()
  private _userid: string = '';

  @property()
  private card?: TestResult = undefined;
  @state()
  private _states: object = {};
  @property({type: Number})
  private state: number = 0;
  @state()
  private _state: number = 0;
  @state()
  private _rateModified: boolean = false;

  @state()
  private _colorStyles: StyleInfo = { backgroundColor: "white" };

  constructor() {
    super();
    this._colorize(0);
  }

  mapState(state: State) {
    return {
      _userid: state.app.userid,
      _states: state.rates.rates,
    };
  }

  updated(changedProperties) {
    if (changedProperties.has("_states"))
      this._rating();

    if (changedProperties.has("state"))
      this._state = this.state;

    if (changedProperties.has("_state"))
      this._colorize(this._state);
  }

  _rating() {
    if (this.card === undefined) return;

    if (this._rateModified && this._states && Object.keys(this._states).length !== 0) {
      let key = this.card.chapter + "." + this.card.topic;
      this._state = this._getStateValue(key);
    }
    else {
      this._state = 0;
    }
  }

  _getStateValue(key) {
    let value = this._states[key];
    return value !== undefined ? value : 0;
  }

  _colorize(rate) {
    this._colorStyles = {
      backgroundColor: rate !== 0 ? "hsl(" + 120 * (rate - 1) / 4 + ", 100%, 90%)" : "white",
    };
  }

  _rated(e) {
    if (this.card === undefined) return;

    if (this._userid)
      this._rateModified = true;

    let key = this.card.chapter + "." + this.card.topic;
    this.dispatchEvent(new CustomEvent('rated', { bubbles: true, composed: true, detail: {subject: this.card.subject, key: key, rate: e.detail.rate}}));
  }

  static get styles() {
    // language=CSS
    return [
      resetStyles,
      fontStyles,
      colorStyles,
      css`
        kmap-card {
          width: 300px;
          background-color: white;
          transition: background-color 280ms cubic-bezier(0.4, 0, 0.2, 1), opacity 280ms cubic-bezier(0.4, 0, 0.2, 1);
        }
        .content {
          padding: 16px 16px 8px 16px;
        }
        .content mwc-icon {
          vertical-align: sub;
          padding-left: 16px;
          padding-right: 16px;
        }
        .correct {
          color: var(--color-green);
        }
        .wrong {
          color: var(--color-red);
        }
      `];
  }

  render() {
    return this.card !== undefined ? html`
      <kmap-card header="${this.card.chapter} → ${this.card.topic}"
            primaryLink="/app/browser/${encodePath(this.card.subject, this.card.chapter, this.card.topic)}"
            primaryLinkTitle="${'Wissenskarte ' + this.card.topic}"
            style=${styleMap(this._colorStyles)}>
        <div class="content">
          <mwc-icon class="correct">thumb_up</mwc-icon> ${this.card.correct} richtig<br/><br/>
          <mwc-icon class="wrong">thumb_down</mwc-icon> ${this.card.wrong} falsch<br/>
        </div>
       <star-rating slot="button" .rate="${this._state}" @clicked="${this._rated}" style="padding-left: 8px"></star-rating>
      </kmap-card>
    ` : '';
  }
}
