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
  // perform original logic.
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
 * Overwrites {@link #makeDropItems}.<br/>
 * Modifies the drop chance algorithm to treat the number entered in the database as a percent chance instead of some
 * weird fractional shit. Also applies any applicable multipliers against the discovery rate of loot.
 * @param {Game_Actor|Game_Enemy=} killer The battler that landed the killing blow, if known; the
 * killer contributes both their own positive and negative rolls to the drop-chance roll.
 * @returns {RPG_BaseItem[]} The array of loot successfully found.
 */
Game_Enemy.prototype.makeDropItems = function(killer = null)
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

    // determine how many of this loot were found; a rate at or beyond 100 lands on every roll,
    // so the old "always get it" shortcut is simply what a guaranteed rate now produces.
    const foundCount = this.howMuchLootFound(rate, killer);

    // if we didn't find the loot, then don't proceed.
    if (foundCount <= 0) return;

    // find the loot- once per success, since a single drop entry can yield several copies.
    for (let index = 0; index < foundCount; index++)
    {
      this.findLoot(drop, itemsFound);
    }
  }, this);

  // promote and multiply what was won, then return all earned loot!
  return this.postProcessDroppedLoot(itemsFound, killer);
};

/**
 * Applies the quality and quantity modifiers to loot that has already won its roll.
 *
 * Deliberately a pass over the finished list rather than work done inside the drop loop. Quantity has
 * to see the whole list at once, because it grants copies per distinct item rather than per drop
 * entry, and an enemy listing the same item four times has dropped one thing. Quality could have
 * lived in {@link #findLoot}, but that method is aliased elsewhere with a fixed signature and a new
 * argument would be silently swallowed before it ever arrived.
 *
 * Order matters: promotion runs first so the quantity bonus grants more of what you actually
 * received. Two rows that both clamp onto the same top rung are one item by the time quantity counts
 * them, which is the intended reading- you got one kind of thing, so you get more of that kind.
 * @param {RPG_BaseItem[]} itemsFound The loot that successfully dropped.
 * @param {Game_Actor|Game_Enemy=} killer The battler that landed the killing blow, if known.
 * @returns {RPG_BaseItem[]} The loot as the player will actually receive it.
 */
Game_Enemy.prototype.postProcessDroppedLoot = function(itemsFound, killer = null)
{
  // upgrade the quality of what dropped.
  const promoted = this.promoteDroppedLoot(itemsFound, killer);

  // then adjust how much of it there is.
  return this.applyDropQuantityBonus(promoted, killer);
};

/**
 * Walks each dropped item along its ladder by the resolved number of rungs.
 * @param {RPG_BaseItem[]} itemsFound The loot that successfully dropped.
 * @param {Game_Actor|Game_Enemy=} killer The battler that landed the killing blow, if known.
 * @returns {RPG_BaseItem[]}
 */
Game_Enemy.prototype.promoteDroppedLoot = function(itemsFound, killer = null)
{
  // resolve how far up or down the ladders this kill moves its loot.
  const rungs = this.resolveDropUpgradeCount(killer);

  // no promotion means the loot is already what it should be.
  if (rungs === 0) return itemsFound;

  const promoting = item =>
  {
    const promotedId = J.DROPS.Metadata.walkDropLadder(item.kind, item.id, rungs);

    // a row at the end of its ladder, on no ladder, or synthetic loot with no database row behind
    // it at all, all answer with the id they came in with and are handed straight back. Promotion
    // needs no special case for panel unlocks; "not on a ladder" already covers them.
    if (promotedId === item.id) return item;

    return this.itemObject(item.kind, promotedId);
  };

  return itemsFound.map(promoting, this);
};

/**
 * Grants or removes copies of each distinct item that dropped.
 *
 * The bonus lands once per distinct row, never once per drop entry- four identical drop entries are
 * one item as far as the player is concerned, and scaling by how the author split their rows would
 * make the same tag mean different things on identically-behaving enemies.
 * @param {RPG_BaseItem[]} itemsFound The loot that successfully dropped.
 * @param {Game_Actor|Game_Enemy=} killer The battler that landed the killing blow, if known.
 * @returns {RPG_BaseItem[]}
 */
Game_Enemy.prototype.applyDropQuantityBonus = function(itemsFound, killer = null)
{
  // resolve how many copies of each distinct item this kill adds or removes.
  const bonus = this.resolveDropQuantityBonus(killer);

  // no adjustment means the list is already correct.
  if (bonus === 0) return itemsFound;

  /** @type {Map<string, {item: RPG_BaseItem, count: number}>} */
  const tallies = new Map();

  // tally each distinct row; synthetic loot is keyed by position so it stays a group of exactly one.
  itemsFound.forEach((item, index) =>
  {
    const key = item.id
      ? `${item.kind}:${item.id}`
      : `synthetic:${index}`;
    const tally = tallies.get(key) ?? {
      item,
      count: 0,
    };

    tally.count += 1;
    tallies.set(key, tally);
  });

  const adjusted = [];

  // emit each distinct row at its adjusted count, which may be none at all.
  tallies.forEach(tally =>
  {
    const {
      item,
      count
    } = tally;

    // synthetic loot passes through untouched; a negative may take a real row to zero.
    const total = item.id
      ? Math.max(count + bonus, 0)
      : count;

    for (let index = 0; index < total; index++)
    {
      adjusted.push(item);
    }
  });

  return adjusted;
};

/**
 * How many rungs this kill promotes its drops by, summing both sides of it.
 *
 * The enemy's own grade applies whether or not the killer is known- an affixed enemy felled by
 * something unidentified still drops what its affix promised.
 * @param {Game_Actor|Game_Enemy=} killer The battler that landed the killing blow, if known.
 * @returns {number}
 */
Game_Enemy.prototype.resolveDropUpgradeCount = function(killer = null)
{
  // the grade the enemy itself carries.
  const enemyCount = this.dropUpgradeCount();

  // with no known killer there is nobody to contribute the other half.
  if (!killer) return enemyCount;

  return enemyCount + killer.dropUpgradeCount();
};

/**
 * How many extra copies this kill grants of each distinct item, summing both sides of it.
 * @param {Game_Actor|Game_Enemy=} killer The battler that landed the killing blow, if known.
 * @returns {number}
 */
Game_Enemy.prototype.resolveDropQuantityBonus = function(killer = null)
{
  // the bonus the enemy itself carries.
  const enemyBonus = this.dropQuantityBonus();

  // with no known killer there is nobody to contribute the other half.
  if (!killer) return enemyBonus;

  return enemyBonus + killer.dropQuantityBonus();
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
 * Determines how many copies of a drop were found at the given rate.
 *
 * A drop is a repeatable outcome- finding it twice is a coherent result in a way that "hit twice"
 * or "critted twice" are not- so this resolves through the shared proc-count path rather than
 * collapsing to a single yes/no. That is what lets Accumulate Mode roll every one of the killer's
 * positive rolls and award a copy per success, and lets Encore echo each success further.
 *
 * A rate at or beyond 100 succeeds on every roll by construction, so a "guaranteed" drop needs no
 * special case: it simply lands on all of them.
 * @param {number} rate The 0-100 integer rate of which to find this loot.
 * @param {Game_Actor|Game_Enemy=} killer The battler that landed the killing blow, if known.
 * @returns {number} How many copies of this loot were found; 0 means none.
 */
Game_Enemy.prototype.howMuchLootFound = function(rate, killer = null)
{
  // with no known killer there is nobody whose rolls, fate or accumulate mode could apply, so
  // this is a single plain roll with no bonus attempts either way.
  if (!killer)
  {
    return RPGManager.chanceIn100(rate, 1, 0)
      ? 1
      : 0;
  }

  // this is a purely self-scoped proc from the killer's perspective- when known, the killer is
  // both the roller and the recipient of the drop-chance roll.
  const positiveRolls = 1 + killer.getPositiveRolls();
  const negativeRolls = killer.getNegativeRolls();

  // resolve how many copies this drop should yield (Accumulate Mode/Encore aware).
  return RPGManager.resolveProcCount(killer, rate, positiveRolls, negativeRolls);
};

/**
 * Determines whether or not loot was found based on the provided rate.
 * This is not deterministic, and the same (non-100) rate can answer differently each time.
 * Callers that care how many copies were found should ask {@link #howMuchLootFound} instead.
 * @param {number} rate The 0-100 integer rate of which to find this loot.
 * @param {Game_Actor|Game_Enemy=} killer The battler that landed the killing blow, if known.
 * @returns {boolean} True if we found loot this time, false otherwise.
 */
Game_Enemy.prototype.didFindLoot = function(rate, killer = null)
{
  // whether any loot was found is simply whether at least one copy of it was.
  return this.howMuchLootFound(rate, killer) > 0;
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
  // get the drops found on this enemy; an absent tag yields an empty array, never null.
  const moreDrops = RPGManager.getArraysFromNotesByRegex(referenceData, J.DROPS.RegExp.ExtraDrop);

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