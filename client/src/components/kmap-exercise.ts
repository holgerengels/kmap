import {css, html, PropertyValues} from 'lit';
import {customElement, state, query} from 'lit/decorators.js';
import {Connected, store} from "./connected";
import {State} from "../store";

import '@material/mwc-button';
import '@material/mwc-icon';
import '@material/mwc-icon-button';
import '@material/mwc-formfield';
import '@material/mwc-slider';
import '@material/mwc-top-app-bar';
import './kmap-exercise-card';
import {resetStyles, colorStyles, fontStyles} from "./kmap-styles";
import {Test} from "../models/tests";
import {encodePath} from "../urls";
import {KMapExerciseCard} from "./kmap-exercise-card";

@customElement('kmap-exercise')
export class KMapExercise extends Connected {
  @state()
  private _test?: Test;

  @query('kmap-exercise-card')
  private _testElement: KMapExerciseCard;

  mapState(state: State) {
    return {
      _test: state.exercises.test,
    };
  }

  protected updated(_changedProperties: PropertyValues) {
    if (_changedProperties.has("_test") && this._test)
      setTimeout(() => {
        this._testElement!.init();
      }
      , 500)
  }

  _more() {
    if (this._test === undefined) return;

    store.dispatch.routing.push("/app/" + encodePath("test", this._test.subject, this._test.chapter, this._test.topic));
  }

  static get styles() {
    // language=CSS
    return [
      resetStyles,
      fontStyles,
      colorStyles,
      css`
        :host {
          display: contents;
        }
        div.buttons {
          padding: 8px 16px;
          display: flex;
          flex-direction: row;
          justify-content: space-between;
          max-width: 800px;
        }
        kmap-exercise-card {
          margin: 16px;
        }
        [hidden] {
          display: none;
        }
      `];
  }

  render() {
    // language=HTML
    return html`
      ${this._test ? html`
        <kmap-exercise-card
          .subject="${this._test.subject}"
          .set="${this._test.set}"
          .chapter="${this._test.chapter}"
          .topic="${this._test.topic}"
          .key="${this._test.key}"
          .repetitions="${this._test.repetitions}"
          .extern="${this._test.extern}"
          .level="${this._test.level}"
          .question="${this._test.question}"
          .answer="${this._test.answer}"
          .values="${this._test.values}"
          .balance="${this._test.balance}"
        "></kmap-exercise-card>
      ` : ''}

      <div class="buttons">
        <!--div style="flex: 1 0 auto"></div-->
        <mwc-button @click="${this._more}">Ähnliche Aufgaben</mwc-button>
      </div>

    `;
  }
}
