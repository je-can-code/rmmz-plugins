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
     * The working list of deduplicated passive state entries matching the current filter.
     * Each entry is { state: RPG_State, count: number }, or null for the empty sentinel.
     * @type {Array<{state: RPG_State, count: number}|null>}
     */
    this._data = [];
  }
  //endregion init

  //region accessors
  /**
   * Gets the actor whose passives are being displayed.
   * @returns {Game_Actor|null}
   */
  getActor()
  {
    return this._actor;
  }

  /**
   * Sets the actor and rebuilds the list.
   * @param {Game_Actor} actor The actor whose passives to display.
   */
  setActor(actor)
  {
    this._actor = actor;
    this.refresh();
  }

  /**
   * Gets the active tab filter function.
   * @returns {Function|null}
   */
  getTabFilter()
  {
    return this._tabFilter;
  }

  /**
   * Sets the active tab filter and rebuilds the list.
   * @param {Function|null} filter A function(stateId, actor) => boolean, or null for no filter.
   */
  setTabFilter(filter)
  {
    this._tabFilter = filter;
    this.refresh();
  }

  /**
   * Gets the working data list.
   * @returns {Array<{state: RPG_State, count: number}|null>}
   */
  getData()
  {
    return this._data;
  }

  /**
   * Replaces the working data list.
   * @param {Array<{state: RPG_State, count: number}|null>} data
   */
  setData(data)
  {
    this._data = data;
  }
  //endregion accessors

  //region list data
  /**
   * Gets the total number of items in the filtered list.
   * @returns {number}
   */
  maxItems()
  {
    return this.getData().length;
  }

  /**
   * Rebuilds the filtered working list from the actor's current passive states.
   */
  makeItemList()
  {
    // cannot build a list without an actor.
    if (this.getActor() === null)
    {
      this.setData([]);
      return;
    }

    // grab all passive states currently applied to this actor.
    const all = this.getActor().getPassiveStates();

    // drop implementation-only amplifiers; they still contribute traits via the passive pipeline.
    let visible = all.filter(state => state.hideFromPassiveList === false);

    // apply the tab filter; only keep states the filter claims for this tab.
    if (this.getTabFilter() !== null)
    {
      visible = visible.filter(state => this.getTabFilter()(state.id, this.getActor()));
    }

    // deduplicate by state id, tracking how many times each appears.
    const countById = new Map();
    for (const state of visible)
    {
      const existing = countById.get(state.id);
      countById.set(state.id, (existing === undefined ? 0 : existing) + 1);
    }

    const seen = new Set();
    const data = [];
    for (const state of visible)
    {
      if (seen.has(state.id) === true) continue;
      seen.add(state.id);
      data.push({ state, count: countById.get(state.id) });
    }

    // always guarantee at least one row so the cursor has somewhere to land.
    if (data.length === 0)
    {
      // push a null sentinel; drawItem renders this as a dimmed placeholder.
      data.push(null);
    }

    this.setData(data);
  }

  /**
   * Gets the passive state at the current index.
   * @returns {RPG_State|null}
   */
  currentPassiveState()
  {
    const entry = this.getData()[this.index()];

    // two distinct absences, both meaning "nothing is highlighted", and both needing to be named
    // rather than lumped into a falsy check. `undefined` is an index outside the data, which is what a
    // deselected list reports when it hands back -1. `null` is the sentinel this window seeds at index
    // zero when the active tab's filter matched nothing, and which drawItem renders as a placeholder.
    // Neither is a state, and reaching for `.state` on either throws.
    if (entry === undefined || entry === null) return null;

    return entry.state;
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
    // grab the entry at this index.
    const entry = this.getData()[index];

    // get the usable rectangle for this row.
    const rect = this.itemLineRect(index);

    // render the null sentinel as a dimmed informational placeholder.
    if (entry === null)
    {
      this.changeTextColor(ColorManager.textColor(8));
      this.drawText('No passives.', rect.x, rect.y, rect.width);
      this.resetTextColor();
      return;
    }

    const { state, count } = entry;

    // draw the state icon at the left edge.
    this.drawIcon(state.iconIndex, rect.x, rect.y);

    // draw the state name beside the icon.
    const nameX = rect.x + ImageManager.iconWidth + 4;
    const nameWidth = rect.width - ImageManager.iconWidth - 4;
    this.drawText(state.name, nameX, rect.y, nameWidth);

    // draw a stack counter on the right when the state appears more than once.
    if (count > 1)
    {
      this.changeTextColor(ColorManager.textColor(6));
      this.drawText(`×${count}`, nameX, rect.y, nameWidth, 'right');
      this.resetTextColor();
    }
  }
  //endregion draw
}

export default Window_PassiveList;
//endregion Window_PassiveList
