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

/**
 * Gets the object this item carries beyond the database, which is nothing until a plugin gives game items
 * something to carry.
 *
 * {@link Game_Actor.haveEquipsChanged} compares these to notice one carried object being swapped for another
 * under the same id. J-Base carries nothing, so every item answers alike and only ids and data classes
 * decide; J-Extend overrides this to hand back the overlay-merged row it carries.
 * @returns {RPG_EquipItem|RPG_UsableItem|null} The carried object, or null when nothing is carried.
 */
Game_Item.prototype.underlyingObject = function()
{
  return null;
};
//endregion Game_Item
