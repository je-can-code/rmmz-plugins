//region JABS_Engine
import AutoApplyStateManager from './AutoApplyStateManager.js';
import AutoExecuteSkillManager from './AutoExecuteSkillManager.js';
import AutoInflictStateManager from './AutoInflictStateManager.js';

/**
 * Extends {@link JABS_Engine#handleDefeatedEnemy}.<br/>
 * Fires {@code onKill} rules on the battler that defeated the enemy.
 */
J.PASSIVE.EXT.CONDITIONAL.Aliased.JABS_Engine.set('handleDefeatedEnemy', JABS_Engine.prototype.handleDefeatedEnemy);
JABS_Engine.prototype.handleDefeatedEnemy = function(defeatedTarget, caster)
{
  // perform original logic (rewards, loot, death cry, event controls).
  J.PASSIVE.EXT.CONDITIONAL.Aliased.JABS_Engine.get('handleDefeatedEnemy')
    .call(this, defeatedTarget, caster);

  // environmental or unattributed defeats have no caster to credit a kill to.
  if (!caster) return;

  // unwrap to the underlying Game_Battler for rule evaluation.
  const casterBattler = caster.getBattler();

  if (!casterBattler) return;

  AutoApplyStateManager.scheduleKillTriggers(casterBattler);
  AutoExecuteSkillManager.scheduleKillTriggers(casterBattler);
};

/**
 * Extends {@link JABS_Engine#checkKnockback}.<br/>
 * Fires {@code onKnockback} autoInflictState rules on the battler that knocked the target back,
 * applying the configured payload state onto the knocked-back target.
 */
J.PASSIVE.EXT.CONDITIONAL.Aliased.JABS_Engine.set('checkKnockback', JABS_Engine.prototype.checkKnockback);
JABS_Engine.prototype.checkKnockback = function(action, target)
{
  // perform original logic (resistance checks, direction/distance math, actually moving the target).
  J.PASSIVE.EXT.CONDITIONAL.Aliased.JABS_Engine.get('checkKnockback')
    .call(this, action, target);

  // unwrap both sides to their underlying Game_Battlers for rule evaluation.
  const casterBattler = action.getCaster()
    .getBattler();
  const targetBattler = target.getBattler();

  if (!casterBattler || !targetBattler) return;

  AutoInflictStateManager.scheduleKnockbackTriggers(casterBattler, targetBattler);
};

/**
 * Extends {@link JABS_Engine#postExecuteSkillEffects}.<br/>
 * Fires {@code onDamageDealt} rules on the caster after landing damage on an opposing battler.
 * Reuses the same result-field check {@link JABS_Engine#applyAggroEffects} already performs here.
 */
J.PASSIVE.EXT.CONDITIONAL.Aliased.JABS_Engine.set(
  'postExecuteSkillEffects',
  JABS_Engine.prototype.postExecuteSkillEffects
);
JABS_Engine.prototype.postExecuteSkillEffects = function(action, target)
{
  // perform original logic (aggro application).
  J.PASSIVE.EXT.CONDITIONAL.Aliased.JABS_Engine.get('postExecuteSkillEffects')
    .call(this, action, target);

  // only opposing hits count as "dealing damage to an enemy"- friendly fire doesn't qualify.
  const caster = action.getCaster();

  if (!JABS_TeamRules.isOpposed(caster.getTeam(), target.getTeam())) return;

  // the result is fully populated by this point- gameAction.apply already ran.
  const result = target.getBattler()
    .result();
  const dealtDamage = result.hpDamage > 0 || result.mpDamage > 0 || result.tpDamage > 0;

  if (!dealtDamage) return;

  // unwrap to the underlying Game_Battler for rule evaluation.
  const casterBattler = caster.getBattler();

  if (!casterBattler) return;

  AutoApplyStateManager.scheduleDamageDealtTriggers(casterBattler);
  AutoExecuteSkillManager.scheduleDamageDealtTriggers(casterBattler);
};
//endregion JABS_Engine
