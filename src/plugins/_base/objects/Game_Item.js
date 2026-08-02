//region Game_Item
/**
 * Gets the data class of this item, describing which database this item is drawn from.
 * @returns {string} One of "skill", "item", "weapon", or "armor"- or empty when unassigned.
 */
Game_Item.prototype.dataClass = function()
{
  // return which database this item belongs to.
  return this._dataClass;
};

/**
 * Sets the data class of this item.
 * @param {string} newDataClass One of "skill", "item", "weapon", or "armor".
 */
Game_Item.prototype.setDataClass = function(newDataClass)
{
  // assign the database this item belongs to.
  this._dataClass = newDataClass;
};
//endregion Game_Item
