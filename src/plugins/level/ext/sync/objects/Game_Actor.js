//region Game_Actor
/**
 * Extends {@link #getLevel}.<br/>
 * Applies the content sync overlay after the normal computation. The sync
 * is a final clamp or replace on the result, leaving the re-entrancy guard
 * and base computation in Game_Battler.getLevel() untouched.
 */
J.LEVEL.EXT.SYNC.Aliased.Game_Actor.set('getLevel', Game_Actor.prototype.getLevel);
Game_Actor.prototype.getLevel = function()
{
  // perform original logic.
  const computedLevel = J.LEVEL.EXT.SYNC.Aliased.Game_Actor.get('getLevel')
    .call(this);

  // resolve the active sync level; session takes priority over map note.
  const syncLevel = this.resolveContentSyncLevel();

  // if no sync is active, return the computed level unchanged.
  if (syncLevel === null) return computedLevel;

  // check if uplevel (exact sync) mode is active.
  const uplevel = this.isContentSyncUplevel();

  // apply cap-only (default): clamp overleveled actors down; underleveled stay.
  if (uplevel === false) return Math.min(computedLevel, syncLevel);

  // apply exact sync: all actors fight at sync level regardless of real level.
  return syncLevel;
};

/**
 * Resolves the active content sync level from session or map note.
 * Session always takes priority over map note.
 * @returns {number|null} The active sync level, or null if no sync is active.
 */
Game_Actor.prototype.resolveContentSyncLevel = function()
{
  // check for an active session first — it always wins.
  if ($gameSystem.hasContentSyncSession() === true)
  {
    // return the session's sync level.
    return $gameSystem.getContentSyncSession().level;
  }

  // fall back to the map note sync level.
  const mapSyncLevel = $gameMap.getMapContentSyncLevel();

  // return the map sync level if present, otherwise null.
  return mapSyncLevel;
};

/**
 * Gets whether the active content sync uses uplevel (exact) mode.
 * @returns {boolean}
 */
Game_Actor.prototype.isContentSyncUplevel = function()
{
  // check for an active session first — it always wins.
  if ($gameSystem.hasContentSyncSession() === true)
  {
    // return the session's uplevel flag.
    return $gameSystem.getContentSyncSession().uplevel;
  }

  // fall back to the map note uplevel flag.
  return $gameMap.isMapContentSyncUplevel();
};

/**
 * Gets whether this actor is currently under a content sync encapsulation.
 * @returns {boolean}
 */
Game_Actor.prototype.isContentSynced = function()
{
  return this.resolveContentSyncLevel() !== null;
};

/**
 * Gets the level to use for EXP reward calculations.
 * When Sync Affects EXP is false (default), returns the real _level so that
 * J-Level-Flat's level-difference EXP policy is not affected by the sync overlay.
 * @returns {number}
 */
Game_Actor.prototype.getLevelForExp = function()
{
  // check whether sync should influence EXP calculations.
  if (J.LEVEL.EXT.SYNC.Metadata.syncAffectsExp === false)
  {
    // return the real level to preserve level-difference EXP policy.
    return this._level;
  }

  // sync affects EXP; use effective (synced) level.
  return this.getLevel();
};
//endregion Game_Actor
