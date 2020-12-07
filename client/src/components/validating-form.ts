import {LitElement, html, css, customElement, property, query} from 'lit-element';
import '@material/mwc-icon';

@customElement('validating-form')
export class ValidatingForm extends LitElement {
  @property()
  valid: boolean = false;

  private _validates?: NodeListOf<HTMLInputElement> = undefined;

  @query('form')
  // @ts-ignore
  private _form: HTMLFormElement;

  _slotchange() {
    this._validates = this.querySelectorAll('[required],[pattern]');
    //console.log(this._validates)
  }

  reset() {
    this._form.reset();
    if (!this._validates)
      return;

    for (const validate of this._validates) {
      validate.value = '';
      // @ts-ignore
      validate.valid = true;
    }
  }

  _checkValidity() {
    if (this._validates === undefined)
      return;

    let valid = true;
    for (const validate of this._validates)
      valid = valid && validate.validity.valid;

    if (this.valid !== valid) {
      this.valid = valid;
      this.dispatchEvent(new CustomEvent('validity', {bubbles: true, composed: true}));
    }
  }

  static get styles() {
    // language=CSS
    return [
      css`
        :host {
          display: contents;
        }
      `];
  }

  render() {
    //language=HTML
    return html`
      <form @input="${this._checkValidity}">
        <slot @slotchange="${this._slotchange}"></slot>
      </form>
    `;
  }
}
