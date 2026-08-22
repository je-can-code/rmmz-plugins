//region Game_Party
/**
 * Gets the additional sources the party contributes when an enemy is working out its drop list.
 *
 * Only active battle members count. Loot that follows a character sitting in reserve would be
 * invisible to the player- there is nothing on screen to attribute the extra item to- and it would
 * make the drop pool depend on the entire roster rather than on the party the player assembled.
 * @returns {RPG_BaseItem[]}
 */
Game_Party.prototype.extraDropSources = function()
{
  const extraSources = [];

  // gather every state riding every member currently in the fight.
  $gameParty.battleMembers()
    .forEach(member => extraSources.push(...member.allStates()));

  return extraSources;
};
//endregion Game_Party