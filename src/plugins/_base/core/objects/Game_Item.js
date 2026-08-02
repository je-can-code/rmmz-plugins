//region Game_Item
/**
 * Extends {@link Game_Item.initialize}.<br/>
 * Also runs the member-initialization hook every plugin hangs its own state off.
 */
J.BASE.Aliased.Game_Item.set('initialize', Game_Item.prototype.initialize);
Game_Item.prototype.initialize = function(item)
{
  // perform original logic.
  J.BASE.Aliased.Game_Item.get('initialize')
    .call(this, item);

  // initialize our class members.
  this.initMembers();
};

/**
 * A hook for initializing additional members in {@link Game_Item}.<br>
 *
 * Note that this takes no arguments while `initialize` takes the item being wrapped. That split is
 * the point: a decode has a savefile, not a constructor argument, so the hook is only ever a
 * *defaulter*. Anything a plugin derives from the argument belongs in an `initialize` alias, and
 * whatever that field's resting value is belongs here.
 *
 * **Plugins adding state to a game item alias this, not `initialize`.**
 */
Game_Item.prototype.initMembers = function()
{
};
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
