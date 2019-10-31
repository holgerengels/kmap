import {LitElement, html, css} from 'lit-element';
import {unsafeHTML} from 'lit-html/directives/unsafe-html';
import '@material/mwc-icon-button';

class SimpleEditor extends LitElement {

  static get styles() {
    return [];
  }

  render() {
    return html`
      ${this.editMode ? html`
<div class="toolbar">
  <mwc-icon-button @click="${() => this._exec('removeFormat')}" icon="format_clear"></mwc-icon-button>
  <mwc-icon-button @click="${() => this._exec('bold')}" icon="format_bold"></mwc-icon-button>
  <mwc-icon-button @click="${() => this._exec('insertUnorderedList')}" icon="format_list_bulleted"></mwc-icon-button>
  <mwc-icon-button @click="${() => this._exec('insertOrderedList')}" icon="format_list_numbered"></mwc-icon-button>
  <mwc-icon-button @click="${() => this._exec('indent')}" icon="format_indent_increase"></mwc-icon-button>
  <mwc-icon-button @click="${() => this._exec('outdent')}" icon="format_indent_decrease"></mwc-icon-button>
</div>
    ` : ''}

<div id="editable" @focusout="${this._updateText}" class="text-block" ?contenteditable=${this.editMode}>${unsafeHTML(this.text)}</div>
      `;
  }

  static get properties() {
    return {
      text: {type: String},
      editMode: {type: Boolean},
    };
  }

  constructor() {
    super();
    this.text = '';
    this.editMode = true;
  }

  firstUpdated(changedProperties) {
    this._editable = this.shadowRoot.getElementById('editable');
  }

  _exec(command, arg = null) {
    document.execCommand(command, false , arg);
    this._editable.focus();
  }

  _updateText() {
    console.log(this._editable.innerHTML.replace('<!---->', ''));
  }
}

window.customElements.define('simple-editor', SimpleEditor);
