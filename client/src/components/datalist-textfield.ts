import {customElement, html, property, TemplateResult} from "lit-element";
import {TextField} from "@material/mwc-textfield/mwc-textfield";
import {ifDefined} from "lit-html/directives/if-defined";

export interface Option {
  value: string,
  label?: string,
}

@customElement('datalist-textfield')
export class DatalistTextField extends TextField {
  @property()
  private datalist: Option[] = [];

  protected renderInput(): TemplateResult {
    const maxOrUndef = this.maxLength === -1 ? undefined : this.maxLength;
    return html`
      <input
          aria-labelledby="label"
          class="mdc-text-field__input"
          type="${this.type}"
          .value="${this.value}"
          ?disabled="${this.disabled}"
          placeholder="${this.placeholder}"
          ?required="${this.required}"
          ?readonly="${this.readOnly}"
          maxlength="${ifDefined(maxOrUndef)}"
          pattern="${ifDefined(this.pattern ? this.pattern : undefined)}"
          min="${ifDefined(this.min === '' ? undefined : this.min as number)}"
          max="${ifDefined(this.max === '' ? undefined : this.max as number)}"
          step="${ifDefined(this.step === null ? undefined : this.step)}"
          inputmode="${ifDefined(this.inputMode)}"
          @input="${this.handleInputChange}"
          @blur="${this.onInputBlur}"
          list="datalist">

        <datalist id="datalist">
          ${this.datalist.map(option => html`<option value=${option.value} label="${ifDefined(option.label)}"/>`)}
        </datalist>
        `;
  }
}
