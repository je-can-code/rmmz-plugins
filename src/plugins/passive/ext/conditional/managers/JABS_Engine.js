//region JABS_Engine
import AutoApplyStateManager from './AutoApplyStateManager.js';
import AutoExecuteSkillManager from './AutoExecuteSkillManager.js';
import AutoModifyCooldownManager from './AutoModifyCooldownManager.js';
import AutoInflictStateManager from './AutoInflictStateManager.js';
import SkillExecutionStateRemovalManager from './SkillExecutionStateRemovalManager.js';
import SkillExecutionStateToggleManager from './SkillExecutionStateToggleManager.js';

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
  AutoModifyCooldownManager.scheduleKillTriggers(casterBattler);
};

/**
 * Extends {@link JABS_Engine#onKnockback}.<br/>
 * Fires {@code onKnockback} autoInflictState rules on the battler whose hit knocked the target back,
 * applying the configured payload state onto the knocked-back target. J-ABS calls this only for a hit
 * that actually moved its target, pushed away or pulled in, so a hit that moved nothing fires nothing.
 * @param {JABS_Action} action The action whose hit moved the target.
 * @param {JABS_Battler} target The map battler that was moved.
 */
J.PASSIVE.EXT.CONDITIONAL.Aliased.JABS_Engine.set('onKnockback', JABS_Engine.prototype.onKnockback);
JABS_Engine.prototype.onKnockback = function(action, target)
{
  // perform original logic.
  J.PASSIVE.EXT.CONDITIONAL.Aliased.JABS_Engine.get('onKnockback')
    .call(this, action, target);

  // unwrap both sides to their underlying Game_Battlers for rule evaluation.
  const casterBattler = action.getCaster()
    .getBattler();
  const targetBattler = target.getBattler();

  // the caster's onKnockback rules land their payload on the battler that was moved.
  AutoInflictStateManager.scheduleKnockbackTriggers(casterBattler, targetBattler);
};

/**
 * Extends {@link JABS_Engine#postExecuteSkillEffects}.<br/>
 * Fires {@code onDamageDealt} rules on the caster after landing damage on an opposing battler, and
 * {@code onWeaponHit} rules too when the hit counts as a weapon hit. Both hand the rules the battler that was
 * hit, so a direct payload one of them fires lands on whoever was struck.
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

  // every damaging hit fires onDamageDealt, aimed at the battler it landed on.
  AutoApplyStateManager.scheduleDamageDealtTriggers(casterBattler, target);
  AutoExecuteSkillManager.scheduleDamageDealtTriggers(casterBattler, target);

  // onWeaponHit is narrower than onDamageDealt- only what counts as a weapon hit fires it.
  if (this.isWeaponHitAction(action) === false) return;

  // a weapon hit fires onWeaponHit as well, aimed at the same battler.
  AutoApplyStateManager.scheduleWeaponHitTriggers(casterBattler, target);
  AutoExecuteSkillManager.scheduleWeaponHitTriggers(casterBattler, target);
};

/**
 * Whether a hit from this action counts as a weapon hit, for {@code onWeaponHit} rules.<br/>
 * Anything fired from the Mainhand or Offhand slot does: the basic attack and its combo chain. A skill cast from
 * any other slot counts only when it carries {@code <countsAsWeaponHit>}, the way a blade flurry would, so an
 * arbitrary skill (e.g. a nuke hitting the whole map) never sets off a "weapon" follow-up. A forced payload
 * carries the global cooldown key rather than a slot, so the follow-up a weapon hit fires never counts as one
 * itself, and can never fire itself again.
 * @param {JABS_Action} action The action whose hit just landed.
 * @returns {boolean}
 */
JABS_Engine.prototype.isWeaponHitAction = function(action)
{
  // the basic attack and its combo chain are bound to the two weapon slots.
  const cooldownType = action.getCooldownType();
  if (cooldownType === JABS_Button.Mainhand || cooldownType === JABS_Button.Offhand) return true;

  // a skill cast from anywhere else counts only when it was authored to.
  return action.getBaseSkill().countsAsWeaponHit;
};

/**
 * Extends {@link JABS_Engine#paySkillCosts}.<br/>
 * Once an executing skill's cost is paid, settles its caster's states that answer to that execution: a state a
 * {@code toggleStateOnSkillExecution} rule names is armed or spent, then a state a {@code removeOnSkillExecution}
 * rule strips is peeled.
 * <p>
 * Every paid execution makes this call exactly once- a decided cast, a dodge, a channel's vessel- and no forced
 * payload ever makes it, so a retaliation, a channel's tick and an auto-executed skill never reach these rules. It
 * is also the last moment a state can still shape the execution that ends it: the cast time was read when the skill
 * was decided, and the cost has just been paid. Toggling runs first so that a state both toggled and peeled by the
 * same execution ends up stripped, rather than armed again forever.
 * </p>
 * @param {JABS_Battler} caster The battler executing the skill.
 * @param {JABS_Action} action The action whose skill was just paid for.
 */
J.PASSIVE.EXT.CONDITIONAL.Aliased.JABS_Engine.set('paySkillCosts', JABS_Engine.prototype.paySkillCosts);
JABS_Engine.prototype.paySkillCosts = function(caster, action)
{
  // perform original logic.
  J.PASSIVE.EXT.CONDITIONAL.Aliased.JABS_Engine.get('paySkillCosts')
    .call(this, caster, action);

  // the rules live on the states of the battler underneath the map battler.
  const battler = caster.getBattler();
  const skill = action.getBaseSkill();

  // arm or spend what this execution toggles, now that the cost those states had a say in is settled.
  SkillExecutionStateToggleManager.process(battler, skill);

  // then peel what this execution consumes.
  SkillExecutionStateRemovalManager.process(battler, skill.id);
};
//endregion JABS_Engine
