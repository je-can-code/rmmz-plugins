//region RPG_Enemy
/**
 * Extends {@link #initMembers}.<br/>
 * Also initializes the extra drops.
 */
J.DROPS.Aliased.Game_Enemy.set("initMembers", RPG_Enemy.prototype.initMembers);
RPG_Enemy.prototype.initMembers = function(enemy)
{
  // perform original logic.
  J.DROPS.Aliased.Game_Enemy.get("initMembers")
    .call(this, enemy);

  // also parse our extra drops into the drop items list.
  this.initExtraDrops();
};

/**
 * Parses the extra drops on the enemy and adds them into the collection.
 */
RPG_Enemy.prototype.initExtraDrops = function()
{
  // if the enemy is null or something, just nix it.
  if (this === null)
  {
    throw new Error('we initialized extra drops for a null enemy, oops.');
  }

  // get the drops found on this enemy.
  const moreDrops = RPGManager.getArraysFromNotesByRegex(this, J.DROPS.RegExp.ExtraDrop, true) ?? [];

  // if there are no more drops, then skip processing.
  if (moreDrops.length === 0) return;

  // a mapping function to build proper drop items from the arrays.
  const mapper = drop =>
  {
    // deconstruct the array into drop properties.
    const [ dropType, dropId, chance ] = drop;

    // build the new drop item.
    return new RPG_DropItemBuilder()
      .setType(RPG_DropItem.TypeFromLetter(dropType))
      .setId(dropId)
      .setChance(chance)
      .build();
  };

  // map the converted drops.
  const convertedDrops = moreDrops
    .map(mapper, this);

  // return the found extra drops.
  this.dropItems.push(...convertedDrops);
};

/**
 * Gets the list of original drop items from the enemy in the database.
 *
 * This double-checks the actual drop items associated with an enemy in the
 * database as you can have invalid drop items if you set a drop up with a
 * denominator, but then changed your mind and flipped the drop type to "None".
 * @returns {RPG_DropItem[]}
 */
RPG_Enemy.prototype.originalDropItems = function()
{
  return this.dropItems
    .filter(this.validDropItemFilter, this);
};

/**
 * Determines whether or not a drop item is a valid drop.
 * @param {RPG_DropItem} dropItem The potential drop to check.
 * @returns {boolean} True if the drop is valid, false otherwise.
 */
RPG_Enemy.prototype.validDropItemFilter = function(dropItem)
{
  // if the drop item itself is falsey, it is not valid.
  if (!dropItem) return false;

  // if the drop item lacks an id or drop type, it is not valid.
  if (!dropItem.dataId || !dropItem.kind) return false;

  // the item is valid!
  return true;
};
//endregion RPG_Enemy