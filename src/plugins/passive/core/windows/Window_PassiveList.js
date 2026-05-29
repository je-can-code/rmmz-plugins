//region Window_PassiveList
/**
 * A scrollable list of passive states currently applied to the viewed actor.
 * The list is filtered by the active tab's filter function; null means show all.
 *
 * Tab cycling is handled via L2/R2 content handlers wired by {@link Scene_Passive}.
 */
class Window_PassiveList
  extends Window_Selectable
{
  /**
   * Constructor.
   * @param {Rectangle} rect The rectangle for this window.
   */
  constructor(rect)
  {
    // call super when having extended constructors.
    super(rect);

    // jumpstart initialization on creation.
    this.initialize(rect);
  }

  //region init
  /**
   * Initializes this window.
   * @param {Rectangle} rect The rectangle for this window.
   */
  initialize(rect)
  {
    // perform original logic.
    super.initialize(rect);

    /**
     * The actor whose passive states are being displayed.
     * @type {Game_Actor|null}
     */
    this._actor = null;

    /**
     * The filter function for the active tab.
     * When null, all passive states are shown.
     * @type {Function|null}
     */
    this._tabFilter = null;

    /**
     * The working list of passive states matching the current filter.
     * @type {RPG_State[]}
     */
    this._data = [];
  }
  //endregion init

  //region update
  /**
   * Updates the actor and rebuilds the list.
   * @param {Game_Actor} actor The actor whose passives to display.
   */
  setActor(actor)
  {
    this._actor = actor;
    this.refresh();
  }

  /**
   * Updates the active tab filter and rebuilds the list.
   * @param {Function|null} filter A function(stateId, actor) => boolean, or null for no filter.
   */
  setTabFilter(filter)
  {
    this._tabFilter = filter;
    this.refresh();
  }
  //endregion update

  //region list data
  /**
   * Gets the total number of items in the filtered list.
   * @returns {number}
   */
  maxItems()
  {
    return this._data.length;
  }

  /**
   * Rebuilds the filtered working list from the actor's current passive states.
   */
  makeItemList()
  {
    // cannot build a list without an actor.
    if (!this._actor)
    {
      this._data = [];
      return;
    }

    // grab all passive states currently applied to this actor.
    const all = this._actor.getPassiveStates();

    // if there is no filter, show every passive state.
    if (this._tabFilter === null)
    {
      this._data = all;
      return;
    }

    // apply the tab filter; only keep states the filter claims for this tab.
    this._data = all.filter(state => this._tabFilter(state.id, this._actor));

    // always guarantee at least one row so the cursor has somewhere to land.
    if (this._data.length === 0)
    {
      // push a null sentinel; drawItem renders this as a dimmed placeholder.
      this._data.push(null);
    }
  }

  /**
   * Gets the passive state at the current index.
   * @returns {RPG_State|null}
   */
  currentPassiveState()
  {
    return this._data[this.index()] ?? null;
  }
  //endregion list data

  //region draw
  /**
   * Rebuilds the item list and repaints all rows.
   */
  refresh()
  {
    // rebuild the data before painting.
    this.makeItemList();

    // perform original logic to repaint.
    super.refresh();
  }

  /**
   * Draws a single passive state row: icon followed by the state name.
   * A null entry renders as a dimmed "No passives." placeholder.
   * @param {number} index The row index to draw.
   */
  drawItem(index)
  {
    // grab the state at this index.
    const state = this._data[index];

    // get the usable rectangle for this row.
    const rect = this.itemLineRect(index);

    // render the null sentinel as a dimmed informational placeholder.
    if (!state)
    {
      this.changeTextColor(ColorManager.textColor(8));
      this.drawText('No passives.', rect.x, rect.y, rect.width);
      this.resetTextColor();
      return;
    }

    // draw the state icon at the left edge.
    this.drawIcon(state.iconIndex, rect.x, rect.y);

    // draw the state name beside the icon.
    this.drawText(state.name, rect.x + ImageManager.iconWidth + 4, rect.y, rect.width - ImageManager.iconWidth - 4);
  }
  //endregion draw

  //endregion input
}

export default Window_PassiveList;
//endregion Window_PassiveList