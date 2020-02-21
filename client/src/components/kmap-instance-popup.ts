import {LitElement, html, css, customElement, query, property, TemplateResult} from 'lit-element';
import {ifDefined} from "lit-html/directives/if-defined";
import { connect } from '@captaincodeman/rdx';
import {State, store} from "../store";

import '@material/mwc-button';
import '@material/mwc-dialog';
import '@material/mwc-radio';
import '@material/mwc-textfield';
import 'pwa-helper-components/pwa-install-button';
import 'pwa-helper-components/pwa-update-available';
import {Dialog} from "@material/mwc-dialog/mwc-dialog";
import {TextField} from "@material/mwc-textfield/mwc-textfield";
import {colorStyles, fontStyles} from "./kmap-styles";
import {Instance} from "../models/instances";

@customElement('kmap-instance-popup')
export class KMapInstancePopup extends connect(store, LitElement) {
  @property()
  private _instances: Instance[] = [];
  @property()
  private _instance: string = '';

  @query('#instanceDialog')
  // @ts-ignore
  private _instanceDialog: Dialog;
  @query('#instance')
  // @ts-ignore
  private _instanceTextField: DatalistTextField;

  @property()
  private _radio: string = 'root';

  mapState(state: State) {
    return {
      _instances: state.instances.instances,
      _instance: state.app.instance,
    };
  }

  updated(changedProps) {
    if (changedProps.has('_radio') && this._radio === 'dedicated') {
      setTimeout(function(textfield: TextField){
        textfield.focus();
      }.bind(undefined, this._instanceTextField), 300);
    }
    if (changedProps.has("_instance")) {
      if (this._instance === 'root') {
        this._radio = 'root';
      }
      else {
        this._radio = 'dedicated';
        this._instanceTextField.value = this._instance;
      }
    }
  }

  show() {
    store.dispatch.instances.load();
    this._instanceDialog.show();
  }

  _chooseInstance() {
    let instance: string = this._radio === 'root' ? 'root' : this._instanceTextField.value;
    if (this._instances.find(i => i.name === instance) === undefined) {
      store.dispatch.shell.showMessage("Ungültige Instanz!");
    }
    else {
      // @ts-ignore
      store.dispatch.app.chooseInstance(instance);
      this._instanceDialog.close();
    }
  }

  _maybeEnter(event) {
    if (event.keyCode === 13) {
      event.preventDefault();
      this._chooseInstance();
    }
  }

  static get styles() {
    // language=CSS
    return [
      fontStyles,
      colorStyles,
      css`
        form {
          width: 300px;
          display: block;
        }
        [hidden] {
          display: none !important;
        }
        datalist-textfield {
          width: 300px;
          --mdc-text-field-filled-border-radius: 4px 16px 0 0;
          margin-left: 42px;
        }
        mwc-formfield {
          display: block;
        }
      `];
  }

  render() {
    // language=HTML
    return html`
  <mwc-dialog id="instanceDialog" title="Instanz wählen">
    <div>
        <h3>Instanzen</h3>
        <p>Wenn Deine Schule eine eigene KMap Instanz eingerichtet hat, stehen Dir für die Zusammenarbeit in Deiner
         Klasse und mit Deinen Lehrern erweiterte Funktionen zur Verfügung.</p>
    <mwc-formfield label="Meine Schule hat keine eigene Instanz"><mwc-radio name="group" value="root" ?checked="${this._radio === 'root'}" @change="${() => this._radio = 'root'}"></mwc-radio></mwc-formfield>
    <mwc-formfield label="Ich möchte die Instanz meiner Schule nutzen ..."><mwc-radio name="group" value="dedicated" ?checked="${this._radio === 'dedicated'}" @change="${() => this._radio = 'dedicated'}" dialogitialFocus></mwc-radio></mwc-formfield>
    </div>
    <datalist-textfield id="instance" name="instance" label="Instanz" type="text" ?required="${this._radio === 'dedicated'}" ?disabled="${this._radio !== 'dedicated'}"
      .datalist="${this._instances.map(instance => {return {value: instance.name, label: instance.description}}).filter(instance => instance.value !== 'root')}">
    </datalist-textfield>
    <mwc-button slot="primaryAction" @click=${this._chooseInstance}>Auswählen</mwc-button>
  </mwc-dialog>
    `;
  }
}


interface Option {
  value: string,
  label?: string,
}

@customElement('datalist-textfield')
class DatalistTextField extends TextField {
  @property()
  private datalist: Option[] = [];

  protected renderInput(): TemplateResult {
    const maxOrUndef = this.maxLength === -1 ? undefined : this.maxLength;
    return html`
      <input
          id="text-field"
          class="mdc-text-field__input"
          type="${this.type}"
          .value="${this.value}"
          ?disabled="${this.disabled}"
          placeholder="${this.placeholder}"
          ?required="${this.required}"
          maxlength="${ifDefined(maxOrUndef)}"
          pattern="${ifDefined(this.pattern ? this.pattern : undefined)}"
          min="${ifDefined(this.min === '' ? undefined : this.min as number)}"
          max="${ifDefined(this.max === '' ? undefined : this.max as number)}"
          step="${ifDefined(this.step === null ? undefined : this.step)}"
          @input="${this.handleInputChange}"
          @blur="${this.onInputBlur}"
          list="datalist">

        <datalist id="datalist">
          ${this.datalist.map(option => html`<option value=${option.value} label="${ifDefined(option.label)}"/>`)}
        </datalist>
        `;
  }
}
