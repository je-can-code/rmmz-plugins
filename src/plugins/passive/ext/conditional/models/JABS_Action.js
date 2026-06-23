//region JABS_Action
import SkillResolutionStateRemovalManager from '../managers/SkillResolutionStateRemovalManager.js';

/**
 * Extends {@link #preCleanupHook}.<br/>
 * Also processes {@code removeOnSkillResolution} rules when this action expires.
 * Fires regardless of whether the action hit any targets, covering both
 * hit-until-exhausted and whiff-and-expire cases.
 */
J.PASSIVE.EXT.CONDITIONAL.Aliased.JABS_Action.set('preCleanupHook', JABS_Action.prototype.preCleanupHook);
JABS_Action.prototype.preCleanupHook = function()
{
  // perform original logic.
  J.PASSIVE.EXT.CONDITIONAL.Aliased.JABS_Action.get('preCleanupHook')
    .call(this);

  // resolve the underlying game battler from this action's caster.
  const casterBattler = this.getCaster().getBattler();

  // process any resolution-triggered state removals now that this action has fully expired.
  SkillResolutionStateRemovalManager.process(casterBattler, this.getBaseSkill().id);
};
//endregion JABS_Action
