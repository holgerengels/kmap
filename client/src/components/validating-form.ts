import {LitElement, html, css} from 'lit';
import {customElement, property, query} from 'lit/decorators.js';
import '@material/mwc-icon';

@customElement('validating-form')
export class ValidatingForm extends LitElement {
  @property()
  valid: boolean = false;

  private _validates?: NodeListOf<HTMLInputElement> = undefined;

  @query('form')
  // @ts-ignore
  private _form: HTMLFormElement;

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
    this._validates = this.querySelectorAll('[required],[pattern]');

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
        :host, form {
          display: contents;
        }
      `];
  }

  render() {
    //language=HTML
    return html`
      <form @input="${this._checkValidity}">
        <slot></slot>
      </form>
    `;
  }
}
