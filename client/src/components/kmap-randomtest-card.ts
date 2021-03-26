import {html, css, customElement, property, query} from 'lit-element';
import {Connected} from "./connected";
import {State} from "../store";

import {encodePath} from '../urls';
import {fontStyles, colorStyles} from "./kmap-styles";
import '@material/mwc-icon';
import '@material/mwc-button';
import "./kmap-card";
import "./kmap-test-card-content";
import "./kmap-test-card-hint";
import "./kmap-test-card-solution";
import "./kmap-feedback";
import {KMapTestCardContent} from "./kmap-test-card-content";

@customElement('kmap-randomtest-card')
export class KMapRandomTestCard extends Connected {
  @property({type: String})
  private _instance: string = '';

  @property({type: String})
  private key: string = '';
  @property({type: String})
  private subject: string = '';
  @property({type: String})
  private set: string = '';
  @property({type: String})
  private chapter: string = '';
  @property({type: String})
  private topic: string = '';
  @property({type: Number})
  private level: number = 0;
  @property({type: String})
  private question: string = '';
  @property({type: String})
  private answer: string = '';
  @property({type: Number})
  private balance: number = 4;
  @property()
  private last: boolean = false;

  @property({type: String})
  private values: string[] = [];

  @query('kmap-test-card-content')
  private _content: KMapTestCardContent;

  @query('#tests')
  private _tests: HTMLAnchorElement;

  mapState(state: State) {
    return {
      _instance: state.app.instance,
    };
  }

  _levelText(level: number) {
    switch (level) {
      case 1:
        return "leicht";
      case 2:
        return "mittel";
      case 3:
        return "schwer";
      default:
        return "...";
    }
  }

  _sendAnswer() {
    this._content.checkValues();
  }

  _showAnswer() {
    this._content.showAnswer();
  }

  _next() {
    this.dispatchEvent(new CustomEvent('next', {bubbles: true, composed: true}));
  }

  _more() {
    this._tests.click();
  }

  static get styles() {
    // language=CSS
    return [
      fontStyles,
      colorStyles,
      css`
        :host {
          display: flex;
        }
        kmap-card {
          max-width: 800px;
          background-color: white;
        }
        [hidden] {
          display: none !important;
        }

        .blink {
          animation: blinker .2s ease-in-out 2;
        }
        @keyframes blinker {
          70% {
            text-shadow: 1px 1px 4px var(--color-darkgray);
            transform: scale(1.1);
          }
        }
      `];
  }

  render() {
    // language=HTML
    return html`
      <kmap-card header="${this.chapter} → ${this.topic} (${this._levelText(this.level)})">
        <kmap-test-card-content
          .instance="${this._instance}"
          .subject="${this.subject}"
          .set="${this.set}"
          .key="${this.key}"
          .question="${this.question}"
          .answer="${this.answer}"
          .balance="${this.balance}"
          .values="${this.values}">
        </kmap-test-card-content>

        <mwc-button slot="button" @click="${this._showAnswer}">Antwort zeigen</mwc-button>
        <mwc-button slot="button" @click="${this._sendAnswer}">Antwort Abschicken</mwc-button>

        <mwc-button slot="button" @click="${this._next}" ?hidden="${this.last}">Nächste Aufgabe</mwc-button>
        <mwc-button slot="button" @click="${this._more}" ?hidden="${!this.last}">Mehr Aufgaben</mwc-button>
  </kmap-card>

  <a hidden id="tests" href="/app/test/${encodePath(this.subject, this.chapter, this.topic)}"></a>
    `;
  }
}
