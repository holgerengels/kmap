import {customElement, html, property, TemplateResult} from "lit-element";
import {TextField} from "@material/mwc-textfield/mwc-textfield";
import {ifDefined} from "lit-html/directives/if-defined";
import {live} from "lit-html/directives/live";

export interface Option {
  value: string,
  label?: string,
}

@customElement('datalist-textfield')
export class DatalistTextField extends TextField {
  @property()
  private datalist: Option[] = [];

  protected renderInput(): TemplateResult {
    const minOrUndef = this.minLength === -1 ? undefined : this.minLength;
    const maxOrUndef = this.maxLength === -1 ? undefined : this.maxLength;
    const autocapitalizeOrUndef = this.autocapitalize ? this.autocapitalize : undefined;
    return html`
      <input
          aria-labelledby="label"
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
          @blur="${this.onInputBlur}"
          list="datalist">

        <datalist id="datalist">
          ${this.datalist.map(option => html`<option value=${option.value} label="${ifDefined(option.label)}"/>`)}
        </datalist>
        `;
  }
}
