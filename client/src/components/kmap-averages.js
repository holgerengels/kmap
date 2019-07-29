import {LitElement, html, css} from 'lit-element';
import {connect} from "pwa-helpers/connect-mixin";
import {store} from "../store";
import {fontStyles, colorStyles} from "./kmap-styles";
import {fetchAverageStateIfNeeded, forgetAverageState} from "../actions/average-states";

class KMapAverages extends connect(store)(LitElement) {

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

  render() {
    return html`
    <kmap-course-selector></kmap-course-selector>
    `;
  }

  static get properties() {
    return {
      _userid: {type: String},
      _layers: {type: Array},
      _subject: {type: String},
      _selectedCourse: {type: String},
    };
  }

  constructor() {
    super();
    this._userid = '';
    this._layers = [];
    this._subject = '';
    this._selectedCourse = '';
  }

  updated(changedProps) {
    if (changedProps.has("_userid") && !this._userid) {
      store.dispatch(forgetAverageState(this._subject, this._selectedCourse));
    }

    if (changedProps.has("_selectedCourse") && !this._selectedCourse) {
      store.dispatch(forgetAverageState(this._subject, this._selectedCourse));
    }

    if (this._userid && this._layers.includes("averages") && (changedProps.has("_userid") || changedProps.has("_subject") || changedProps.has("_selectedCourse"))) {
      store.dispatch(fetchAverageStateIfNeeded(this._subject, this._selectedCourse));
    }
  }

  stateChanged(state) {
    this._userid = state.app.userid;
    this._layers = state.app.layers;
    this._subject = state.maps.map ? state.maps.map.subject : '';
    this._selectedCourse = state.courses.selectedCourse;
  }
}

window.customElements.define('kmap-averages', KMapAverages);
