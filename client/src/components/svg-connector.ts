import {LitElement, svg, customElement, property, css} from 'lit-element';

export interface Connection {
  fromx: number;
  fromy: number;
  tox: number;
  toy: number;
}

@customElement('svg-connector')
export class Connector extends LitElement {
  @property()
  private _tension: number = .5;

  @property()
  private _connections: Connection[] = [];

  _findAbsolutePosition(element: HTMLElement) {
    var x: number = 0;
    var y: number = 0;
    var el: HTMLElement | null = element;
    for (; el != this.offsetParent; el = el.offsetParent as HTMLElement) {
      x += el.offsetLeft;
      y += el.offsetTop;
    }
    return {
      "x": x,
      "y": y
    };
  }

  /*
  _findAbsolutePosition(element: HTMLElement) {
    if (this.offsetParent === null)
      return undefined;

    const rect = element.getBoundingClientRect();
    const parent = this.offsetParent.getBoundingClientRect();
    return {
      "x": rect.left - parent.left,
      "y": rect.top - parent.top,
    };
  }
   */

  add(from: HTMLElement, to: HTMLElement) {
    let frompos = this._findAbsolutePosition(from);
    let topos = this._findAbsolutePosition(to);
    if (frompos === undefined || topos === undefined)
      return;

    let fromx = frompos.x + from.offsetWidth / 2;
    let fromy = frompos.y + from.offsetHeight / 2;
    let tox = topos.x + to.offsetWidth / 2;
    let toy = topos.y;
    this._connections = [...this._connections, { fromx, fromy, tox, toy}]
  }

  clear() {
    this._connections = [];
  }

  _path(connection: Connection) {
    var delta = (connection.toy-connection.fromy) * this._tension;
    var hx1 = connection.fromx;
    var hy1 = connection.fromy + delta;
    var hx2 = connection.tox;
    var hy2 = connection.toy - delta;
    return "M "  + connection.fromx + " " + connection.fromy +
      " C " + hx1 + " " + hy1
      + " "  + hx2 + " " + hy2
      + " " + connection.tox + " " + connection.toy;
  }

  static get styles() {
    // language=CSS
    return css`
        :host {
          z-index: 1;
          display: block;
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          pointer-events: none;
        }
      `;
  }

  render() {
    const parent = this.offsetParent as HTMLElement;
    console.log(this._connections)
    //language=SVG
    return svg`
      <svg style="position:absolute;left:0px;top:0px" width="${parent.clientWidth}" height="${parent.clientHeight}">
      <!--defs>
        <marker id="arrow" viewBox="0 0 8 8" refX="4" refY="4"
            markerUnits="strokeWidth" markerWidth="8"
            markerHeight="8" orient="auto">
            <path d="M 8 0 L 0 4 L 8 8 z"/>
        </marker>
      </defs-->
      <!--defs>
        <radialGradient id="gradient">
          <stop offset="0%" stop-color="#fbc02d" stop-opacity=".9"/>
          <stop offset="100%" stop-color="#fbc02d" stop-opacity=".3"/>
        </radialGradient>
      </defs-->
      ${this._connections.map(connection => svg`
        <circle cx="${connection.fromx}" cy="${connection.fromy}" r="7" fill="#fbc02d" stroke="none" />
        <circle cx="${connection.tox}" cy="${connection.toy}" r="5" fill="#fbc02d" stroke="none" />
        <path d="${this._path(connection)}" fill="none" stroke="#fbc02d" stroke-width="3" stroke-opacity=".9"/>
      `)}
      </svg>
    `;
  }
}
