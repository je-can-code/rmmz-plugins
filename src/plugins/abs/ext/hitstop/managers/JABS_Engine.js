//region JABS_Engine (impact hook)
import JABS_HitstopManager from './JABS_HitstopManager.js';
/**
 * Extends {@link JABS_Engine.postPrimaryBattleEffects}.<br/>
 * Also applies local hitstop to attacker, target, and the delivering action event.
 */
J.ABS.EXT.HITSTOP.Aliased.JABS_Engine.set('postPrimaryBattleEffects', JABS_Engine.prototype.postPrimaryBattleEffects);
JABS_Engine.prototype.postPrimaryBattleEffects = function(action, target)
{
  // perform original logic.
  J.ABS.EXT.HITSTOP.Aliased.JABS_Engine.get('postPrimaryBattleEffects')
    .call(this, action, target);

  // attempt to apply hitstop for this impact.
  this.tryApplyHitstop(action, target);
};

/**
 * Attempts to apply hitstop for this impact.
 * @param {JABS_Action} action The action affecting the target.
 * @param {JABS_Battler} target The target receiving the action.
 */
JABS_Engine.prototype.tryApplyHitstop = function(action, target)
{
  // grab the attacker.
  const attacker = action.getCaster();

  // apply using manager; this computes duration and handles decay.
  JABS_HitstopManager.apply(action, attacker, target);
};
//endregion JABS_Engine (impact hook)