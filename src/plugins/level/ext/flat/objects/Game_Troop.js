//region Game_Troop
/**
 * Extends {@link #expTotal}.<br/>
 * Uses the flat-experience gained formula.
 */
J.LEVEL.EXT.FLAT.Aliased.Game_Troop.set('expTotal', Game_Troop.prototype.expTotal);
Game_Troop.prototype.expTotal = function()
{
  // check if the level scaling functionality is enabled.
  if (J.LEVEL.Metadata.enabled)
  {
    // return the scaled result instead.
    return this.getFlatExpResult();
  }
  // the scaling is not enabled.
  else
  {
    // return the default logic instead.
    return J.LEVEL.EXT.FLAT.Aliased.Game_Troop.get('expTotal')
      .call(this);
  }
};

/**
 * Determines the amount of experience gained based on the average battle party compared to each defeated enemy.
 * This function scales experience to the flat level system.
 * @returns {number}
 */
Game_Troop.prototype.getFlatExpResult = function()
{
  // grab all the dead enemies of this troop.
  const deadEnemies = this.deadMembers();

  // calculate the average actor level of the party.
  const averageActorLevel = $gameParty.averageActorLevel();

  // the reducer function for adding up experience.
  const reducer = (accumulativeExpTotal, currentEnemy) =>
  {
    // determine the experience factor for this defeated enemy level vs the average party level.
    // if the enemy is higher, then the rewards will be greater.
    // if the actor is higher, then the rewards will be lesser.
    const baseExp = ExperienceManager.calculateRewardFromLevelDifference(averageActorLevel, currentEnemy.level);

    // add the experience amount to get the actual amount.
    const total = baseExp + currentEnemy.exp();

    // add it to the running total.
    return (accumulativeExpTotal + total);
  };

  // return the rounded sum of flat experience.
  return Math.round(deadEnemies.reduce(reducer, 0));
};
//endregion Game_Troop