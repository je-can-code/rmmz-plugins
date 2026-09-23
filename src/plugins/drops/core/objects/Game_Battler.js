//region Game_Battler
/**
 * The gold multiplier this battler's own tags produce, before SDP panels or natural bonuses.<br/>
 * Only actors carry a reward model, so every other battler answers zero. Natural growth still asks
 * every battler for it, because buffs are refreshed on enemies too.
 * @returns {number}
 */
Game_Battler.prototype.baseGoldMultiplier = function()
{
  return 0;
};

/**
 * The drop multiplier this battler's own tags produce, before SDP panels or natural bonuses.<br/>
 * Only actors carry a reward model, so every other battler answers zero, for the same reason as
 * {@link #baseGoldMultiplier}.
 * @returns {number}
 */
Game_Battler.prototype.baseDropMultiplier = function()
{
  return 0;
};

/**
 * How many rungs this battler promotes drops by.
 *
 * Lives on the battler rather than the enemy so a slain enemy and the killer answer the same question
 * the same way- an affix graded onto the target and a harvesting tool carried by the killer are the
 * same kind of contribution and get summed rather than ranked.
 *
 * Note that an enemy's ordinary applied states are already gone by the time drops are made, since
 * death clears them. Affixes survive because they are passive states held in an external source.
 * @returns {number}
 */
Game_Battler.prototype.dropUpgradeCount = function()
{
  // grab everything with notes.
  const objectsToCheck = this.getAllNotes();

  // sum every authored promotion across all of them.
  return RPGManager.getSumFromAllNotesByRegex(objectsToCheck, J.DROPS.RegExp.DropUpgrade);
};

/**
 * How many extra copies of each dropped item this battler grants.
 *
 * Sourced identically to {@link #dropUpgradeCount}; see there for why both sides of a kill contribute.
 * @returns {number}
 */
Game_Battler.prototype.dropQuantityBonus = function()
{
  // grab everything with notes.
  const objectsToCheck = this.getAllNotes();

  // sum every authored quantity change across all of them.
  return RPGManager.getSumFromAllNotesByRegex(objectsToCheck, J.DROPS.RegExp.DropQuantity);
};
//endregion Game_Battler