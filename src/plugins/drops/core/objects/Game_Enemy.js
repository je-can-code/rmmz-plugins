//region Game_Enemy
import RPG_DropItemBuilder from './../database/RPG_DropItemBuilder.js';

/**
 * Gets the gold that the enemy dropped.
 * This includes multipliers from our gold bonuses.
 * @returns {number} The rounded product of the base gold against the multiplier.
 */
J.DROPS.Aliased.Game_Enemy.set('gold', Game_Enemy.prototype.gold);
Game_Enemy.prototype.gold = function()
{
  // identifies the base rate of gold gain.
  const baseGoldRate = this.getBaseGoldRate();

  // calculates the gold accordingly with the base multiplier.
  const baseGold = (J.DROPS.Aliased.Game_Enemy.get('gold')
    .call(this) * baseGoldRate);

  // multiplies the gold again by the party's gold multiplier.
  const multiplier = $gameParty.getGoldMultiplier();

  // returns the rounded amount to avoid fractional gains in currency.
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
 * Overrides {@link #makeDropItems}.<br/>
 * Modifies the drop chance algorithm to treat the number entered in the database as a percent chance instead of some
 * weird fractional shit. Also applies any applicable multipliers against the discovery rate of loot.
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
    // check if this loot is findable.
    if (!this.canFindLoot(drop)) return;

    // here we're using the number from the database as a percentage chance instead.
    const rate = drop.denominator * multiplier;

    // if the multiplier was so great that the rate is above 100, we always get it.
    const treasureHunterSkip = rate >= 100;

    // determine if the loot was found.
    const foundLoot = treasureHunterSkip
      ? true                    // we were already a boss.
      : this.didFindLoot(rate); // roll the dice!

    // if we didn't find the loot, then don't proceed.
    if (foundLoot === false) return;

    // find the loot.
    this.findLoot(drop, itemsFound);
  }, this);

  // return all earned loot!
  return itemsFound;
};

/**
 * Builds the drop to be found and adds it to the running list.
 * @param {RPG_DropItem} drop The drop being found.
 * @param {RPG_BaseItem} itemsFound The running list of items that have been found.
 */
Game_Enemy.prototype.findLoot = function(drop, itemsFound)
{
  // determine the loot we're finding.
  const item = this.itemObject(drop.kind, drop.dataId);

  // validate the drop resolves.
  if (!item)
  {
    console.warn(`Invalid drop resolved:
       enemy=${this.enemy().name}, kind=${drop.kind}, id=${drop.dataId},
      "(check DB entry and note tags).`);

    // don't add junk data to the drop list.
    return;
  }

  // add it to the list of earned drops from this enemy.
  itemsFound.push(item);
};

/**
 * Determines if the drop is allowed to be found.
 * @param {RPG_DropItem} drop The drop to potentially to find.
 */
Game_Enemy.prototype.canFindLoot = function(drop)
{
  // we don't deal with empty loot here.
  if (drop.kind === 0) return false;

  // find it!
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
  }, this);

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
 * Parses the given reference data to extract any extra drops that may be present.
 * @param {RPG_BaseItem} referenceData The database object to parse.
 * @returns {RPG_DropItem[]}
 */
Game_Enemy.prototype.extractExtraDrops = function(referenceData)
{
  // get the drops found on this enemy.
  const moreDrops = RPGManager.getArraysFromNotesByRegex(referenceData, J.DROPS.RegExp.ExtraDrop, true) ?? [];

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
  const convertedDrops = moreDrops.map(mapper, this);

  // return the found extra drops.
  return convertedDrops;
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