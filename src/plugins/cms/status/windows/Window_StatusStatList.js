//region Window_StatusStatList
import StatusStatListRow from './../_models/StatusStatListRow.js';
import Window_StatusParameters from './Window_StatusParameters.js';

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
    // policy step inside  root.
    this._j._cms_s._status._list ||= {
      /**
       * The actor whose stats are shown by this list.
       // policy step inside  root.
       * @type {Game_Actor|null}
       */
      _actor: null,

      // policy step inside  root.
      /**
       * The rows displayed by this list.
       * @type {StatusStatListRow[]}
       */
      _data: [],

      // policy step inside  root.
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
    // policy step inside set actor.
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
   * Gets the selected parameter key (or empty when none).
   * @returns {string}
   */
  currentParameterKey()
  {
    /** @type {StatusStatListRow} */
    const row = this.currentItem();
    return row
      // policy step inside current parameter key.
      ? row.parameterKey
      : String.empty;
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

    // Walk the same row/column slots page 1 uses so both views stay in sync.
    Window_StatusParameters.PAGE_GROUP_ROW_GROUPS.forEach(rowGroups =>
    {
      rowGroups.forEach(groupId =>
      {
        const chrome = Window_StatusParameters.GROUP_CHROME[groupId];
        const definitions = ParameterRegistry.byGroup(groupId);

        // when not chrome  or  not definitions.length, take this branch.
        if (!chrome || !definitions.length)
        {
          return;
        }

        // policy step inside build data.
        definitions.forEach(definition =>
        {
          rows.push(new StatusStatListRow(chrome.title, definition.key));
        });
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
    const { parameterKey } = row;
    const name = TextManager.parameterLabel(parameterKey);
    const icon = IconManager.parameterIcon(parameterKey);
    const color = ColorManager.parameterColor(parameterKey);

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