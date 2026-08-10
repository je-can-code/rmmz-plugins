//region Window_EquipItem
/**
 * Extends the `.initialize()` to include tracking for the more equip data window.
 */
J.CMS.EXT.EQUIP.Aliased.Window_EquipItem.set('initialize', Window_EquipItem.prototype.initialize);
Window_EquipItem.prototype.initialize = function(rect)
{
  // perform original logic.
  J.CMS.EXT.EQUIP.Aliased.Window_EquipItem.get('initialize').call(this, rect);
  /**
   * The more data window to manipulate.
   * @type {Window_MoreEquipData}
   */
  this._moreDataWindow = null;
};

/**
 * Extends {@link #makeItemList}.<br/>
 * Orders the list by database id rather than by the datastore slot each row happens to occupy.
 *
 * A refined equip keeps the id of the thing it was refined from and only takes a new slot, so slot order
 * strands every refined copy in a block at the bottom of the list, far from the plain one it came from.
 * Ordering by id sits them together, which is how a player thinks of them - one weapon, several states of
 * it - and it makes two copies of the same equip adjacent instead of scattered.
 *
 * The empty row that means "take this slot off" is not an item and has no id, so it stays pinned last.
 */
J.CMS.EXT.EQUIP.Aliased.Window_EquipItem.set('makeItemList', Window_EquipItem.prototype.makeItemList);
Window_EquipItem.prototype.makeItemList = function()
{
  // perform original logic.
  J.CMS.EXT.EQUIP.Aliased.Window_EquipItem.get('makeItemList')
    .call(this);

  // sorted in place; the accessor hands back the same array the original logic just built.
  this.data()
    .sort((left, right) =>
    {
      // the unequip row is the one entry with nothing to compare; it belongs at the end either way.
      if (left === null) return 1;
      if (right === null) return -1;

      // a shared id means copies of one equip in differing states of refinement, and the slot orders
      // those - which puts the plain one ahead of everything refined from it.
      return (left.id - right.id) || (left._index() - right._index());
    });
};

/**
 * Refreshes the more data window.
 */
Window_EquipItem.prototype.refreshMoreData = function()
{
  this.onIndexChange();
};

/**
 * Updates the "more" window to point to the new index's item.
 */
Window_EquipItem.prototype.onIndexChange = function()
{
  this.moreDataWindow()
    .setItem(this.item());
};

/**
 * Associates the more equip data window to this one for observation.
 * @param {Window_MoreEquipData} moreDataWindow The window to attach to this.
 */
Window_EquipItem.prototype.setMoreDataWindow = function(moreDataWindow)
{
  this._moreDataWindow = moreDataWindow;
};

/**
 * Gets the more equip data window observing this one.
 * @returns {Window_MoreEquipData}
 */
Window_EquipItem.prototype.moreDataWindow = function()
{
  return this._moreDataWindow;
};
//endregion Window_EquipItem