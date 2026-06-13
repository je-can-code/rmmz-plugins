//region Game_Action
import AutoApplyStateManager from '../managers/AutoApplyStateManager.js';
import AutoExecuteSkillManager from '../managers/AutoExecuteSkillManager.js';
/**
 * Extends {@link #apply}.<br/>
 * When the target is critically hit, runs {@code whenCrit} auto-apply rules on the victim.
 */
J.PASSIVE.EXT.CONDITIONAL.Aliased.Game_Action.set('apply', Game_Action.prototype.apply);
Game_Action.prototype.apply = function(target)
{
  // perform original logic.
  J.PASSIVE.EXT.CONDITIONAL.Aliased.Game_Action.get('apply')
    .call(this, target);

  // victim-only reactive buffs — distinct from J-CriticalFactors onCritApply (attacker lands crit).
  if (target.result().critical === false) return;

  AutoApplyStateManager.scheduleCritTriggers(target);
  AutoExecuteSkillManager.scheduleCritTriggers(target);
};
//endregion Game_Action