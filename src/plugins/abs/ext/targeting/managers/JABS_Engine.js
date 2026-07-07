//region JABS_Engine (targeting pause)
import JABS_TargetingManager from './JABS_TargetingManager.js';

/**
 * Extends {@link JABS_Engine#canUpdateInput}.<br/>
 * Also blocks JABS input processing while a targeting session is active. This does not affect
 * the targeting session's own confirm/cancel polling, which happens independently via
 * {@link JABS_TargetingManager.update}.
 */
J.ABS.EXT.TARGETING.Aliased.JABS_Engine.set('canUpdateInput', JABS_Engine.prototype.canUpdateInput);
JABS_Engine.prototype.canUpdateInput = function()
{
  // if a targeting session is active, do not process JABS input.
  if (JABS_TargetingManager.isActive()) return false;

  // perform original logic.
  return J.ABS.EXT.TARGETING.Aliased.JABS_Engine.get('canUpdateInput')
    .call(this);
};
//endregion JABS_Engine (targeting pause)
