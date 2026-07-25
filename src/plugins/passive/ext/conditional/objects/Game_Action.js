//region Game_Action
import AutoApplyStateManager from '../managers/AutoApplyStateManager.js';
import AutoExecuteSkillManager from '../managers/AutoExecuteSkillManager.js';
/**
 * Extends {@link #apply}.<br/>
 * When the target is critically hit, runs {@code whenCrit} auto-apply rules on the victim. When the
 * target suffers a glancing blow instead, runs {@code whenGlanced} auto-apply rules on the victim-
 * the two are mutually exclusive on any single hit (see {@link Game_Action#executeJabsAction}).
 */
J.PASSIVE.EXT.CONDITIONAL.Aliased.Game_Action.set('apply', Game_Action.prototype.apply);
Game_Action.prototype.apply = function(target)
{
  // perform original logic.
  J.PASSIVE.EXT.CONDITIONAL.Aliased.Game_Action.get('apply')
    .call(this, target);

  // read the result once so both branches below inspect the same snapshot.
  const result = target.result();

  // victim-only reactive buffs — distinct from J-CriticalFactors onCritApply (attacker lands crit).
  if (result.critical === true)
  {
    AutoApplyStateManager.scheduleCritTriggers(target);
    AutoExecuteSkillManager.scheduleCritTriggers(target);
  }

  // glancing-blow retaliation — e.g. "fire a skill back at the attacker when I only get grazed".
  if (result.glancing === true)
  {
    AutoApplyStateManager.scheduleGlancingTriggers(target);
    AutoExecuteSkillManager.scheduleGlancingTriggers(target);
  }
};
//endregion Game_Action