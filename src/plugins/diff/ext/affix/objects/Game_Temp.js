//region Game_Temp
/**
 * Extends {@link #refreshAppliedDifficulty}.<br/>
 * Also rebuilds the difficulty-adjusted affix pools.
 *
 * This is the one seam every path that changes the enabled layers passes through - starting a new
 * game, loading a save, and toggling a layer in the difficulty scene all reach it, and nothing that
 * writes `enabled` avoids it. Aliasing anything narrower would leave one of the three stale.
 */
J.DIFFICULTY.EXT.AFFIX.Aliased.Game_Temp.set('refreshAppliedDifficulty', Game_Temp.prototype.refreshAppliedDifficulty);
Game_Temp.prototype.refreshAppliedDifficulty = function()
{
  // perform original logic.
  J.DIFFICULTY.EXT.AFFIX.Aliased.Game_Temp.get('refreshAppliedDifficulty')
    .call(this);

  // the enabled set just changed, so whatever was cached describes a difficulty nobody is playing.
  J.DIFFICULTY.EXT.AFFIX.Metadata.buildEffectivePools();
};
//endregion Game_Temp