import {LitElement, html, css} from 'lit-element';
import {connect} from "pwa-helpers/connect-mixin";
import {store} from "../store";
import {fontStyles, colorStyles} from "./kmap-styles";
import {fetchStateIfNeeded, forgetState} from "../actions/states";

class KMapSummaries extends connect(store)(LitElement) {

  static get styles() {
    // language=CSS
    return [
      fontStyles,
      colorStyles,
      css`
        :host {
          display: contents;
        }`];
  }

  static get properties() {
    return {
      _userid: {type: String},
      _layers: {type: Array},
      _subject: {type: String},
    };
  }

  constructor() {
    super();
    this._userid = '';
    this._layers = [];
    this._subject = '';
  }

  updated(changedProps) {
    if (changedProps.has("_userid") && !this._userid) {
      store.dispatch(forgetState(this._subject));
    }

    if (this._userid) {
      if (this._layers.includes("summaries")) {
        if (changedProps.has("_userid") || changedProps.has("_subject")) {
          store.dispatch(fetchStateIfNeeded(this._subject));
        }
      }
    }
  }

  stateChanged(state) {
    this._userid = state.app.userid;
    this._layers = state.app.layers;
    this._subject = state.maps.map ? state.maps.map.subject : '';
  }
}

window.customElements.define('kmap-summaries', KMapSummaries);
