//region Window_FilterableList
import FilterCycle from './../models/FilterCycle.js';

/**
 * A command list narrowed by two independent filters: the tab the player is cycling with L2/R2, and an
 * on/off toggle that hides rows they cannot act on.
 *
 * The two axes are genuinely independent and both are needed. The tab answers "which family of things am I
 * looking at", the toggle answers "and only the ones I can do something with right now"- a maxed SDP panel
 * and an uncraftable recipe are the same idea wearing different words.
 *
 * Subclasses supply the policy and never override {@link #makeCommandList}. The pipeline is fixed on
 * purpose: filter the source, then sort, then build one command per surviving row. Building commands first
 * and discarding them afterwards- which is how one of the two lists this replaces did it- pays to construct
 * rows nobody sees, and forces a null return out of a builder whose whole job is to return a command.
 */
class Window_FilterableList
  extends Window_Command
{
  /**
   * Implements {@link Window_Command.initMembers}.<br/>
   * Seeds both filters.
   *
   * These cannot be class field declarations, and they cannot live in a constructor body either:
   * `Window_Command.initialize` ends by refreshing, refreshing calls `makeCommandList`, and that reads both
   * of these. Anything assigned after `super()` returns is assigned too late to be seen by the first build.
   */
  initMembers()
  {
    /**
     * The key of the tab currently selected.
     * @type {string}
     */
    this._filterKey = this.initialFilterKey();

    /**
     * Whether rows the player cannot act on are hidden.
     * @type {boolean}
     */
    this._actionableOnly = false;
  }

  /**
   * The tab a freshly built list starts on, before any scene has pointed it anywhere.
   *
   * {@link FilterCycle.ALL} suits a list that holds everything and narrows it, because showing everything
   * is the honest answer to "no tab chosen yet". A list whose source is a keyed query wants the opposite
   * and should override this: asking its provider for the everything-sentinel would be asking for a
   * category that does not exist.
   * @returns {string}
   */
  initialFilterKey()
  {
    return FilterCycle.ALL;
  }

  /**
   * The key of the tab currently selected.
   * @returns {string}
   */
  filterKey()
  {
    return this._filterKey;
  }

  /**
   * Sets the tab and rebuilds the list.
   * @param {string} filterKey The filter key driving this step.
   */
  setFilterKey(filterKey)
  {
    // nothing to rebuild when the value has not changed.
    if (this._filterKey === filterKey) return;

    this._filterKey = filterKey;
    this.refresh();
  }

  /**
   * Whether rows the player cannot act on are currently hidden.
   * @returns {boolean}
   */
  isActionableOnly()
  {
    return this._actionableOnly;
  }

  /**
   * Flips the actionable-only filter and rebuilds the list.
   *
   * The rebuild is the whole point. A setter that flips its flag and returns leaves the player looking at
   * rows that no longer answer the filter they just asked for, and because a command list is only rebuilt on
   * refresh, nothing else will notice until some unrelated action happens to refresh it.
   */
  toggleActionableOnly()
  {
    this._actionableOnly = !this._actionableOnly;
    this.refresh();
  }

  /**
   * Implements {@link Window_Command.makeCommandList}.<br/>
   * Filters, orders, and builds the rows.
   */
  makeCommandList()
  {
    this.buildCommands()
      .forEach(this.addBuiltCommand, this);
  }

  /**
   * Narrows the source down to the rows that survive both filters, in display order.
   * @returns {BuiltWindowCommand[]}
   */
  buildCommands()
  {
    const filterKey = this.filterKey();

    return this.sourceItems()
      .filter(item => this.matchesFilter(item, filterKey))
      .filter(item => this.isVisibleUnderActionableFilter(item))
      // `compareItems` defaults to a tie, and `Array.prototype.sort` has been specified stable since
      // ES2019- so a subclass that does not care about order keeps the source's order exactly.
      .sort((left, right) => this.compareItems(left, right))
      .map(this.buildCommand, this);
  }

  /**
   * Whether a row survives the actionable-only toggle.
   * @param {*} item The item driving this step.
   * @returns {boolean}
   */
  isVisibleUnderActionableFilter(item)
  {
    if (this.isActionableOnly() === false) return true;

    return this.isActionable(item);
  }

  /**
   * The unfiltered list of things this window could show.
   * Subclasses answer with their own domain objects.
   * @returns {*[]}
   */
  sourceItems()
  {
    return [];
  }

  /**
   * Whether a row belongs under the active tab.
   * Subclasses that only ever show one tab leave this alone.
   * @param {*} _item The item driving this step.
   * @param {string} _filterKey The active tab's key.
   * @returns {boolean}
   */
  matchesFilter(_item, _filterKey)
  {
    return true;
  }

  /**
   * Whether the player can still do something with this row- rank it up, cook it, buy it.
   * Subclasses that have no such notion leave this alone and the toggle becomes a no-op for them.
   * @param {*} _item The item driving this step.
   * @returns {boolean}
   */
  isActionable(_item)
  {
    return true;
  }

  /**
   * Orders two rows against each other, as {@link Array.prototype.sort} expects.
   * The default ties every pair, which preserves the source's own order.
   * @param {*} _left The first item driving this step.
   * @param {*} _right The second item driving this step.
   * @returns {number}
   */
  compareItems(_left, _right)
  {
    return 0;
  }

  /**
   * Builds the command representing a single row.
   * @param {*} _item The item driving this step.
   * @returns {BuiltWindowCommand}
   */
  buildCommand(_item)
  {
    throw new Error('A Window_FilterableList must implement buildCommand.');
  }

  /**
   * What to say when the list has nothing in it, since an empty frame reads as one that failed to draw.
   * Answer {@link String.empty} to stay silent.
   * @returns {string}
   */
  emptyListText()
  {
    return 'Nothing here.';
  }

  /**
   * Overwrites {@link Window_Selectable.drawAllItems}.<br/>
   * Explains an empty list rather than presenting a blank frame.
   * @override
   */
  drawAllItems()
  {
    if (this.maxItems() > 0)
    {
      Window_Command.prototype.drawAllItems.call(this);
      return;
    }

    const message = this.emptyListText();

    // a list that would rather say nothing gets to say nothing.
    if (message === String.empty) return;

    this.resetFontSettings();
    this.changeTextColor(ColorManager.systemColor());
    this.drawText(message, 0, 0, this.innerWidth, Window_Base.TextAlignments.Center);
  }
}

export default Window_FilterableList;
//endregion Window_FilterableList