//region Window_StatusStatList
import StatusStatListRow from './../_models/StatusStatListRow.js';

/**
 * A selectable list of stats (by long param id) that drives the breakdown panel.
 */
class Window_StatusStatList
  extends Window_Selectable
{
  /**
   * @param {Rectangle} rect The rectangle for this window.
   */
  constructor(rect)
  {
    // build base window first.
    super(rect);

    // finish initialization.
    this.initMembers();
  }

  //region init
  /**
   * Ensures namespaced storage exists for this window.
   */
  _root()
  {
    // ensure the namespace chain exists for this window’s state.
    this._j ||= {};
    this._j._cms_s ||= {};
    this._j._cms_s._status ||= {};
    this._j._cms_s._status._list ||= {
      /**
       * The actor whose stats are shown by this list.
       * @type {Game_Actor|null}
       */
      _actor: null,

      /**
       * The rows displayed by this list.
       * @type {StatusStatListRow[]}
       */
      _data: [],

      /**
       * Callback invoked after selection changes.
       * @type {function|null}
       */
      _onChange: null,
    };
  }

  /**
   * Initializes namespaced members.
   */
  initMembers()
  {
    // make sure we have the storage.
    this._root();
  }

  //endregion init

  //region accessors
  /**
   * Gets the bound actor.
   * @returns {Game_Actor|null}
   */
  getActor()
  {
    this._root();
    return this._j._cms_s._status._list._actor;
  }

  /**
   * Binds an actor and refreshes the list.
   * @param {Game_Actor} v The actor to bind.
   */
  setActor(v)
  {
    this._root();
    this._j._cms_s._status._list._actor = v;
    this.refresh();
    this.select(0);
    this.callChangeHandler();
  }

  /**
   * Gets all rows.
   * @returns {StatusStatListRow[]}
   */
  getData()
  {
    this._root();
    return this._j._cms_s._status._list._data;
  }

  /**
   * Replaces all rows.
   * @param {StatusStatListRow[]} v The rows to assign.
   */
  setData(v)
  {
    this._root();
    this._j._cms_s._status._list._data = v;
  }

  /**
   * Gets the selection-change callback.
   * @returns {function|null}
   */
  getChangeHandler()
  {
    this._root();
    return this._j._cms_s._status._list._onChange;
  }

  /**
   * Sets the selection-change callback.
   * @param {function|null} fn The callback.
   */
  setChangeHandler(fn)
  {
    this._root();
    this._j._cms_s._status._list._onChange = fn;
  }

  //endregion accessors

  //region core overrides
  /**
   * Gets the number of rows.
   * @returns {number}
   */
  maxItems()
  {
    return this.getData().length;
  }

  /**
   * Gets a row by index.
   * @param {number} index The index.
   * @returns {StatusStatListRow}
   */
  itemAt(index)
  {
    return this.getData()[index];
  }

  /**
   * Gets the selected row.
   * @returns {StatusStatListRow}
   */
  currentItem()
  {
    return this.itemAt(this.index());
  }

  /**
   * Gets the selected long parameter id (or 0 if none).
   * @returns {number}
   */
  currentLongParamId()
  {
    /** @type {StatusStatListRow} */
    const row = this.currentItem();
    return row
      ? row.longParamId
      : 0;
  }

  /**
   * Changes selection and invokes the change callback.
   * @param {number} index The new index.
   */
  select(index)
  {
    // perform original logic.
    super.select(index);

    // notify listeners when the selection changes.
    this.callChangeHandler();
  }

  //endregion core overrides

  //region building
  /**
   * Rebuilds rows and redraws the window.
   */
  refresh()
  {
    // clear existing.
    this.contents.clear();

    // rebuild rows and allocate contents.
    this.buildData();
    this.createContents();

    // draw everything.
    this.drawAllItems();
  }

  /**
   * Populates rows grouped by parameter section.
   */
  buildData()
  {
    // Assemble rows that mirror page 1’s visual layout and reading order.
    /** @type {StatusStatListRow[]} */
    const rows = [];

    // Define groups in the same order as drawn on page 1.
    // Page 1 order: Row1 (Combat, Vitality), Row2 (Precision, Defensive), Row3 (Mobility, Fate).
    const groups = [
      // Row 1
      {
        section: 'Combat',
        ids: [ 2, 4, 14, 13 ], // ATK, MAT, CNT, MRF
      },
      {
        section: 'Vitality',
        ids: [ 0, 15, 1, 16, 30, 17, 20, 21 ], // MHP, HRG, MMP, MRG, MTP, TRG, REC, PHA
      },

      // Row 2
      {
        section: 'Precision',
        ids: [ 8, 19, 6, 9, 10, 11, 28, 29 ], // HIT, GRD, AGI, EVA, CRI, CEV, CDM, CDR
      },
      {
        section: 'Defensive',
        ids: [ 3, 5, 24, 25 ], // DEF, MDF, PDR, MDR
      },

      // Row 3
      {
        section: 'Mobility',
        ids: [ 31 ], // MSB (custom: move speed boost)
      },
      {
        section: 'Fate',
        ids: [ 7, 27, 32, 33 ], // LUK, EXR, SPB (skill prof boost), SMB (SDP multiplier bonus)
      },
    ];

    // Flatten the groups into concrete list rows in the defined order.
    groups.forEach(group =>
    {
      group.ids.forEach(longId =>
      {
        // Preserve the section label (unused visually today, but handy later).
        rows.push(new StatusStatListRow(group.section, longId));
      });
    });

    // Commit the rows to the window.
    this.setData(rows);
  }

  //endregion building

  //region drawing
  /**
   * Draws a single row (icon + name).
   * @param {number} index The row index.
   */
  drawItem(index)
  {
    // get rect and row.
    const rect = this.itemRectWithPadding(index);
    const row = this.itemAt(index);

    // collect display attributes.
    const longId = row.longParamId;
    const name = TextManager.longParam(longId);
    const icon = IconManager.longParam(longId);
    const color = ColorManager.longParam(longId);

    // draw icon + name.
    this.changeTextColor(ColorManager.textColor(color));
    this.drawIcon(icon, rect.x, rect.y + 2);
    this.drawText(name, rect.x + 36, rect.y, rect.width - 36, 'left');
    this.resetTextColor();
  }

  //endregion drawing

  //region helpers
  /**
   * Invokes the selection-change callback if assigned.
   */
  callChangeHandler()
  {
    // invoke change handler if assigned.
    const handler = this.getChangeHandler();
    if (handler)
    {
      handler();
    }
  }

  //endregion helpers
}

export default Window_StatusStatList;
//endregion Window_StatusStatList