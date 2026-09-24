//region JABS_Battler
import BossFrameManager from '../managers/BossFrameManager.js';

/**
 * Extends {@link #canShowTargetFrame}.<br/>
 * The boss in the boss frame never opens the target frame as well. The boss frame already shows that
 * battler's name, level, health, and afflictions, and a second frame opened for them would only stack on
 * top of it. Anyone else struck mid-fight- an add, a stray slime- still opens the target frame as usual.
 * @returns {boolean}
 */
J.HUD.EXT.BOSS.Aliased.JABS_Battler.set('canShowTargetFrame', JABS_Battler.prototype.canShowTargetFrame);
JABS_Battler.prototype.canShowTargetFrame = function()
{
  // the framed boss already has a frame of its own.
  if (BossFrameManager.isFramingBattler(this)) return false;

  // perform original logic.
  return J.HUD.EXT.BOSS.Aliased.JABS_Battler.get('canShowTargetFrame')
    .call(this);
};
//endregion JABS_Battler