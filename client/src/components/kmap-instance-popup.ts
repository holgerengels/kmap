import {html, css} from 'lit';
import {customElement, query, state} from 'lit/decorators.js';
import {Connected} from "./connected";
import {State, store} from "../store";

import '@material/mwc-button';
import '@material/mwc-dialog';
import '@material/mwc-radio';
import '@material/mwc-textfield';
import 'pwa-helper-components/pwa-install-button';
import 'pwa-helper-components/pwa-update-available';
import './datalist-textfield';
import {Dialog} from "@material/mwc-dialog/mwc-dialog";
import {Instance} from "../models/instances";
import {DatalistTextField} from "./datalist-textfield";
import {resetStyles, colorStyles, fontStyles} from "./kmap-styles";

@customElement('kmap-instance-popup')
export class KMapInstancePopup extends Connected {
  @state()
  private _instances: Instance[] = [];
  @state()
  private _instance: string = '';

  @query('#instanceDialog')
  // @ts-ignore
  private _instanceDialog: Dialog;

  @query('#instance')
  // @ts-ignore
  private _instanceTextField: DatalistTextField;

  @state()
  private _radio: string = 'root';
  @state()
  private _valid: boolean = true;

  mapState(state: State) {
    return {
      _instances: state.instances.instances,
      _instance: state.app.instance,
    };
  }

  updated(changedProps) {
    if (changedProps.has('_radio') && this._radio === 'dedicated') {
      setTimeout(function(textfield: DatalistTextField){
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
      store.dispatch.app.chooseInstance(instance);
      this._instanceDialog.close();
    }
  }

  _maybeEnter(event) {
    if (event.key === "Enter") {
      event.preventDefault();
      this._chooseInstance();
    }
  }

  _checkValidity(event) {
    console.log(event);
  }

  static get styles() {
    // language=CSS
    return [
      resetStyles,
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
  <!--googleoff: all-->
  <mwc-dialog id="instanceDialog" title="Instanz wählen" @change="${this._checkValidity}">
    <div>
        <h3>Instanzen</h3>
        <p>Wenn Deine Schule eine eigene KMap Instanz eingerichtet hat, stehen Dir für die Zusammenarbeit in Deiner
         Klasse und mit Deinen Lehrer*innen erweiterte Funktionen zur Verfügung.</p>
    <mwc-formfield label="Meine Schule hat keine eigene Instanz"><mwc-radio name="group" value="root" ?checked="${this._radio === 'root'}" @change="${() => this._radio = 'root'}"></mwc-radio></mwc-formfield>
    <mwc-formfield label="Ich möchte die Instanz meiner Schule nutzen ..."><mwc-radio name="group" value="dedicated" ?checked="${this._radio === 'dedicated'}" @change="${() => this._radio = 'dedicated'}" dialogitialFocus></mwc-radio></mwc-formfield>
    </div>
    <datalist-textfield id="instance" name="instance" label="Instanz" type="text" ?required="${this._radio === 'dedicated'}" ?disabled="${this._radio !== 'dedicated'}"
      .datalist="${this._instances.map(instance => {return {value: instance.name, label: instance.description}}).filter(instance => instance.value !== 'root')}"
      pattern="[a-z-]*" helper="Nur kleine Buchstaben">
    </datalist-textfield>
    <mwc-button slot="primaryAction" @click=${this._chooseInstance} ?disabled="${!this._valid}">Auswählen</mwc-button>
  </mwc-dialog>
  <!--googleon: all-->
    `;
  }
}
