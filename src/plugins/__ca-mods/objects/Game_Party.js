//region Game_Party
/**
 * The actorIds that correlate with elemental actors in regards to Chef Adventure.
 * @type {number[]}
 */
Game_Party.ELEMENTAL_ALLY_ACTOR_IDS = [ 3, 4, 5, 6 ];

/**
 * Gets any additional sources to scan for drops when determining a drop item list on
 * an enemy. In this case, we are including passive skill states to potentially add
 * new items to every enemy.
 * @returns {RPG_BaseItem[]}
 */
Game_Party.prototype.extraDropSources = function()
{
  const extraSources = [];

  // grab all passive skill states from all the members in the party.
  $gameParty.battleMembers()
    .forEach(member => extraSources.push(...member.allStates()));

  return extraSources;
};

/**
 * Gets all current actors that are just the elemental variety.
 * @returns {Game_Actor[]}
 */
Game_Party.prototype.elementalActors = function()
{
  return $gameParty.battleMembers()
    .filter(member => Game_Party.ELEMENTAL_ALLY_ACTOR_IDS.contains(member.actorId()));
};

/**
 * Gets all current JABS Battlers that are just the elemental variety.
 * @returns {JABS_Battler[]}
 */
Game_Party.prototype.elementalJabsBattlers = function()
{
  // a filter function for identifying if a jabs battler is also an elemental ally in the context of CA.
  const filtering = jabsBattler =>
  {
    // grab the actor's id of this jabs battler.
    const actorId = jabsBattler.getBattler()
      .actorId();

    // identify if the actor id is among the known elemental actor id list.
    // return what we found.
    return Game_Party.ELEMENTAL_ALLY_ACTOR_IDS.includes(actorId);
  };

  // filter the battlers to only the elemental ones that are currently unlocked.
  // return what was found.
  return JABS_AiManager.getActorBattlers()
    .filter(filtering, this);
};

/**
 * Determine if the leader is the given actorId.
 * @param {number} actorId The actor id to compare the leader's actor id with.
 * @returns {boolean} True if the leader is the same actor as the designated id, false otherwise.
 */
Game_Party.prototype.isLeaderActor = function(actorId)
{
  // determine if the leader is the same as the designated actor.
  return this.leader()
    .actorId() === actorId;
};
//endregion Game_Party