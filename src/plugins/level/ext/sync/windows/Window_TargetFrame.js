//region Window_TargetFrame
if (J.HUD && J.HUD.EXT && J.HUD.EXT.TARGET)
{
  /**
   * Extends {@link #targetLevelColor}.<br/>
   * A content-synced target's level reads in light blue, so the player can tell at a glance that the level on
   * show is the synced one rather than the real one.
   * @returns {string}
   */
  J.LEVEL.EXT.SYNC.Aliased.Window_TargetFrame.set('targetLevelColor', Window_TargetFrame.prototype.targetLevelColor);
  Window_TargetFrame.prototype.targetLevelColor = function()
  {
    // the level only draws while a battler is framed, so there is always one to ask.
    const { _battler: battler } = this.j();

    // only an actor can be content-synced, and while it is, its level reads in light blue- the same family
    // as the outline the party frame gives a synced level.
    if (battler.isActor() && battler.isContentSynced()) return '#80c0ff';

    // perform original logic.
    return J.LEVEL.EXT.SYNC.Aliased.Window_TargetFrame.get('targetLevelColor')
      .call(this);
  };
}
//endregion Window_TargetFrame