//region Game_Party
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
 * Gets the selection of actors to consider when determining gold bonus multipliers.
 * @returns {Game_Actor[]}
 */
Game_Party.prototype.goldMultiplierMembers = function(strategy = DropsPartyStrategy.CombatPartyStyle)
{
  // default to no members considered.
  const membersToConsider = [];

  // pivot on the strategy.
  switch (strategy)
  {
    // consider only the leader should influence drop bonuses (for ABS style).
    case DropsPartyStrategy.AbsStyle:
      membersToConsider.push($gameParty.leader());
      break;
    // consider the currently active members of the party.
    case DropsPartyStrategy.CombatPartyStyle:
      membersToConsider.push(...$gameParty.battleMembers());
      break;
    // consider all party members, including reserve (different preferences).
    case DropsPartyStrategy.FullPartyStyle:
      membersToConsider.push(...$gameParty.members());
      break;
  }

  // return all that were applicable.
  return membersToConsider;
};

/**
 * Gets the collective sum multiplier for loot drops for the entire party.
 * @returns {number}
 */
Game_Party.prototype.getPartyDropMultiplier = function()
{
  // initialize a base multiplier.
  const baseMultiplier = 1;

  // determine the members for consideration.
  const membersToConsider = this.dropMultiplierMembers();

  // calculate the total.
  const dropMultiplier = membersToConsider.reduce((
    runningTotal,
    currentActor) => runningTotal + currentActor.getDropMultiplierBonus(), baseMultiplier);

  // return the result.
  return dropMultiplier;
};

/**
 * Gets the selection of actors to consider when determining bonus drop multipliers.
 * @returns {Game_Actor[]}
 */
Game_Party.prototype.dropMultiplierMembers = function(strategy = DropsPartyStrategy.CombatPartyStyle)
{
  // default to no members considered.
  const membersToConsider = [];

  // pivot on the strategy.
  switch (strategy)
  {
    // consider only the leader should influence drop bonuses (for ABS style).
    case DropsPartyStrategy.AbsStyle:
      membersToConsider.push($gameParty.leader());
      break;
    // consider the currently active members of the party.
    case DropsPartyStrategy.CombatPartyStyle:
      membersToConsider.push(...$gameParty.battleMembers());
      break;
    // consider all party members, including reserve (different preferences).
    case DropsPartyStrategy.FullPartyStyle:
      membersToConsider.push(...$gameParty.members());
      break;
  }

  // return all that were applicable.
  return membersToConsider;
};
//endregion Game_Party