//import {defaultKeymap} from "@codemirror/commands";
import {EditorState, EditorView, basicSetup} from "@codemirror/basic-setup";
import {html} from "@codemirror/lang-html";

export class KMapEditorEditDialog extends HTMLElement {
  private _view: EditorView;

  constructor() {
    super();
    var shadow = this.attachShadow({mode: 'open'});
    this._view = new EditorView({
      state: EditorState.create({extensions: [basicSetup, html()]}),
      parent: shadow,
    });
  }
  connectedCallback() {
    console.log("lala");
  }

  public get value() {
    return "" + this._view.state.doc;
  }
}
