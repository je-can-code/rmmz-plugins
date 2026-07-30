//region Window_EquipItem
/**
 * Extends the `.initialize()` to include tracking for the more equip data window.
 */
J.CMS_E.Aliased.Window_EquipItem.set('initialize', Window_EquipItem.prototype.initialize);
Window_EquipItem.prototype.initialize = function(rect)
{
  // perform original logic.
  J.CMS_E.Aliased.Window_EquipItem.get('initialize').call(this, rect);
  /**
   * The more data window to manipulate.
   * @type {Window_MoreEquipData}
   */
  this._moreDataWindow = null;
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