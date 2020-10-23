import {css, customElement, html, LitElement, property, query} from 'lit-element';
import {connect} from '@captaincodeman/rdx';
import {State, store} from "../store";

import '@material/mwc-button';
import '@material/mwc-dialog';
import '@material/mwc-formfield';
import '@material/mwc-icon-button';
import '@material/mwc-icon-button-toggle';
import '@material/mwc-list/mwc-list-item';
import '@material/mwc-menu';
import '@material/mwc-select';
import '@material/mwc-slider';
import '@material/mwc-tab';
import '@material/mwc-tab-bar';
import '@material/mwc-textarea';
import '@material/mwc-textfield';
import './validating-form';
import {colorStyles, fontStyles, formStyles} from "./kmap-styles";
import {cardStyles} from "../mdc.card.css";

import {Week} from "../models/courses";
import {Dialog} from "@material/mwc-dialog/mwc-dialog";
import {Menu} from "@material/mwc-menu/mwc-menu";
import {TabBar} from "@material/mwc-tab-bar/mwc-tab-bar";

@customElement('kmap-curriculum-edit-dialog')
export class KMapCurriculumEditDialog extends connect(store, LitElement) {
  @property()
  private _tab: string = 'editor';

  @property()
  private _firstCW: number = 38;
  @property()
  private _maxCW: number = 52;
  @property()
  private _lastCW: number = 31;

  @property()
  private _numCWeeks?: number;
  @property()
  private _numSWeeks?: number;
  @property()
  private _numHWeeks?: number;

  @property()
  private _curriculum?: Week[] = undefined;

  @property()
  private _selectedIndex: number = -1;
  @property()
  private _selectedWeek?: Week;

  @property()
  private _weekType: string = 'school';
  @property()
  private _weekCW: string = '';
  @property()
  private _weekSW: string = '';
  @property()
  private _weekTops: string = '';
  @property()
  private _weekHolidays: string = '';

  @property()
  // @ts-ignore
  private _weekValid: boolean = false;

  @query('#editDialog')
  private _editDialog: Dialog;
  @query('#tabBar')
  private _tabBar: TabBar;

  @property()
  private _valid: boolean = false;

  @property()
  private _menuIndex: number = -1;
  @query('#menu')
  private _menu: Menu;

  mapState(state: State) {
    return {
      _instance: state.app.instance,
      _card: state.maps.cardForEdit,
      _uploads: state.uploads.uploads,
    };
  }

  updated(changedProperties) {
    if (changedProperties.has("_firstCW") || changedProperties.has("_maxCW") || changedProperties.has("_lastCW")) {
      this._selectedIndex = -1;

      this._numCWeeks = this._maxCW - this._firstCW + this._lastCW + 1;
      console.log("cws: " + this._numCWeeks);

      if (this._curriculum !== undefined) {
        const curr = [...this._curriculum];
        while (curr.length > this._numCWeeks + 1)
          curr.pop();
        while (curr.length < this._numCWeeks + 1)
          curr.push({cw: -1, tops: []});

        let cw = this._firstCW - 1;
        let sws = 0;
        let hws = 0;
        for (const week of curr) {
          if (cw > this._maxCW)
            cw = 1;
          week.cw = cw;
          cw++;
          if (week.sw)
            sws++;
          else
            hws++;
        }
        this._numSWeeks = sws;
        this._numHWeeks = hws;
        console.log("sws: " + sws);
        console.log("hws: " + hws);

        this._curriculum = curr;
      }
    }
    if (changedProperties.has('_selectedIndex')) {
      if (this._curriculum && this._selectedIndex !== -1)
        this._selectedWeek = this._curriculum[this._selectedIndex];
      else
        this._selectedWeek = undefined;

      if (this._selectedWeek !== undefined) {
        this._weekType = this._selectedWeek.sw === undefined ? 'holidays' : (this._selectedWeek.sw === 0 ? 'preconds' : 'school');
        this._weekCW = "" + this._selectedWeek.cw;
        this._weekSW = "" + (this._selectedWeek.sw !== undefined ? this._selectedWeek.sw : "");
        this._weekHolidays = this._weekType === 'holidays' ? this._selectedWeek.holidays || "": "";
        this._weekTops = this._weekType !== 'holidays' ? this._selectedWeek.tops?.map(t => t[0] + ": " + t[1]).join("\n") || "": "";
      }
      else {
        this._weekType = "";
        this._weekCW = "";
        this._weekSW = "";
        this._weekHolidays = "";
        this._weekTops = "";
      }
    }

    if (this._curriculum !== undefined && this._selectedIndex !== -1) {
      if (changedProperties.has("_weekCW"))
        this._curriculum[this._selectedIndex].cw = this._weekCW.match(/[0-9]{1,2}/) ? Number(this._weekCW) : 99;
      if (changedProperties.has("_weekSW") || changedProperties.has("_weekType"))
        this._curriculum[this._selectedIndex].sw = (this._weekType !== 'holidays' && this._weekSW.match(/[0-9]{1,2}/)) ? Number(this._weekSW) : undefined;
      if (changedProperties.has("_weekHolidays") || changedProperties.has("_weekType"))
        this._curriculum[this._selectedIndex].holidays = (this._weekType === 'holidays' && this._weekHolidays) ? this._weekHolidays : undefined;
      if (changedProperties.has("_weekTops") || changedProperties.has("_weekType")) {
        this._curriculum[this._selectedIndex].tops = (this._weekType !== 'holidays' && this._weekTops) ? this._weekTops.split(/\r?\n/).map(l => [l.split(":")[0].trim(), l.split(":")[1].trim()]) : [];
      }
    }
  }

  edit(curriculum: string) {
    this._curriculum = JSON.parse(curriculum);
    if (!this._curriculum) return;

    this._firstCW = this._curriculum[1].cw;
    this._lastCW = this._curriculum[this._curriculum.length-1].cw;
    this._maxCW = this._curriculum.map(w => w.cw).sort().pop() || 52;

    this._selectedIndex = -1;

    this._editDialog.show();
  }

  _save() {
    this._editDialog.close();
    if (!this._curriculum)
      return;

    this.dispatchEvent(new CustomEvent('edited', {bubbles: true, composed: true, detail: {curriculum: JSON.stringify(this._curriculum)}}));
  }

  _cancel() {
    this._editDialog.close();
  }

  _captureKeys(e) {
    if (!e.metaKey && e.key === "Enter")
      e.cancelBubble = true;

    if (e.key === "Escape") {
      e.cancelBubble = true;
      this._selectedIndex = -1;
    }
  }

  _switchTab(e) {
    if (e.type === "MDCTabBar:activated")
      this._tab = e.detail.index === 0 ? 'editor' : 'preview';
    else if (e.key === "p" && e.altKey === true)
      this._tabBar.activeIndex = this._tab === 'editor' ? 1 : 0;
  }

  _delete() {
    if (this._menuIndex == -1 || this._curriculum === undefined) return;

    console.log("delete " + this._menuIndex);
    console.log(this._curriculum);

    const curr = [...this._curriculum];
    const tops: string[][][] = [];
    for (let i = 0; i < curr.length; i++){
      let week = curr[i];
      if (i !== this._menuIndex && week.sw)
        tops.push(week.tops);
    }
    for (let i = 0, t=0; i < curr.length; i++) {
      let week = curr[i];
      if (week.sw) {
        week.tops = tops[t];
        t++;
      }
    }

    this._curriculum = curr;
    console.log(this._curriculum);

    if (this._menuIndex === this._selectedIndex)
      this._selectedIndex = -1;
  }

  _addBefore() {
    if (this._menuIndex == -1 || this._curriculum === undefined) return;

    console.log("add before " + this._menuIndex);
    console.log(this._curriculum);

    const curr = [...this._curriculum];
    const tops: string[][][] = [];
    for (let i = 0; i < curr.length; i++) {
      let week = curr[i];
      if (i === this._menuIndex)
        tops.push([])
      if (week.sw)
        tops.push(week.tops);
    }
    for (let i = 0, t=0; i < curr.length; i++) {
      let week = curr[i];
      if (week.sw) {
        week.tops = tops[t];
        t++;
      }
    }

    this._curriculum = curr;
    console.log(this._curriculum);

    if (this._menuIndex === this._selectedIndex)
      this._selectedIndex = -1;
  }

  static get styles() {
    // language=CSS
    return [
      fontStyles,
      colorStyles,
      formStyles,
      cardStyles,
      css`
        mwc-dialog {
          --mdc-dialog-min-width: 810px;
          --mdc-dialog-max-width: 810px;
        }
        mwc-icon-button, mwc-button {
          vertical-align: middle
        }
        mwc-textfield, mwc-textarea {
          margin-bottom: 4px;
        }
        .content {
          display: grid;
          grid-template-rows: auto 1fr;
        }
        .weeks {
          scroll-snap-type: y mandatory;
        }
        .mdc-card {
          scroll-snap-align: start;
          display: grid;
          margin: 8px 0px;
          padding: 12px;
        }
        [hidden] {
          display: none;
        }
        .week_editor {
          align-items: start
        }
        .week_editor[type=school], .week_editor[type=preconds] {
          grid-template-columns: 40px 50px 50px 1fr 40px;
        }
        .week_editor[type=holidays] {
          grid-template-columns: 40px 50px 1fr 40px;
        }
    `];
  }

  render() {
    // language=HTML
    return html`
<mwc-dialog id="editDialog" heading="Lernplan Editor" @keydown="${this._captureKeys}" escapeKeyAction="">
  ${this._curriculum !== undefined ? html`
    <mwc-tab-bar id="tabBar" @MDCTabBar:activated="${this._switchTab}">
      <mwc-tab label="Editor"></mwc-tab>
      <mwc-tab label="Preview"></mwc-tab>
    </mwc-tab-bar>
    <div class="content" ?hidden="${this._tab === 'preview'}">
      <div>
        <label>Kalenderwochen</label>
        <mwc-textfield .value="${this._firstCW}" label="von" type="number" min="1" max="53" step="1" @change="${e => this._firstCW = parseInt(e.target.value)}"></mwc-textfield>
        <mwc-textfield .value="${this._maxCW}" label="max" type="number" min="52" max="53" step="1" @change="${e => this._maxCW = parseInt(e.target.value)}"></mwc-textfield>
        <mwc-textfield .value="${this._lastCW}" label="bis" type="number" min="1" max="53" step="1" @change="${e => this._lastCW = parseInt(e.target.value)}"></mwc-textfield>
        <label>→</label>
        <mwc-textfield .value="${this._numSWeeks}" label="Schulwochen" type="number" min="0" max="9999" step="1" disabled></mwc-textfield>
        <mwc-textfield .value="${this._numHWeeks}" label="Ferienwochen" type="number" min="0" max="9999" step="1" disabled></mwc-textfield>
      </div>
      <div class="weeks">
        ${this._curriculum.map((week, i) => this._renderWeek(week, i))}
      </div>
    </div>
    <div class="content" ?hidden="${this._tab === 'editor'}">
      <kmap-timeline .curriculum="${this._curriculum}"></kmap-timeline>
    </div>

    <mwc-menu id="menu" absolute menuCorner="END">
      <mwc-list-item graphic="icon" @click="${this._delete}">
        <mwc-icon slot="graphic">delete</mwc-icon>
        <span>Löschen</span>
      </mwc-list-item>
      <mwc-list-item graphic="icon" @click="${this._addBefore}">
        <mwc-icon slot="graphic">expand_less</mwc-icon>
        <span>Einfügen</span>
      </mwc-list-item>
    </mwc-menu>

    <mwc-button slot="secondaryAction" @click=${this._cancel}>Abbrechen</mwc-button>
    <mwc-button ?ddisabled="${!this._valid}" slot="primaryAction" @click=${this._save}>Speichern</mwc-button>
  ` : ''}
</mwc-dialog>
    `;
  }

  _renderWeek(week: Week, i: number) {
    if (i === this._selectedIndex)
      return html`
        <validating-form id="topForm" @validity="${e => this._weekValid = e.target.valid}">
          <div class="form mdc-card week_editor" type="${this._weekType}">
            <mwc-icon-button-toggle onIcon="school" offIcon="beach_access" ?on="${this._weekType === 'school'}" @MDCIconButtonToggle:change="${e => this._weekType = e.detail.isOn ? 'school' : 'holidays'}" ?disabled="${this._weekType === 'preconds'}"></mwc-icon-button-toggle>
            <mwc-textfield id="cw" type="text" label="KW" .value="${this._weekCW}" @change="${e => this._weekCW = e.target.value}" ?disabled="${this._weekType === 'preconds'}"></mwc-textfield>
            <mwc-textfield id="sw" type="text" label="SW" ?hidden="${this._weekType === 'holidays'}" .value="${this._weekSW}" @change="${e => this._weekSW = e.target.value}"  ?disabled="${this._weekType === 'preconds'}"></mwc-textfield>
            <mwc-textarea id="tops" type="text" label="Tops" rows="3" ?hidden="${this._weekType === 'holidays'}" .value="${this._weekTops}" @change="${e => this._weekTops = e.target.value}"></mwc-textarea>
            <mwc-textfield id="holidays" type="text" label="Ferien" ?hidden="${this._weekType !== 'holidays'}" .value="${this._weekHolidays}" @change="${e => this._weekHolidays = e.target.value}"></mwc-textfield>
            <mwc-icon-button icon="more_vert" @click="${e => this._showMenu(i, e)}" ?disabled="${i === 0 || this._weekType === 'holidays'}"></mwc-icon-button>
          </div>
        </validating-form>
      `;
    if (week.sw === undefined)
      return html`
        <div class="form mdc-card" style="grid-template-columns: 1fr" @click="${() => this._selectedIndex = this._selectedIndex === i ? -1 : i}">
          <div>KW ${week.cw} ${week.holidays}</div>
        </div>
      `;
    else if (week.sw === 0)
      return html`
        <div class="form mdc-card" style="grid-template-columns: 102px 1fr" @click="${() => this._selectedIndex = this._selectedIndex === i ? -1 : i}">
          <div>Check-in</div>
          <div>
            ${week.tops?.map(t => html`<b>${t[0]}:</b> ${t[1]}<br/>`)}
          </div>
        </div>
      `;
    else
      return html`
        <div class="form mdc-card" style="grid-template-columns: 102px 1fr 40px" @click="${() => this._selectedIndex = this._selectedIndex === i ? -1 : i}">
          <div>KW ${week.cw} SW ${week.sw}</div>
          <div>
            ${week.tops?.map(t => html`<b>${t[0]}:</b> ${t[1]}<br/>`)}
          </div>
          <mwc-icon-button icon="more_vert" @click="${e => this._showMenu(i, e)}"></mwc-icon-button>
        </div>
      `;
  }

  _showMenu(index, e) {
    e.cancelBubble = true;
    this._menuIndex = index;
    this._menu.anchor = e.target;
    this._menu.show()
  }
}
