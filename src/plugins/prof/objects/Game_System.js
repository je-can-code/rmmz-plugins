//region Game_System
/**
 * Updates the list of all available proficiency conditionals from the latest plugin metadata.
 */
J.PROF.Aliased.Game_System.set('onAfterLoad', Game_System.prototype.onAfterLoad);
Game_System.prototype.onAfterLoad = function()
{
  // perform original logic.
  J.PROF.Aliased.Game_System.get('onAfterLoad')
    .call(this);

  // update from the latest plugin metadata.
  this.updateProficienciesFromPluginMetadata();
};

/**
 * Updates the plugin metadata after the game data has loaded.
 */
Game_System.prototype.updateProficienciesFromPluginMetadata = function()
{
  $gameActors.actorIds()
    .forEach(actorId =>
    {
      const actorConditionals = J.PROF.Metadata.conditionals.filter(condition => condition.actorIds.includes(actorId));
      J.PROF.Metadata.actorConditionalsMap.set(actorId, actorConditionals);
    });
};