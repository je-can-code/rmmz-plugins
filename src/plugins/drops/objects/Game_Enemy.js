//region Game_Enemy
/**
 * Gets the gold that the enemy dropped.
 * This includes multipliers from our gold bonuses.
 * @returns {number} The rounded product of the base gold against the multiplier.
 */
J.DROPS.Aliased.Game_Enemy.set("gold", Game_Enemy.prototype.gold);
Game_Enemy.prototype.gold = function()
{
  const baseGoldRate = this.getBaseGoldRate();
  const baseGold = (J.DROPS.Aliased.Game_Enemy.get("gold")
    .call(this) * baseGoldRate);
  const multiplier = $gameParty.getGoldMultiplier();
  return Math.round(baseGold * multiplier);
};

/**
 * The base gold multiplier of this enemy.
 * Currently defaults to 1, but open for extension.
 * @returns {number}
 */
Game_Enemy.prototype.getBaseGoldRate = function()
{
  return 1;
};

/**
 * OVERWRITE Modifies the drop chance algorithm to treat the number entered in the
 * database as a percent chance instead of some weird fractional shit. Also applies
 * any applicable multipliers against the discovery rate of loot.
 * @returns {RPG_BaseItem[]} The array of loot successfully found.
 */
Game_Enemy.prototype.makeDropItems = function()
{
  // get all potential loot for this enemy.
  const dropList = this.getDropItems();

  // no point in iterating over nothing.
  if (!dropList.length) return [];

  // initialize our running collection of all actually dropped loot.
  const itemsFound = [];

  // get the chance multiplier for loot dropping.
  const multiplier = this.getDropMultiplierBonus();

  // iterate over all drops to see what we got.
  dropList.forEach(drop =>
  {
    // we don't deal with empty loot here.
    if (drop.kind === 0) return;

    // determine the loot we're finding.
    const item = this.itemObject(drop.kind, drop.dataId);

    // check if this loot is findable.
    if (!this.canFindLoot(item)) return;

    // here we're using the number from the database as a percentage chance instead.
    const rate = drop.denominator * multiplier;

    // if the multiplier was so great that the rate is above 100, we always get it.
    const treasureHunterSkip = rate >= 100;

    // determine if the loot was found.
    const foundLoot = treasureHunterSkip
      ? true                    // we were already a boss.
      : this.didFindLoot(rate); // roll the dice!

    // check if we earned the loot.
    if (foundLoot)
    {
      // add it to the list of earned drops from this enemy.
      itemsFound.push(item);
    }
  });

  // return all earned loot!
  return itemsFound;
};

/**
 * Determines if the item is allowed to be found.
 * @param {RPG_BaseItem} item The item to find.
 */
Game_Enemy.prototype.canFindLoot = function(item)
{
  return true;
};

/**
 * Determines whether or not loot was found based on the provided rate.
 * This is not deterministic, and the same (non-100) rate
 * @param {number} rate The 0-100 integer rate of which to find this loot.
 * @returns {boolean} True if we found loot this time, false otherwise.
 */
Game_Enemy.prototype.didFindLoot = function(rate)
{
  // locally assign the percent chance to find something.
  let chance = rate;

  // check if anyone in the party has the double-drop trait.
  if ($gameParty.hasDropItemDouble())
  {
    // double the ratio!
    chance *= 2;
  }

  // roll the dice and see if we won!
  const found = RPGManager.chanceIn100(chance);

  // return the result.
  return found;
};

/**
 * Gets the drop items from this enemy from all sources available.
 * @returns {RPG_DropItem[]}
 */
Game_Enemy.prototype.getDropItems = function()
{
  // validate the drop items from the enemy- from the database and additionally parsed drops.
  const baseDropItems = this.enemy()
    .originalDropItems();

  // initialize the drops to be the enemy's own valid drop items from the database.
  const allDropItems = [ ...baseDropItems ];

  // grab any extra drops available.
  const extraDropItems = this.extraDrops();

  // add the extra drops found.
  allDropItems.push(...extraDropItems);

  // return what we found.
  return allDropItems;
};

/**
 * Gets any additional drops from the notes of this particular enemy.
 *
 * @returns {RPG_DropItem[]}
 */
Game_Enemy.prototype.extraDrops = function()
{
  // initialize our extra drops collection.
  const extraDrops = [];

  // grab all sources that things can drop from.
  const sources = this.dropSources();

  // iterate over each of the sources.
  sources.forEach(source =>
  {
    // extract the drops from the source.
    const drops = this.extractExtraDrops(source);

    // add what was found.
    extraDrops.push(...drops);
  });

  // return all the extras.
  return extraDrops;
};

/**
 * A collection of all sources of which loot may be acquired from.
 * Typically, this will only be the enemy itself, but is open for extension.
 * @returns {RPG_BaseItem[]}
 */
Game_Enemy.prototype.dropSources = function()
{
  // initialize our sources tracking- by default there are no extra sources beyond oneself.
  const sources = [];

  // return what we found.
  return sources;
};

/**
 * Gets the multiplier against the RNG of an item dropping.
 * @returns {number}
 */
Game_Enemy.prototype.getDropMultiplierBonus = function()
{
  // the base/default drop multiplier rate.
  let multiplier = this.getBaseDropRate();

  // get the party's bonus drop multiplier.
  multiplier += $gameParty.getPartyDropMultiplier();

  // if someone in the party has the "double drops" accessory, then double the rate.
  multiplier *= this.dropItemRate();

  // return this magical loot multiplier.
  return multiplier;
};

/**
 * The base drop rate multiplier of this enemy.
 * Currently defaults to 1, but open for extension.
 * @returns {number}
 */
Game_Enemy.prototype.getBaseDropRate = function()
{
  return 1;
};
//endregion Game_Enemy