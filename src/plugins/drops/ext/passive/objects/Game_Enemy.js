//region Game_Enemy
/**
 * Extends {@link #dropSources}.<br/>
 * Also considers the states applied to this enemy, and the states applied to the party that is
 * fighting it, as places a `<drops:[...]>` tag can live.
 * @returns {RPG_BaseItem[]}
 */
J.DROPS.EXT.PASSIVE.Aliased.Game_Enemy.set('dropSources', Game_Enemy.prototype.dropSources);
Game_Enemy.prototype.dropSources = function()
{
  // perform original logic to determine base drop sources.
  const sources = J.DROPS.EXT.PASSIVE.Aliased.Game_Enemy.get('dropSources')
    .call(this);

  // also add all the states applied to oneself.
  sources.push(...this.allStates());

  // also add all the states carried by the party currently doing the fighting.
  sources.push(...$gameParty.extraDropSources());

  // return the updated collection.
  return sources;
};
//endregion Game_Enemy