import {LitElement, html, css, customElement, property, PropertyValues} from 'lit-element';
import {colorStyles, elevationStyles, fontStyles} from "./kmap-styles";
import {unsafeHTML} from "lit-html/directives/unsafe-html";
import {styleMap} from "lit-html/directives/style-map";
import {katexStyles} from "../katex-css";

@customElement('dnd-assign')
export class DndAssign extends LitElement {

  @property()
  private orientation: "vertical" | "horizontal" = "vertical";
  @property()
  private _targets: string[] = [];
  @property()
  private _items: string[] = [];
  @property()
  private _drags: string[] = [];
  @property()
  private _drops: string[] = [];
  @property()
  private _order: string[] = [];
  @property()
  public valid?: boolean;
  @property()
  private _bark: boolean = false;
  private _sid?: string;
  private _tid?: string;

  protected updated(changedProperties: PropertyValues) {
    if (changedProperties.has("_items")) {
      this._drags = shuffleArray([...this._items]);
      this._drops = this._items.map(() => "");
      this._order = this._items.map(() => "");
    }
    if (changedProperties.has("_order")) {
      this.valid = this._order.join("") === "0123456789".substr(0, this._order.length);
      console.log(this.valid);
    }
  }

  _targetsChange(e) {
    const childNodes: Element[] = (e.target as HTMLSlotElement).assignedElements({flatten: true});
    this._targets = childNodes.map((node) => node.outerHTML);
  }

  _itemsChange(e) {
    const childNodes: Element[] = (e.target as HTMLSlotElement).assignedElements({flatten: true});
    this._items = childNodes.map((node) => node.outerHTML);
  }

  _start(event) {
    let moveEvent, upEvent, getPageX, getPageY
    if (event instanceof TouchEvent) {
      moveEvent = "touchmove"
      upEvent = "touchend"
      getPageX = (e) => e.touches[0].pageX
      getPageY = (e) => e.touches[0].pageY
      event.preventDefault();
    }
    else if (event.button === 2)
        return;
    else {
      moveEvent = "mousemove"
      upEvent = "mouseup"
      getPageX = (e) => e.pageX
      getPageY = (e) => e.pageY
    }

    const drag = event.target.closest("[content]");
    this._sid = drag.id;
    const containerX = drag.getBoundingClientRect().left + window.scrollX - getPageX(event);
    const containerY = drag.getBoundingClientRect().top + window.scrollY - getPageY(event);
    drag.classList.add("ghost");

    const item = drag.cloneNode(true);
    item.style.position = 'absolute';
    item.style.zIndex = 2;
    document.body.appendChild(item);

    const moveItem = (event) => {
      if (this.shadowRoot === null) return;

      let itemAbsoluteLeft = getPageX(event);
      let itemAbsoluteTop = getPageY(event);
      item.style.left = itemAbsoluteLeft + containerX + 'px'
      item.style.top = itemAbsoluteTop + containerY + 'px'
      const elements = this.shadowRoot.elementsFromPoint(itemAbsoluteLeft, itemAbsoluteTop).filter(e => e.classList.contains("drop"));
      const mark = elements.length === 1 ? elements[0] : undefined;
      this._tid = mark ? mark.id : undefined;

      this.shadowRoot.querySelectorAll(".drop").forEach(e => {
        if (e === mark)
          e.classList.add("hover");
        else
          e.classList.remove("hover");
      });
    }
    const onMoveEvent = (event) => {
      moveItem(event)
    }
    moveItem(event)

    const drop = this._drop.bind(this);

    const onUpEvent = (event) => {
      document.removeEventListener(moveEvent, onMoveEvent)
      document.removeEventListener(upEvent, onUpEvent);
      document.body.removeChild(item);

      drag.classList.remove("ghost");
      drop();
      event.cancelBubble = true;
    }
    document.addEventListener(upEvent, onUpEvent);
    document.addEventListener(moveEvent, onMoveEvent)
  }

  _drop() {
    if (!this._sid || !this._tid) return;
    if (!this.shadowRoot) return;

    const sid = this._sid;
    // @ts-ignore
    const i = this.shadowRoot.getElementById(sid).getAttribute("content");
    // @ts-ignore
    const content = this._items[i];
    const st = sid.split("_")[0];
    const si = sid.split("_")[1];

    if (st === "drop") {
      const lalas = [...this._drops];
      lalas[si] = ""
      this._drops = lalas;
    }
    else if (st === "drag") {
      const lalas = [...this._drags];
      lalas[si] = "";
      this._drags = lalas;
    }

    const tid = this._tid;
    const tt = tid.split("_")[0];
    const ti = tid.split("_")[1];

    if (tt === "drop") {
      const lalas = [...this._drops];
      lalas[ti] = content;
      this._drops = lalas;
    }
    else if (tt === "drag") {
      const lalas = [...this._drags];
      lalas[ti] = content;
      this._drags = lalas;
    }

    const orders = [...this._order];
    if (tt === "drop")
      orders[ti] = i;
    if (st === "drop")
      orders[si] = "";
    this._order = orders;
  }

  _isCorrect(i: number): boolean {
    return this._order[i] === "0123456789".charAt(i);
  }

  showAnswer() {
    const lalas = [...this._drags];
    const lolos = [...this._drops];
    for (let i = 0; i < this._items.length; i++) {
      lalas[i] = "";
      lolos[i] = this._items[i];
    }
    this._drags = lalas;
    this._drops = lolos;
    this._bark = false;
  }

  clear() {
    const lalas = [...this._drags];
    const lolos = [...this._drops];
    for (let i = 0; i < this._items.length; i++) {
      lalas[i] = this._items[i];
      lolos[i] = "";
    }
    this._drags = lalas;
    this._drops = lolos;
    this._bark = false;
  }

  bark() {
    this._bark = true;
  }

  static get styles() {
    // language=CSS
    return [
      fontStyles,
      colorStyles,
      katexStyles,
      elevationStyles,
      css`
        .grid {
          display: grid;
          grid-gap: 8px;
          grid-template-rows: repeat(3, 1fr);
          grid-template-columns: repeat(3, 1fr);
          cursor: pointer;
          user-select: none;
        }
        div.drop {
          border: 2px solid lightgrey;
          border-radius: 4px;
          transition: border-color .3s ease-in-out, opacity .3s ease-in-out;
        }
        div.drag {
          border: 2px solid lightgrey;
          border-radius: 4px;
          transition: border-color .3s ease-in-out, opacity .3s ease-in-out;
        }
        div.hover {
          border: 2px dashed green;
        }
        div.ghost {
          opacity: .5;
        }
        div[correct] {
          outline-style: solid;
          outline-color: var(--color-green);
        }
        div[incorrect] {
          outline-style: solid;
          outline-color: var(--color-red);
        }
        slot {
          display: none;
        }
      `];
  }

  render() {
    const styles = this.orientation === "vertical"
      ? {
        gridTemplateRows: "repeat(3, 1fr)",
        gridTemplateColumns: `repeat(${this._items.length}, 1fr)`,
      } : {
        gridTemplateRows: `repeat(${this._items.length}, 1fr)`,
        gridTemplateColumns: "repeat(3, 1fr)",
      }
    ;
    // language=HTML
    return html`
      <slot name="target" @slotchange=${this._targetsChange}></slot>
      <slot name="item" @slotchange=${this._itemsChange}></slot>
      <div class="grid" style="${styleMap(styles)}">
        ${this.orientation === "vertical"
          ? html`
            ${this._targets.map((d, i) => html`<div id="${i}" class="target">${unsafeHTML(d)}</div>`)}
            ${this._drops.map((d, i) => this._renderCell(i, d, true))}
            ${this._drags.map((d, i) => this._renderCell(i, d, false))}
          ` : html`
            ${this._items.map((x, i) => { x;
              return html`
              <div id="${i}" class="target">${unsafeHTML(this._targets[i])}</div>
              ${this._renderCell(i, this._drops[i], true)}
              ${this._renderCell(i, this._drags[i], false)}
            `})}
          `
        }
      </div>
    `;
  }

  private _renderCell(i: number, d: string, t: boolean) {
    return d === ""
      ? html`<div class="drop" id="${t ? 'drop' : 'drag'}_${i}" ?correct="${t && this._bark && this._isCorrect(i)}" ?incorrect="${t && this._bark && !this._isCorrect(i)}">&nbsp;</div>`
      : html`<div class="drag" ?correct="${t && this._bark && this._isCorrect(i)}" ?incorrect="${t && this._bark && !this._isCorrect(i)}"><div id="${t ? 'drop' : 'drag'}_${i}" content="${this._items.indexOf(d)}" @mousedown="${this._start}" @touchstart="${this._start}"><style>${katexStyles}</style>${unsafeHTML(d)}</div></div>`;
  }
}

function shuffleArray(array): [] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}
