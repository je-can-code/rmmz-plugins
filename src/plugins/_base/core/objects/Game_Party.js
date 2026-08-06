//region Game_Party
import RPGManager from './../managers/RPGManager.js';
import RPG_Weapon from './../database/implementations/RPG_Weapon.js';
import RPG_Item from './../database/implementations/RPG_Item.js';
import RPG_BaseItem from './../database/base/RPG_BaseItem.js';
import RPG_Armor from './../database/implementations/RPG_Armor.js';

/**
 * Extends {@link Game_Party.initialize}.<br/>
 * Also runs the member-initialization hook every plugin hangs its own state off.
 */
J.BASE.Aliased.Game_Party.set('initialize', Game_Party.prototype.initialize);
Game_Party.prototype.initialize = function()
{
  // perform original logic.
  J.BASE.Aliased.Game_Party.get('initialize')
    .call(this);

  // initialize our class members.
  this.initMembers();
};

/**
 * A hook for initializing additional members in {@link Game_Party}.<br>
 *
 * Vanilla sets the party up inside `initialize`, which takes no arguments but is never safe to
 * re-run - so a save being decoded cannot call it, and any plugin state added through it would come
 * back missing. This hook exists so that state has somewhere to live that a decode *can* run:
 * `Game_Party`'s codec seeds the engine's own fields and then calls this, which walks the same alias
 * chain construction does.
 *
 * **Plugins adding state to the party alias this, not `initialize`.**
 */
Game_Party.prototype.initMembers = function()
{
};

//region properties
/**
 * Gets the raw item container, mapping item ids to the quantity held.
 *
 * This is deliberately not {@link Game_Party#items}, which resolves the ids into database rows.
 * Anything inspecting or pruning the container itself needs the id-keyed form.
 * @returns {Object<number, number>} The raw id-to-quantity map.
 */
Game_Party.prototype.rawItems = function()
{
  // hand back the container itself rather than the rows it points at.
  return this._items;
};

/**
 * Gets the raw weapon container, mapping weapon ids to the quantity held.
 * @returns {Object<number, number>} The raw id-to-quantity map.
 */
Game_Party.prototype.rawWeapons = function()
{
  // hand back the container itself rather than the rows it points at.
  return this._weapons;
};

/**
 * Gets the raw armor container, mapping armor ids to the quantity held.
 * @returns {Object<number, number>} The raw id-to-quantity map.
 */
Game_Party.prototype.rawArmors = function()
{
  // hand back the container itself rather than the rows it points at.
  return this._armors;
};
//endregion properties

//region reconciliation
/**
 * Drops every inventory entry whose database row no longer exists, and shouts about each one.
 *
 * **A savefile outlives the database it was written against.** Deleting a row during development is ordinary and
 * correct - a whole family of weapons stops being part of the game - but every save written beforehand still holds
 * that row in its containers. Those containers store quantities against keys, so a deleted row leaves a key
 * pointing at nothing, and `Game_Party.weapons` resolves it by handing back `undefined`.
 *
 * Vanilla survives that only by luck: `DataManager.isItem` reads `item && …`, so engine windows silently skip the
 * gaps. Plugin code that asks a row a question first - `datum.isArmor()` - dies instead, somewhere entirely
 * unrelated to the deletion, with a stack trace that names neither the row nor the reason.
 *
 * So the reconciliation happens once, out loud, in one place. This is deliberately **not** a guard sprinkled across
 * every predicate that touches inventory: the entry is genuinely gone, and the honest thing is to say so and drop
 * it, rather than teach fifty callers to tiptoe around a hole.
 */
Game_Party.prototype.pruneMissingInventoryEntries = function()
{
  const prunedItems = this.pruneMissingFromContainer(this.rawItems(), $dataItems, 'item');
  const prunedWeapons = this.pruneMissingFromContainer(this.rawWeapons(), $dataWeapons, 'weapon');
  const prunedArmors = this.pruneMissingFromContainer(this.rawArmors(), $dataArmors, 'armor');
  const pruned = prunedItems.concat(prunedWeapons, prunedArmors);

  // staying quiet is the overwhelmingly common case, and a message every map entry would train the reader to
  // ignore the one that matters.
  if (pruned.length === 0)
  {
    return;
  }

  this.reportPrunedInventoryEntries(pruned);
};

/**
 * Removes the keys of one container that no longer resolve to a row, reporting what was removed.
 *
 * Keys are read against the datastore rather than trusted, because that is the whole question being asked. Note
 * this is indexed by the container's own key, which is the row's index rather than its id - the two agree for
 * anything authored in the editor, and dynamically created rows are the reason the distinction exists.
 * @param {Object<number, number>} container The raw key-to-quantity map to prune.
 * @param {RPG_BaseItem[]} datastore The table those keys are supposed to index.
 * @param {string} label What kind of thing this container holds, for the report.
 * @returns {{ label: string, key: number, quantity: number }[]} One entry per key removed.
 */
Game_Party.prototype.pruneMissingFromContainer = function(container, datastore, label)
{
  const pruned = [];

  Object.keys(container)
    .forEach(key =>
    {
      // a row that resolves is none of this method's business.
      if (datastore[key])
      {
        return;
      }

      pruned.push({
        label,
        key: Number(key),
        quantity: container[key],
      });

      delete container[key];
    });

  return pruned;
};

/**
 * Shouts about inventory entries that were dropped because their database rows are gone.
 *
 * Loud on purpose, and specific on purpose. The failure this replaces was a `TypeError` several systems away from
 * the deletion that caused it, so the report names the exact keys and how many were held - enough to decide
 * whether the deletion was intended without opening a save file.
 * @param {{ label: string, key: number, quantity: number }[]} pruned Everything that was removed.
 */
Game_Party.prototype.reportPrunedInventoryEntries = function(pruned)
{
  const banner = '='.repeat(110);

  console.warn(banner);
  console.warn(`J-BASE INVENTORY RECONCILIATION: dropped ${pruned.length} entr${pruned.length === 1 ? 'y' : 'ies'} `
    + 'that no longer exist in the database.');
  console.warn('This is what happens when rows are deleted from the database after a save was written. If those '
    + 'deletions were intended, this message is the confirmation and nothing is wrong. If they were not, the save '
    + 'just lost these permanently.');
  console.warn(banner);

  pruned.forEach(entry =>
  {
    console.warn(`  dropped ${entry.label} #${entry.key} (x${entry.quantity}) - no such row in the database.`);
  });

  console.warn(banner);
};
//endregion reconciliation

/**
 * Overwrites {@link #gainItem}.<br/>
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
 * Extends {@link #maxItems}.<br/>
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
  const maxForItem = RPGManager.getNumberFromNoteByRegex(item, J.BASE.RegExp.MaxItems, true);

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
 * Overwrites {@link #numItems}.<br/>
 * Retrieves the item based on its index.
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
    let count = this.numItems(baseItem);

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

/**
 * Overwrites {@link #maxBattleMembers}.<br/>
 * Sets the maximum number of battle members to 8.
 * @returns {number}
 */
Game_Party.prototype.maxBattleMembers = function()
{
  return 8;
};

/**
 * Sets the level of all party members to the given level.
 * @param {number} level The level to set all party members to.
 */
Game_Party.prototype.setLevel = function(level)
{
  // iterate over each member and set their level to the designated level.
  this.members()
    .forEach(member =>
    {
      // ensure the level is within the valid range.
      const normalizedLevel = level.clamp(1, member.maxLevel());

      // set the level.
      member.setLevel(normalizedLevel);
    });
};
//endregion Game_Party