//region Window_StatusBase
/**
 * Extends {@link #drawActorLevel}.<br/>
 * When the actor is content-synced, colorizes the level label, prepends the
 * sync indicator icon, and appends the real level in parentheses so the player
 * can see both the effective and actual level in any window that calls this.
 * @param {Game_Actor} actor The actor whose level is being drawn.
 * @param {number} x The x coordinate.
 * @param {number} y The y coordinate.
 */
J.LEVEL.EXT.SYNC.Aliased.Window_StatusBase.set('drawActorLevel', Window_StatusBase.prototype.drawActorLevel);
Window_StatusBase.prototype.drawActorLevel = function(actor, x, y)
{
  // delegate to original logic when the actor is not content-synced.
  if (actor.isContentSynced() === false)
  {
    // perform original logic.
    J.LEVEL.EXT.SYNC.Aliased.Window_StatusBase.get('drawActorLevel')
      .call(this, actor, x, y);

    // stop processing.
    return;
  }

  // resolve the sync indicator icon index.
  const iconIndex = J.LEVEL.EXT.SYNC.Metadata.syncIndicatorIconIndex;

  // build the icon prefix if configured.
  const iconPrefix = iconIndex > 0 ? `\\I[${iconIndex}]` : '';

  // draw the level label in system color with sync colorization.
  this.drawTextEx(`\\C[6]${TextManager.levelA}\\C[0]`, x, y, 48);

  // draw the synced level + real level using drawTextEx for escape code support.
  const syncedLevel = actor.getLevel().padZero(3);
  const realLevel = actor._level.padZero(3);
  const levelText = `\\C[6]${iconPrefix}${syncedLevel}\\C[0] (${realLevel})`;
  this.drawTextEx(levelText, x + 48, y, 120);
};
//endregion Window_StatusBase
