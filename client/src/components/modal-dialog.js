import { LitElement, html, css } from 'lit-element';
import { colorStyles, fontStyles } from "./kmap-styles";

class ModalDialog extends LitElement {

  constructor () {
    super()
    this.opened = false
  }

  static get properties () {
    return {
      opened: {type: Boolean}
    }
  }

  static get styles() {
    return [
      fontStyles,
      colorStyles,
      css`
.dialog[opened] {
  position: fixed;
    display: flex;
}
.dialog {
    display: none;
}
.dialog {
    flex-direction: column;
    border: 2px outset black;
    padding: 1em;
    margin: 1em;
}
.buttons {
    display: flex;
    flex-direction: row;
}
.accept {
    justify-content: space-around;
    align-content: space-around;
}
.cancel {
    justify-content: space-around;
    align-content: space-around;
}
`
    ];
  }

  render () {
    return html`
<div class="dialog" ?opened="${this.opened}">
    <h1 class="title ">Title</h1>
    <slot>This is a dialog</slot>
    <slot name="action"></slot>
</div>`
  }
}

customElements.define('modal-dialog', ModalDialog)
