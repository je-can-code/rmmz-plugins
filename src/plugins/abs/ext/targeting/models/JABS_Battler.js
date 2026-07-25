//region JABS_Battler (targeting pause)
import JABS_TargetingManager from './../managers/JABS_TargetingManager.js';

/**
 * Extends {@link JABS_Battler#canUpdateEngagement}.<br/>
 * Also blocks new engagement/aggro while a targeting session is active, so nothing can freshly
 * aggro onto the player mid-aim.
 */
J.ABS.EXT.TARGETING.Aliased.JABS_Battler.set('canUpdateEngagement', JABS_Battler.prototype.canUpdateEngagement);
JABS_Battler.prototype.canUpdateEngagement = function()
{
  // if a targeting session is active, do not update engagement.
  if (JABS_TargetingManager.isActive()) return false;

  // perform original logic.
  return J.ABS.EXT.TARGETING.Aliased.JABS_Battler.get('canUpdateEngagement')
    .call(this);
};
//endregion JABS_Battler (targeting pause)
