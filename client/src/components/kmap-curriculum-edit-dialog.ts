import {css, CSSResult, html} from 'lit';
import {customElement, property, query, state} from 'lit/decorators.js';
import {Connected} from "./connected";
import {State} from "../store";

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
export class KMapCurriculumEditDialog extends Connected {
  @state()
  private _tab: string = 'editor';

  @state()
  private _tempFirstCW: number = 38;
  @state()
  private _tempMaxCW: number = 52;
  @state()
  private _tempLastCW: number = 31;

  @state()
  private _firstCW: number = 38;
  @state()
  private _maxCW: number = 52;
  @state()
  private _lastCW: number = 31;

  @state()
  private _numCWeeks?: number;
  @state()
  private _numSWeeks?: number;
  @state()
  private _numHWeeks?: number;

  @state()
  private _curriculum?: Week[] = undefined;

  @state()
  private _selectedIndex: number = -1;
  @state()
  private _selectedWeek?: Week;

  @state()
  private _weekType: string = 'school';
  @state()
  private _weekCW: string = '';
  @state()
  private _weekSW: string = '';
  @state()
  private _weekTops: string = '';
  @state()
  private _weekHolidays: string = '';

  @property()
  // @ts-ignore
  private _weekValid: boolean = false;

  @query('#editDialog')
  private _editDialog: Dialog;
  @query('#tabBar')
  private _tabBar: TabBar;

  @state()
  private _valid: boolean = false;

  @state()
  private _menuIndex: number = -1;
  @query('#menu')
  private _menu: Menu;

  mapState(state: State) {
    return {
      _instance: state.app.instance,
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

  _adoptWeekLayout() {
    this._firstCW = this._tempFirstCW;
    this._lastCW = this._tempLastCW;
    this._maxCW = this._tempMaxCW;
  }

  edit(curriculum: string) {
    this._curriculum = curriculum ? JSON.parse(curriculum) : [  {
      "cw": 37,
      "sw": 0,
      "tops": [
        ["map", "Tools"],
        ["map", "Grundwissen"],
        ["map", "Mengenlehre"],
        ["map", "Terme"],
        ["map", "Gleichungen"],
        ["map", "Geraden"],
        ["map", "Parabeln"]
      ]
    },
      {
        "cw": 38,
        "sw": 1,
        "tops": [
        ]
      },
    ];
    if (!this._curriculum) return;

    this._firstCW = this._tempFirstCW = this._curriculum[1].cw;
    this._lastCW = this._tempLastCW = this._curriculum[this._curriculum.length-1].cw;
    let max = this._curriculum.map(w => parseInt(w.cw + "")).sort((a, b) => a - b).pop();
    if (max === undefined || max < 52)
      max = 52;
    this._maxCW = this._tempMaxCW = max || 52;

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

  // language=CSS
  static styles = [
    fontStyles,
    colorStyles,
    formStyles,
    cardStyles as CSSResult,
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
      .layout {
        display: flex;
        align-items: flex-start;
        gap: 8px;
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

  render() {
    // language=HTML
    return html`
<mwc-dialog id="editDialog" heading="Wochenplan Editor" @keydown="${this._captureKeys}" escapeKeyAction="">
  ${this._curriculum !== undefined ? html`
    <mwc-tab-bar id="tabBar" @MDCTabBar:activated="${this._switchTab}">
      <mwc-tab label="Editor"></mwc-tab>
      <mwc-tab label="Preview"></mwc-tab>
    </mwc-tab-bar>
    <div class="content" ?hidden="${this._tab === 'preview'}">
      <label>Kalenderwochen</label>
      <div class="layout">
        <mwc-textfield .value="${this._tempFirstCW}" label="von" type="number" min="1" max="53" step="1" helper="KW erste Schulwoche" helperPersistent @change="${e => this._tempFirstCW = parseInt(e.target.value)}"></mwc-textfield>
        <mwc-textfield .value="${this._tempMaxCW}" label="max" type="number" min="52" max="53" step="1" helper="Letze KW im Jahr (52 / 53)" helperPersistent @change="${e => this._tempMaxCW = parseInt(e.target.value)}"></mwc-textfield>
        <mwc-textfield .value="${this._tempLastCW}" label="bis" type="number" min="1" max="53" step="1" helper="KW letzte Schulwoche" helperPersistent @change="${e => this._tempLastCW = parseInt(e.target.value)}"></mwc-textfield>
        <label>→</label>
        <mwc-textfield .value="${this._numSWeeks}" label="Schulwochen" type="number" min="0" max="9999" step="1" disabled></mwc-textfield>
        <mwc-textfield .value="${this._numHWeeks}" label="Ferienwochen" type="number" min="0" max="9999" step="1" disabled></mwc-textfield>
        <mwc-button label="Anwenden" @click="${this._adoptWeekLayout}"/>
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
            <mwc-icon-button-toggle onIcon="school" offIcon="beach_access" ?on="${this._weekType === 'school'}" @icon-button-toggle-change="${e => this._weekType = e.detail.isOn ? 'school' : 'holidays'}" ?disabled="${this._weekType === 'preconds'}"></mwc-icon-button-toggle>
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
