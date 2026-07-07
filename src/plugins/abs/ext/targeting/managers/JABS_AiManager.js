//region JABS_AiManager (targeting pause)
import JABS_TargetingManager from './JABS_TargetingManager.js';

/**
 * Extends {@link JABS_AiManager.canUpdate}.<br/>
 * Also blocks AI decision-making while a targeting session is active, mirroring the soft-pause
 * the quick menu gets via `absPause` (see {@link JABS_TargetingManager} for why this doesn't
 * reuse that flag directly).
 */
J.ABS.EXT.TARGETING.Aliased.JABS_AiManager.set('canUpdate', JABS_AiManager.canUpdate);
JABS_AiManager.canUpdate = function()
{
  // if a targeting session is active, do not allow AI decision-making.
  if (JABS_TargetingManager.isActive()) return false;

  // perform original logic.
  return J.ABS.EXT.TARGETING.Aliased.JABS_AiManager.get('canUpdate')
    .call(this);
};
//endregion JABS_AiManager (targeting pause)
