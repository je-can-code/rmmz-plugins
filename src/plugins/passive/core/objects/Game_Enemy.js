//region Game_Enemy
/**
 * Extends {@link #onSetup}.<br/>
 * Also refreshes the passive states on this battler for the first time.
 * @param {number} enemyId The battler's id.
 */
J.PASSIVE.Aliased.Game_Enemy.set('onSetup', Game_Enemy.prototype.onSetup);
Game_Enemy.prototype.onSetup = function(enemyId)
{
  // perform original logic.
  J.PASSIVE.Aliased.Game_Enemy.get('onSetup')
    .call(this, enemyId);

  // refresh all passive states on this battler.
  this.refreshPassiveStates();
};

/**
 * Extends {@link #buildTraitObjects}.<br/>
 * When considering traits, also include the enemy's passive states.
 *
 * Returns a fresh array by spreading the base result and appending passives — never
 * mutates the base result so the {@link #traitObjects} cache stays safe.
 * @returns {(RPG_Enemy|RPG_State)[]}
 */
J.PASSIVE.Aliased.Game_Enemy.set('buildTraitObjects', Game_Enemy.prototype.buildTraitObjects);
Game_Enemy.prototype.buildTraitObjects = function()
{
  // perform original logic.
  const baseObjects = J.PASSIVE.Aliased.Game_Enemy.get('buildTraitObjects')
    .call(this);

  // return a new array that includes the enemy's passive states.
  return [ ...baseObjects, ...this.getPassiveStates() ];
};

/**
 * Extends {@link #getNotesSources}.<br/>
 * Includes passive states from this enemy.
 * @returns {RPG_BaseItem[]}
 */
J.PASSIVE.Aliased.Game_Enemy.set('getNotesSources', Game_Enemy.prototype.getNotesSources);
Game_Enemy.prototype.getNotesSources = function()
{
  // perform original logic to get notes.
  const originalSources = J.PASSIVE.Aliased.Game_Enemy.get('getNotesSources')
    .call(this);

  // newly defined sources for passives.
  const passiveSources = [
    // add all sources from events.
    ...this.passiveExternalStateSources(),
  ];

  // combine the sources.
  const combinedSources = originalSources.concat(passiveSources);

  // return the combination.
  return combinedSources;
};
//endregion Game_Enemy