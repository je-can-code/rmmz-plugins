//region Game_Party
import DropsPartyStrategy from './../models/DropsPartyStrategy.js';

/**
 * Gets the collective sum multiplier for gold drops for the entire party.
 * @returns {number}
 */
Game_Party.prototype.getGoldMultiplier = function()
{
  // initialize a base multiplier.
  const baseMultiplier = 1;

  // determine the members for consideration.
  const membersToConsider = this.goldMultiplierMembers();

  // calculate the total.
  const goldMultiplier = membersToConsider.reduce((
    runningTotal,
    currentActor) => runningTotal + currentActor.getGoldMultiplier(), baseMultiplier);

  // return the result.
  return goldMultiplier;
};

/**
 * Resolves which party members a reward strategy says should influence a bonus multiplier.
 * An unrecognized strategy is a misconfigured plugin parameter rather than a runtime condition,
 * and silently considering nobody would quietly halve the party's rewards for the rest of the
 * playthrough with nothing to point at. Refusing to boot is the louder and cheaper failure.
 * @param {string} strategy The configured reward strategy.
 * @returns {Game_Actor[]} The members the strategy considers.
 */
Game_Party.prototype.dropsStrategyMembers = function(strategy)
{
  // pivot on the strategy.
  switch (strategy)
  {
    // consider only the leader should influence drop bonuses (for ABS style).
    case DropsPartyStrategy.AbsStyle:
      return [ $gameParty.leader() ];

    // consider the currently active members of the party.
    case DropsPartyStrategy.CombatPartyStyle:
      return [ ...$gameParty.battleMembers() ];

    // consider all party members, including reserve (different preferences).
    case DropsPartyStrategy.FullPartyStyle:
      return [ ...$gameParty.members() ];

    // the parameter does not name a strategy this plugin knows how to honor.
    default:
      throw new Error(`Unrecognized drops party strategy of [ ${strategy} ]; check the plugin parameters.`);
  }
};

/**
 * Gets the selection of actors to consider when determining gold bonus multipliers.
 * @param {string} [strategy] The reward strategy governing who counts.
 * @returns {Game_Actor[]}
 */
Game_Party.prototype.goldMultiplierMembers = function(strategy = DropsPartyStrategy.CombatPartyStyle)
{
  // gold and loot consider the same members; only the multiplier they feed differs.
  return this.dropsStrategyMembers(strategy);
};

/**
 * Gets the collective bonus the party contributes to loot drop rates.
 * This is a sum of bonuses rather than a multiplier in its own right, so it starts from zero and
 * a party with nothing equipped contributes nothing. The identity value belongs to the enemy's
 * own {@link Game_Enemy#getBaseDropRate}, which this is added to- starting from one here as well
 * would mean two identities summing to two, doubling every drop in the game before any bonus
 * was even involved.
 * @returns {number}
 */
Game_Party.prototype.getPartyDropMultiplier = function()
{
  // a party with no bonuses contributes nothing on top of the enemy's own base rate.
  const baseBonus = 0;

  // determine the members for consideration.
  const membersToConsider = this.dropMultiplierMembers();

  // calculate the total.
  const dropMultiplier = membersToConsider.reduce((
    runningTotal,
    currentActor) => runningTotal + currentActor.getDropMultiplierBonus(), baseBonus);

  // return the result.
  return dropMultiplier;
};

/**
 * Gets the selection of actors to consider when determining bonus drop multipliers.
 * @param {string} [strategy] The reward strategy governing who counts.
 * @returns {Game_Actor[]}
 */
Game_Party.prototype.dropMultiplierMembers = function(strategy = DropsPartyStrategy.CombatPartyStyle)
{
  // loot and gold consider the same members; only the multiplier they feed differs.
  return this.dropsStrategyMembers(strategy);
};
//endregion Game_Party