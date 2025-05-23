//region Game_Party
/**
 * Overrides {@link #gainItem}.<br>
 * Replaces item gain and management with index-based management instead.
 * @param {RPG_Item|RPG_Weapon|RPG_Armor} item The item to modify the quantity of.
 * @param {number} amount The amount to modify the quantity by.
 * @param {boolean} includeEquip Whether or not to include equipped items for equipment.
 */
Game_Party.prototype.gainItem = function(item, amount, includeEquip)
{
  // when items are unequipped, "null" is gained for some stupid fucking reason.
  if (!item)
  {
    // don't try to gain "null" because rm core devs don't know how to code.
    return;
  }

  // grab the container of items.S
  const container = this.itemContainer(item);

  // check to make sure we have a container.
  if (container)
  {
    // gain the item.
    this.processItemGain(item, amount, includeEquip);
  }
  // we didn't find a container for that item.
  else
  {
    // handle what happens when the item isn't one of the three main database objects.
    this.processContainerlessItemGain(item, amount, includeEquip);
  }
};

/**
 * Modifies the quantity of an item/weapon/armor.
 * @param {RPG_Item|RPG_Weapon|RPG_Armor} item The item to modify the quantity of.
 * @param {number} amount The amount to modify the quantity by.
 * @param {boolean} includeEquip Whether or not to include equipped items for equipment.
 */
Game_Party.prototype.processItemGain = function(item, amount, includeEquip)
{
  // grab the item/weapon/armor container.
  const container = this.itemContainer(item);

  // identify the last amount we previously had.
  const lastNumber = this.numItems(item);

  // add the new value to the previous.
  const newNumber = lastNumber + amount;

  // get the key for this item.
  const itemKey = item._key();

  // clamp the max item count to 0-item_max.
  container[itemKey] = newNumber.clamp(0, this.maxItems(item));

  // check if the result is now zero.
  if (container[itemKey] === 0)
  {
    // remove the item from tracking.
    delete container[itemKey];
  }

  // check if we have any of that particular item equipped.
  if (includeEquip && newNumber < 0)
  {
    // and remove it if we no longer have any of it.
    this.discardMembersEquip(item, -newNumber);
  }

  // request a map refresh.
  $gameMap.requestRefresh();
};

/**
 * Hook for item gain processing when the item gained was not one of the three main
 * item types from the database.
 * @param {RPG_BaseItem} item The item to modify the quantity of.
 * @param {number} amount The amount to modify the quantity by.
 * @param {boolean} includeEquip Whether or not to include equipped items for equipment.
 */
Game_Party.prototype.processContainerlessItemGain = function(item, amount, includeEquip)
{
  // do something.
  console.warn(`an item was gained that is not flagged as a database object; ${item.name}.<br>`);
  console.error(item, amount, includeEquip);
};

/**
 * Extends {@link #maxItems}.<br>
 * Adds more handling regarding maximum quantities for your inventory.
 */
J.BASE.Aliased.Game_Party.set('maxItems', Game_Party.prototype.maxItems);
Game_Party.prototype.maxItems = function(item = null)
{
  // determine the default max for any item.
  const defaultMax = this.defaultMaxItems();

  // if we weren't passed a valid item, then return the default.
  if (!item) return defaultMax;

  // grab the individual item's max quantity.
  const maxForItem = item.getNumberFromNotesByRegex(J.BASE.RegExp.MaxItems, true);

  // check to ensure that quantity is defined.
  if (maxForItem !== null)
  {
    // we found the max for this item!
    return maxForItem;
  }

  // thats it, just return the default if there is none defined.
  return defaultMax;
};

/**
 * The default maximum item count.
 * @returns {number}
 */
Game_Party.prototype.defaultMaxItems = function()
{
  return 999;
};

/**
 * OVERWRITE Retrieves the item based on its index.
 * @param {RPG_BaseItem} item The item to check the quantity of.
 * @returns {number}
 */
Game_Party.prototype.numItems = function(item)
{
  // grab the container for the item.
  const container = this.itemContainer(item);

  // return the amount in the container.
  return container
    // safety net for rounding to zero instead of undefined.
    ? container[item._key()] || 0
    // or just zero if we have no container.
    : 0;
};

/**
 * Get all items, including duplicates based on quantity.
 * @returns {RPG_BaseItem[]}
 */
Game_Party.prototype.allItemsQuantified = function()
{
  // grab a distinct list of all items in our possession.
  const allItemsDistinct = this.allItems();

  // initialize our collection.
  const allItemsRepeated = [];

  // iterate over the distinct items.
  allItemsDistinct.forEach(baseItem =>
  {
    // get the number of items we have.
    let count = this.numItems(baseItem) ?? 0;

    // countdown while we still have some.
    while (count > 0)
    {
      // add a copy of the item in.
      allItemsRepeated.push(baseItem);

      // decrement the counter.
      count--;
    }
  }, this);

  // return our quantified list.
  return allItemsRepeated;
};

/**
 * Recovers the entire party back to perfect condition.
 */
Game_Party.prototype.recoverAllMembers = function()
{
  this.members()
    .forEach(member => member.recoverAll());
};

Game_Party.prototype.maxBattleMembers = function()
{
  return 8;
};
//endregion Game_Party