//region Window_ItemList
/**
 * Gets the rows this list is currently displaying.
 *
 * Vanilla builds `_data` in {@link #makeItemList} and then reads the field directly from half a dozen
 * places. Anything extending one of those - reordering the rows, filtering them, appending to them -
 * needs a way in that is not a reach into storage it does not own, and every J-owned list window already
 * carries this same pair.
 * @returns {(RPG_BaseItem|null)[]}
 */
Window_ItemList.prototype.data = function()
{
  return this._data;
};

/**
 * Sets the rows this list displays.
 * @param {(RPG_BaseItem|null)[]} newData The rows to display.
 */
Window_ItemList.prototype.setData = function(newData)
{
  this._data = newData;
};
//endregion Window_ItemList