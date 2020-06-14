import {LitElement, html, css, customElement, property, query, queryAll} from 'lit-element';
import {store} from "../store";

import '@material/mwc-button';
import '@material/mwc-dialog';
import '@material/mwc-formfield';
import '@material/mwc-radio';
import '@material/mwc-textarea';
import '@material/mwc-textfield';
import {colorStyles, fontStyles} from "./kmap-styles";
import {Dialog} from "@material/mwc-dialog/mwc-dialog";
import {Radio} from "@material/mwc-radio/mwc-radio";

@customElement('kmap-feedback')
export class KMapFeedback extends LitElement {
  @property()
  private subject: string = '';
  @property()
  private chapter: string = '';
  @property()
  private topic: string = '';
  @property()
  private test?: string = undefined;

  @property()
  private _type: string = '';
  @property()
  private _title: string = '';
  @property()
  private _text: string = '';

  @query('#dialog')
  // @ts-ignore
  private _dialog: Dialog;
  @queryAll('mwc-radio')
  // @ts-ignore
  private _radios: Radio[];


  static get styles() {
    // language=CSS
    return [
      fontStyles,
      colorStyles,
      css`
        mwc-dialog {
          --mdc-dialog-min-width: 630px;
          --mdc-dialog-max-width: 810px;
        }
        form > * {
          margin: 12px 0px;
        }
        [hidden] {
          display: none !important;
        }
      `];
  }

  show() {
    this._type = '';
    this._title = '';
    this._text = '';
    for (const radio of this._radios)
      radio.checked = false;

    this._dialog.show();
  }
  _cancel() {
    this._dialog.close();
  }
  _send() {
    this._dialog.close();
    store.dispatch.feedback.submit({subject: this.subject, chapter: this.chapter, topic: this.topic, test: this.test, type: this._type, title: this._title, text: this._text});
    store.dispatch.shell.showMessage("Vielen Dank für Dein Feedback!")
  }

  render() {
    // language=HTML
    return html`
  <mwc-dialog id="dialog" heading="Feedback">
    <form>
      <label secondary>${this.topic !== undefined ? this.subject + " → " + this.chapter + " → " + this.topic : this.subject + " → " + this.chapter}</label>
      ${this.test !== undefined ? html`
        <br/><label secondary>Aufgabe '${this.test}'</label>
      ` : ''}
      <div>
        <mwc-formfield label="Fehler"><mwc-radio id="error" name="type" value="error" dialogInitialFocus @change="${() => this._type = 'error'}"></mwc-radio></mwc-formfield>
        <mwc-formfield label="Verbesserungsvorschlag"><mwc-radio id="proposal" name="type" value="proposal" @change="${() => this._type = 'proposal'}"></mwc-radio></mwc-formfield>
      </div>
      <mwc-textfield id="title" label="Titel" dense .value=${this._title} @input="${e => this._title = e.target.value}"></mwc-textfield>
      <mwc-textarea id="text" placeholder="Text" dense fullwidth rows="7" .value=${this._text} @input="${e => this._text = e.target.value}"></mwc-textarea>
    </form>
    <mwc-button slot="secondaryAction" @click=${this._cancel}>Abbrechen</mwc-button>
    <mwc-button slot="primaryAction" ?disabled=${this._type === '' || this._title === '' || this._text === ''} @click=${this._send}>Abschicken</mwc-button>
  </mwc-dialog>
    `;
  }
}
