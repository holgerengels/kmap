import {html} from "lit";
import {customElement, property} from 'lit/decorators.js';
import {TextField} from "@material/mwc-textfield/mwc-textfield";
import {ifDefined} from 'lit/directives/if-defined.js';
import {live} from 'lit/directives/live.js';

export interface Option {
  value: string,
  label?: string,
}

@customElement('datalist-textfield')
export class DatalistTextField extends TextField {
  @property()
  private datalist: Option[] = [];

  /** @soyTemplate */
  // @ts-ignore
  renderInput(shouldRenderHelperText) {
    const minOrUndef = this.minLength === -1 ? undefined : this.minLength;
    const maxOrUndef = this.maxLength === -1 ? undefined : this.maxLength;
    const autocapitalizeOrUndef = this.autocapitalize ?
      this.autocapitalize :
      undefined;
    const showValidationMessage = this.validationMessage && !this.isUiValid;
    const ariaLabelledbyOrUndef = !!this.label ? 'label' : undefined;
    const ariaControlsOrUndef = shouldRenderHelperText ? 'helper-text' : undefined;
    const ariaDescribedbyOrUndef = this.focused || this.helperPersistent || showValidationMessage ?
      'helper-text' :
      undefined;
    // TODO: live() directive needs casting for lit-analyzer
    // https://github.com/runem/lit-analyzer/pull/91/files
    // TODO: lit-analyzer labels min/max as (number|string) instead of string
    return html `
      <input
          aria-labelledby=${ifDefined(ariaLabelledbyOrUndef)}
          aria-controls="${ifDefined(ariaControlsOrUndef)}"
          aria-describedby="${ifDefined(ariaDescribedbyOrUndef)}"
          class="mdc-text-field__input"
          type="${this.type}"
          .value="${live(this.value)}"
          ?disabled="${this.disabled}"
          placeholder="${this.placeholder}"
          ?required="${this.required}"
          ?readonly="${this.readOnly}"
          minlength="${ifDefined(minOrUndef)}"
          maxlength="${ifDefined(maxOrUndef)}"
          pattern="${ifDefined(this.pattern ? this.pattern : undefined)}"
          min="${ifDefined(this.min === '' ? undefined : this.min)}"
          max="${ifDefined(this.max === '' ? undefined : this.max)}"
          step="${ifDefined(this.step === null ? undefined : this.step)}"
          size="${ifDefined(this.size === null ? undefined : this.size)}"
          name="${ifDefined(this.name === '' ? undefined : this.name)}"
          inputmode="${ifDefined(this.inputMode)}"
          autocapitalize="${ifDefined(autocapitalizeOrUndef)}"
          @input="${this.handleInputChange}"
          @focus="${this.onInputFocus}"
          @blur="${this.onInputBlur}"
          list="datalist">

        <datalist id="datalist">
          ${this.datalist.map(option => html`<option value=${option.value} label="${ifDefined(option.label)}"/>`)}
        </datalist>
        `;
  }
}
