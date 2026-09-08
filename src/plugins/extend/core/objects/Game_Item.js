//region Game_Item
/**
 * Extends {@link #initMembers}.<br/>
 * Also declares the underlying object, at its resting value.
 *
 * The default lives here rather than in the `initialize` alias below so that a decode establishes it
 * too - the hook is the only one of the two a savefile can run.
 */
J.EXTEND.Aliased.Game_Item.set('initMembers', Game_Item.prototype.initMembers);
Game_Item.prototype.initMembers = function()
{
  // perform original logic.
  J.EXTEND.Aliased.Game_Item.get('initMembers')
    .call(this);

  /**
   * The underlying object associated with this item.
   * @type {RPG_EquipItem|RPG_UsableItem}
   */
  this._item = null;
};

/**
 * Extends `initialize()` to include our update of assigning the item.
 *
 * Only the *mapping* is here; the default is in {@link #initMembers} above. An extended skill is not
 * in the database, so the object it wraps has to be carried in rather than looked up.
 */
J.EXTEND.Aliased.Game_Item.set('initialize', Game_Item.prototype.initialize);
Game_Item.prototype.initialize = function(item)
{
  // perform original logic, which runs initMembers and establishes the default.
  J.EXTEND.Aliased.Game_Item.get('initialize')
    .call(this, item);

  // only an item actually handed in overrides that default.
  if (item)
  {
    this._item = item;
  }
};

/**
 * Gets the underlying object for this `Game_Item`.
 * Normally this can be retrieved by using {@link Game_Item.object}, but that function limits
 * the possibility of retrieval to only stuff in the database, which extended skills will
 * not be in the database.
 */
Game_Item.prototype.underlyingObject = function()
{
  return this._item;
};

/**
 * Sets the underlying object this item carries.
 *
 * Only ever handed something the database does not contain; a row the engine can look up by id is
 * left uncarried on purpose. See {@link Game_Item.carryWhenSynthetic} for why.
 * @param {RPG_UsableItem|RPG_EquipItem} obj The object to carry, or null to carry nothing.
 */
Game_Item.prototype.setItem = function(obj)
{
  this._item = obj;
};

/**
 * Carries the given object only when its database does not already hold it at its own id.
 *
 * A row the database holds is reachable by id, so it stays a data class plus an id- which is what
 * keeps a savefile referencing a row rather than freezing a copy of one that will never see a
 * rebalance, with nothing reporting that it didn't. Anything else was synthesized (an overlay-merged
 * skill, almost always) and exists nowhere the engine can look it up, so this wrapper is the only
 * thing that can hold onto it.
 *
 * Clearing on a real row matters as much as carrying on a synthetic one. The wrapper outlives any
 * single binding, so a carry left behind by a previous skill would answer for the next one bound
 * here- silently handing back a skill nobody asked for.
 * @param {RPG_UsableItem} obj The object being bound to this wrapper.
 * @param {RPG_UsableItem[]} database The database that would hold it, if it came from one.
 */
Game_Item.prototype.carryWhenSynthetic = function(obj, database)
{
  // the database's own row needs nothing carried, and any carry left from a prior binding must go.
  if (database[obj.id] === obj)
  {
    this.setItem(null);
    return;
  }

  // nothing can look this one up by id, so the wrapper has to hold it directly.
  this.setItem(obj);
};

/**
 * Extends `setObject()` to enable setting custom skills and items.
 *
 * Only an object the database does not contain is carried; everything else stays a data class plus
 * an id. Whether a row came from the database is a question of provenance rather than of type- a
 * merged clone is every bit as much an {@link RPG_Skill} as the row it was cloned from- so that
 * question is asked of the database itself in {@link Game_Item.carryWhenSynthetic}. The type
 * predicates here decide only which database is the one worth asking.
 * @param {RPG_UsableItem|RPG_EquipItem} obj The database row or custom object being bound.
 */
J.EXTEND.Aliased.Game_Item.set('setObject', Game_Item.prototype.setObject);
Game_Item.prototype.setObject = function(obj)
{
  // perform original logic.
  J.EXTEND.Aliased.Game_Item.get('setObject')
    .call(this, obj);

  // check to make sure we have something to work with.
  if (!obj) return;

  // a skill is measured against the skill database.
  if (obj.isSkill())
  {
    // assign the data.
    this.setDataClass('skill');
    this.carryWhenSynthetic(obj, $dataSkills);
  }
  // an item is measured against the item database.
  else if (obj.isItem())
  {
    // assign the data.
    this.setDataClass('item');
    this.carryWhenSynthetic(obj, $dataItems);
  }
};

/**
 * Extends this function to return the underlying custom object (like an extended skill)
 * if it was assigned.
 */
J.EXTEND.Aliased.Game_Item.set('object', Game_Item.prototype.object);
Game_Item.prototype.object = function()
{
  // if we have a custom object to return, return that.
  if (this._item)
  {
    return this._item;
  }

  // perform original logic.
  return J.EXTEND.Aliased.Game_Item.get('object')
    .call(this);
};
//endregion Game_Item