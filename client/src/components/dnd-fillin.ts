import {LitElement, html, css, PropertyValues} from 'lit';
import {customElement, property, state} from 'lit/decorators.js';
import {resetStyles, colorStyles, fontStyles} from "./kmap-styles";
import {unsafeHTML} from 'lit/directives/unsafe-html.js';
import {StyleInfo, styleMap} from 'lit/directives/style-map.js';
import {katexStyles} from "../katex-css";
import {TestInteraction} from "./test-interaction";

@customElement('dnd-fillin')
export class DndFillin extends LitElement implements TestInteraction {

  @property()
  private orientation: "vertical" | "horizontal" = "vertical";
  @property()
  private dropWidth: string = "20px";
  @property()
  private dropHeight: string = "20px";
  @state()
  private _template: string = '';
  @state()
  private _dropElements: HTMLElement[] = [];
  @state()
  private _dragElements: HTMLElement[] = [];
  @state()
  private _items: string[] = [];
  @state()
  private _drags: string[] = [];
  @state()
  private _drops: string[] = [];
  @state()
  private _order: string[] = [];
  @state()
  private _doubles: string[] = [];
  @property()
  public valid: boolean;
  @state()
  private _bark: boolean = false;
  private _ci?: string;
  private _sid?: string;
  private _tid?: string;

  declare shadowRoot: ShadowRoot;

  protected willUpdate(changedProperties: PropertyValues) {
    if (changedProperties.has("_items")) {
      this._drags = shuffleArray([...this._items]);
      this._drops = this._items.map(() => "");
      this._order = this._items.map(() => "");

      const doubles: string[] = [];
      for (var i=0; i < this._items.length-1; i++) {
        var double = this._items.indexOf(this._items[i], i+1)
        if (double != -1)
          doubles.push(i + "=" + double);
      }
      this._doubles = doubles;
    }
  }

  protected updated(changedProperties: PropertyValues) {
    if (changedProperties.has("_template")) {
      this.updateComplete.then(() => {
        // @ts-ignore
        this._dropElements = Array.from(this.shadowRoot.querySelectorAll(".template drop"));
        this._dropElements.forEach((d, i) => {
          d.id="drop_" + i;
          d.style.minWidth = this.dropWidth;
          d.style.minHeight = this.dropHeight;
          d.innerHTML = "&nbsp;";
        });
        // @ts-ignore
        this._dragElements = Array.from(this.shadowRoot.querySelectorAll(".drags drag"));
      });
    }
    if (changedProperties.has("_drags")) {
      this.updateComplete.then(() => {
        this._dragElements.forEach((d, i) => {
          d.innerHTML = "";
          d.appendChild(this.createItemWrapper(this._drags[i]));
          if (this._drags[i])
            d.setAttribute("occupied", '');
          else
            d.removeAttribute("occupied");
        });
      });
    }
    if (changedProperties.has("_drops")) {
      this.updateComplete.then(() => {
        this._dropElements.forEach((d, i) => {
          d.innerHTML = "";
          d.appendChild(this.createItemWrapper(this._drops[i]));
          if (this._drops[i])
            d.setAttribute("occupied", '');
          else
            d.removeAttribute("occupied");
        });
      });
    }
    if (changedProperties.has("_order") || changedProperties.has("_bark")) {
      const order = this._givenOrder();
      var valid = true;
      for (var i=0; i < this._order.length; i++) {
        const currentValid = this._order[i] === order[i];
        valid = valid && currentValid;

        if (this._dropElements.length !== 0) {
          if (currentValid && this._bark)
            this._dropElements[i].setAttribute("correct", '');
          else
            this._dropElements[i].removeAttribute("correct");

          if (!currentValid && this._bark)
            this._dropElements[i].setAttribute("incorrect", '');
          else
            this._dropElements[i].removeAttribute("incorrect");
        }
      }
      this.valid = valid;
      console.log(this.valid);
    }
  }

  private _givenOrder() {
    const order = "0123456789".split("");
    for (const double of this._doubles) {
      const cp = double.split("=");
      order[cp[1]] = cp[0];
    }
    return order.slice(0, this._items.length);
  }

  private createItemWrapper(item: string): HTMLElement {
    const element = document.createElement("div");
    element.setAttribute("content", "" + this._items.indexOf(item))
    element.addEventListener("mousedown", this._start.bind(this));
    element.addEventListener("touchstart", this._start.bind(this));
    element.innerHTML = item;
    return element;
  }

  _templateChange(e) {
    const childNodes: Element[] = (e.target as HTMLSlotElement).assignedElements({flatten: true});
    this._template = childNodes[0].outerHTML;
  }

  _itemsChange(e) {
    const childNodes: Element[] = (e.target as HTMLSlotElement).assignedElements({flatten: true});
    this._items = childNodes.map((node) => node.outerHTML);
  }

  _start(event) {
    let moveEvent, upEvent, getPageX, getPageY
    if (window.TouchEvent && event instanceof TouchEvent) {
      moveEvent = "touchmove"
      upEvent = "touchend"
      getPageX = (e) => e.touches[0].pageX
      getPageY = (e) => e.touches[0].pageY
    }
    else if (event.button === 2)
        return;
    else {
      moveEvent = "mousemove"
      upEvent = "mouseup"
      getPageX = (e) => e.pageX
      getPageY = (e) => e.pageY
    }
    event.preventDefault();

    const drag = event.target.closest("[content]");
    this._ci = drag.getAttribute("content")
    this._sid = drag.parentNode.id;
    const containerX = drag.getBoundingClientRect().left + window.scrollX - getPageX(event);
    const containerY = drag.getBoundingClientRect().top + window.scrollY - getPageY(event);
    drag.classList.add("ghost");

    const item = drag.cloneNode(true);
    item.style.position = 'absolute';
    item.style.zIndex = 2;
    document.body.appendChild(item);

    const moveItem = (event) => {
      let itemAbsoluteLeft = getPageX(event);
      let itemAbsoluteTop = getPageY(event);
      item.style.left = itemAbsoluteLeft + containerX + 'px'
      item.style.top = itemAbsoluteTop + containerY + 'px'
      let elements = this.shadowRoot.elementsFromPoint(itemAbsoluteLeft, itemAbsoluteTop);
      elements = elements.filter(e => (e.tagName === "DRAG" || e.tagName === "DROP") && !e.hasAttribute("occupied"));
      const mark = elements.length === 1 ? elements[0] : undefined;
      this._tid = mark ? mark.id : undefined;
      this._hover(mark);
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
      this._hover();
      drop();
      event.cancelBubble = true;
    }
    document.addEventListener(upEvent, onUpEvent);
    document.addEventListener(moveEvent, onMoveEvent)
  }

  private _hover(mark?: Element) {
    this.shadowRoot.querySelectorAll("drag, drop").forEach(e => {
      if (e === mark)
        e.classList.add("hover");
      else
        e.classList.remove("hover");
    });
  }

  _drop() {
    if (!this._sid || !this._tid) return;
    this._bark = false;

    const sid = this._sid;
    // @ts-ignore
    const i = this._ci;
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

  showAnswer() {
    const lalas = [...this._drags];
    const lolos = [...this._drops];
    for (let i = 0; i < this._items.length; i++) {
      lalas[i] = "";
      lolos[i] = this._items[i];
    }
    this._drags = lalas;
    this._drops = lolos;
    this._order = this._givenOrder();
    this._bark = false;
  }

  init() {
    const lalas = shuffleArray([...this._items]);
    const lolos = [...this._drops];
    for (let i = 0; i < this._items.length; i++) {
      lolos[i] = "";
    }
    this._drags = lalas;
    this._drops = lolos;
    this._bark = false;
  }

  bark() {
    this._bark = true;
  }

  isValid(): boolean {
    return this.valid;
  }

  static get styles() {
    // language=CSS
    return [
      resetStyles,
      fontStyles,
      colorStyles,
      katexStyles,
      css`
        :host {
          cursor: pointer;
          user-select: none;
          touch-action: none;
        }
        drag, drop {
          display: inline-flex;
          width: auto;
          height: auto;
          border: 2px solid lightgrey;
          border-radius: 4px;
          transition: border-color .3s ease-in-out, opacity .3s ease-in-out;
          align-items: center;
          justify-content: center;
          padding: 4px;
        }
        drag > *, drop > * {
          text-align: center;
        }
        .hover {
          border: 2px dashed green;
        }
        .ghost {
          opacity: .5;
        }
        [correct] {
          outline-style: solid;
          outline-color: rgba(var(--color-green-num), .7);
        }
        [incorrect] {
          outline-style: solid;
          outline-color: rgba(var(--color-red-num), .7);
        }
        slot {
          display: none;
        }
      `];
  }

  render() {
    const container: StyleInfo = this.orientation === "vertical"
      ? { display: "flex", flexDirection: "column" }
      : { display: "flex", flexDirection: "row" };
    const drags: StyleInfo = this.orientation === "vertical"
      ? { display: "flex", flexFlow: "row wrap", marginTop: "8px"  }
      : { display: "flex", flexFlow: "column wrap", marginLeft: "8px" };
    const drag: StyleInfo = { minWidth: this.dropWidth, minHeight: this.dropHeight };
    // language=HTML
    return html`
      <slot name="template" @slotchange=${this._templateChange}></slot>
      <slot name="item" @slotchange=${this._itemsChange}></slot>
      <div style="${styleMap(container)}">
        <div class="template">${unsafeHTML(this._template)}</div>
        <div class="drags" style="${styleMap(drags)}">${this._drags.map((x, i) => { x; return html`<drag id="drag_${i}" style="${styleMap(drag)}"></drag>` })}</div>
      </div>
    `;
  }
}

function shuffleArray(array): [] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}
