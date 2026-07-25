//region JABS_Engine
if (J.ABS && J.LEVEL && J.LEVEL.EXT.FLAT)
{
  /**
   * Extends {@link #determineExperienceGained}.<br/>
   * Routes the actor's level through getLevelForExp() so the Sync Affects EXP
   * parameter can gate whether the sync overlay influences EXP rewards.
   * @param {Game_Enemy} defeatedEnemy The enemy that was defeated.
   * @param {Game_Actor} victoriousActor The actor that defeated the enemy.
   * @returns {number}
   */
  J.LEVEL.EXT.SYNC.Aliased.JABS_Engine.set(
    'determineExperienceGained',
    JABS_Engine.prototype.determineExperienceGained);
  JABS_Engine.prototype.determineExperienceGained = function(defeatedEnemy, victoriousActor)
  {
    // build a proxy actor that exposes the EXP-appropriate level via the level property.
    const actorProxy = Object.create(victoriousActor);

    // override the level property to return the EXP-appropriate level.
    Object.defineProperty(actorProxy, 'level', {
      get() { return victoriousActor.getLevelForExp(); },
      configurable: true,
    });

    // perform original logic with the proxy actor so the EXP gate is respected.
    return J.LEVEL.EXT.SYNC.Aliased.JABS_Engine.get('determineExperienceGained')
      .call(this, defeatedEnemy, actorProxy);
  };
}
//endregion JABS_Engine
