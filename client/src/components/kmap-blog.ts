import {html, css} from 'lit';
import {customElement, state} from 'lit/decorators.js';
import {Connected, store} from "./connected";
import {State} from "../store";

import './kmap-post-card';
import {resetStyles, colorStyles, fontStyles} from "./kmap-styles";
import {Card} from "../models/types";
import {property} from "lit/decorators.js";

@customElement('kmap-blog')
export class KMapBlog extends Connected {
  @property({reflect: true, type: Boolean})
  // @ts-ignore
  private wide: boolean = false;

  @state()
  private _posts?: Card[] = undefined;
  @state()
  private _selected?: Card;

  mapState(state: State) {
    return {
      wide: !state.shell.narrow,
      _posts: state.posts.posts,
      _selected: state.posts.posts ? state.posts.posts.find(c => c.topic === state.posts.current) : undefined,
    };
  }

  static get styles() {
    // language=CSS
    return [
      resetStyles,
      fontStyles,
      colorStyles,
      css`
        :host {
          display: grid;
          grid-template-columns: 1fr;
        }
        kmap-post-card {
          margin: 8px 0px;
        }
        :host([wide]) kmap-post-card {
          margin: 16px;
        }
      `];
  }

  render() {
    // language=HTML
    return html`
      ${this._posts ? html`
        ${this._selected ? html`
          <kmap-post-card .subject="Hilfe" .chapter="Blog" .card="${this._selected}" expanded></kmap-post-card>
        ` : html`
          ${this._posts.map((card) => html`
            <kmap-post-card @click="${this._click}" .subject="Hilfe" .chapter="Blog" .card="${card}"></kmap-post-card>
          `)}
        `}
      `: ''}
    `;
  }

  _click(e) {
    if (!this._posts) return;

    store.dispatch.routing.push('/app/blog/' + encodeURIComponent(e.target.card.topic));
  }
}
