//region Window_TargetFrame
if (J.HUD && J.HUD.EXT && J.HUD.EXT.TARGET)
{
  /**
   * Extends {@link #drawTargetLevel}.<br/>
   * Colorizes the level text and prepends the sync icon when the target is a
   * content-synced actor.
   * @param {number} x The x coordinate.
   * @param {number} y The y coordinate.
   */
  J.LEVEL.EXT.SYNC.Aliased.Window_TargetFrame.set('drawTargetLevel', Window_TargetFrame.prototype.drawTargetLevel);
  Window_TargetFrame.prototype.drawTargetLevel = function(x, y)
  {
    // don't draw level if we can't.
    if (!this.canDrawTargetLevel()) return;

    // get the battler from the target.
    const { _battler: battler } = this._j;

    // check to see if the battler is a leveled battler.
    if (!battler.level) return;

    // check whether the target is a content-synced actor.
    const isSynced = (battler.isActor() && battler.isContentSynced());

    // resolve the sync indicator icon index.
    const iconIndex = J.LEVEL.EXT.SYNC.Metadata.syncIndicatorIconIndex;

    // build the sync prefix: color code and icon when synced.
    const colorCode = isSynced ? '\\C[6]' : '';
    const iconPrefix = (isSynced && iconIndex > 0) ? `\\I[${iconIndex}]` : '';

    // build the level string with optional sync decoration.
    const levelString = `\\FS[14]${colorCode}${iconPrefix}Lv.${battler.level.padZero(3)}`;

    // draw the decorated level string.
    this.drawTextEx(levelString, x, y, this.targetFrameLevelColumnWidth());
  };
}
//endregion Window_TargetFrame
