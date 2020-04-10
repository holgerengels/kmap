import {LitElement, html, css, customElement, property} from 'lit-element';
import '@material/mwc-icon';

@customElement('file-drop')
export class FileDrop extends LitElement {

  @property()
  private _file?: File = undefined;

  @property({type: String, reflect: true})
  private over: boolean = false;

  public validity: ValidityState = this.valid(false);

  _dropHandler(event) {
    event.preventDefault();

    let files: File[] = [];
    if (event.dataTransfer.items) {
      // Use DataTransferItemList interface to access the file(s)
      for (var i = 0; i < event.dataTransfer.items.length; i++) {
        // If dropped items aren't files, reject them
        if (event.dataTransfer.items[i].kind === 'file') {
          var file = event.dataTransfer.items[i].getAsFile();
          console.log('... file[' + i + '].name = ' + file.name);
          files.push(file);
        }
      }
    }
    else {
      // Use DataTransfer interface to access the file(s)
      for (var i = 0; i < event.dataTransfer.files.length; i++) {
        console.log('... file[' + i + '].name = ' + event.dataTransfer.files[i].name);
      }
      files = event.dataTransfer.files;
    }
    this._file = files[0];

    this.validity = this.valid(true);

    this.dispatchEvent(new CustomEvent('filedrop', {bubbles: true, composed: true, detail: {file: this._file}}));
    this.over = false;
  }

  private valid(valid: boolean) {
    return {
      badInput: false,
      customError: false,
      patternMismatch: false,
      rangeOverflow: false,
      rangeUnderflow: false,
      stepMismatch: false,
      tooLong: false,
      tooShort: false,
      typeMismatch: false,
      valueMissing: false,
      valid: valid,
    };
  }

  clear() {
    this._file = undefined;
    this.validity = this.valid(false);
  }

  _dragEnterHandler(event) {
    this.over = true;
    event.preventDefault();
  }

  _dragOverHandler(event) {
    event.preventDefault();
  }

  _dragLeaveHandler(event) {
    this.over = false;
    event.preventDefault();
  }

  static get styles() {
    // language=CSS
    return [
      css`
        :host {
          display: inline-block;
          box-sizing: border-box;
          width: 100%;
          background-color: var(--color-lightgray);
          padding: 16px 16px 15px 16px;
          border-radius: 4px 16px 0 0;
          border-bottom: 1px solid;
          overflow: hidden;
        }
        :host([over=true]) {
          padding: 14px 14px 14px 14px;
          border-radius: 4px 16px 0 0;
          border: 2px dashed green;
        }
        div {
          width: 100%;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        `
    ];
  }

  render() {
    //language=HTML
    return html`
      <div ?over="${this.over}" @drop="${this._dropHandler}" @dragover="${this._dragOverHandler}" @dragenter="${this._dragEnterHandler}" @dragleave="${this._dragLeaveHandler}">
        ${this._file !== undefined ? this._file.name : "Drop File *"}
      </div>
    `;
  }
}
