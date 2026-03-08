//region Game_Actor
/**
 * Extends {@link #shieldBreakSources}.<br/>
 * Also adds actor-specific shield break skill sources.
 */
J.ABS.EXT.SHIELD.Aliased.Game_Actor.set('shieldBreakSources', Game_Actor.prototype.shieldBreakSources);
Game_Actor.prototype.shieldBreakSources = function()
{
  // get the original sources.
  const originalSources = J.ABS.EXT.SHIELD.Aliased.Game_Actor.get('shieldBreakSources')
    .call(this);

  // return all sources for shield break skills.
  return [
    // start with the original sources.
    ...originalSources,

    // the actor's class is also considered.
    this.class(),

    // all equips on the actor are also considered.
    ...this.equips(),
  ];
};
//endregion Game_Actor