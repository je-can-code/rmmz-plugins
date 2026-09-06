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
 * left uncarried on purpose. See {@link Game_Item.setObject} for why.
 * @param {RPG_UsableItem|RPG_EquipItem} obj The object to carry.
 */
Game_Item.prototype.setItem = function(obj)
{
  this._item = obj;
};

/**
 * Extends `setObject()` to enable setting custom skills and items.
 *
 * Only an object the database does not contain is carried. The engine's own `setObject` names a data
 * class by identity against `$dataSkills` and friends, so an empty class after it runs is precisely
 * the statement "this row is not in the database" - which is the only case that needs carrying, and
 * the case this extension exists for. Everything else stays a class plus an id, which is what keeps
 * a savefile holding a reference to a row rather than a frozen copy of one: a copy never sees a
 * rebalance, and nothing reports that it didn't.
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

  // the engine recognized this row, so it is reachable by id and needs nothing carried.
  if (this.dataClass() !== String.empty) return;

  // check to ensure it has a skill category property.
  if (obj.hasOwnProperty('stypeId'))
  {
    // assign the data.
    this.setDataClass('skill');
    this.setItem(obj);
  }
  // check to ensure it has an item category property.
  else if (obj.hasOwnProperty('itypeId'))
  {
    // assign the data.
    this.setDataClass('item');
    this.setItem(obj);
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