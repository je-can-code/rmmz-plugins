//region Game_Action
import JABS_AiManager from './../managers/JABS_AiManager.js';

/**
 * Overwrites {@link #subject}.<br/>
 * On the map there is no context of a $gameTroop. This means that an
 * action must accommodate both enemy and actor alike. In order to handle
 * this, we check to see which id was set and respond accordingly.
 *
 * NOTE: The subject represents the battler who is performing this action.
 * @returns {Game_Actor|Game_Enemy}
 */
// TODO: should this be updated to use the battler's UUIDs instead?
Game_Action.prototype.subject = function()
{
  // initialize the subject.
  let subject;

  // determine if there was an actor id stored.
  if (this._subjectActorId > 0)
  {
    // assign the subject to be the given actor.
    subject = $gameActors.actor(this._subjectActorId);
  }
  // it must've been an enemy.
  else
  {
    // assign the subject to be the given enemy.
    subject = $gameEnemies.enemy(this._subjectEnemyIndex);
  }

  // return the determined subject.
  return subject;
};

/**
 * Overwrites {@link #setSubject}.<br/>
 * On the map there is no context of a $gameTroop. This means that an
 * action must accommodate both enemy and actor alike. In order to handle
 * this, we check to see which id was set and respond accordingly.
 *
 * @param {Game_Actor|Game_Enemy} subject The subject to assign to this action.
 */
// TODO: should this be updated to use the battler's UUIDs instead?
Game_Action.prototype.setSubject = function(subject)
{
  // fancy if-else block.
  switch (true)
  {
    case (subject.isActor()):
      // update the battler ids to show the caster is an actor.
      this._subjectActorId = subject.battlerId();
      this._subjectEnemyIndex = -1;
      break;
    case (subject.isEnemy()):
      // update the battler ids to show the caster is an enemy.
      this._subjectEnemyIndex = subject.battlerId();
      this._subjectActorId = 0;
      break;
  }
};

//region action application
/**
 * Overwrites {@link #apply}.<br/>
 * Adjusts how a skill is applied to a target in the context of JABS.
 */
J.ABS.Aliased.Game_Action.set('apply', Game_Action.prototype.apply);
Game_Action.prototype.apply = function(target)
{
  // let JABS handle this.
  this.applyJabsAction(target);
};

/**
 * Applies a skill against the target.
 * This is effectively Game_Action.apply, but with some adjustments to accommodate
 * the fact that we're using this in an action battle system instead.
 * @param {Game_Battler} target The target the skill is being applied to.
 */
Game_Action.prototype.applyJabsAction = function(target)
{
  // delegate to the canonical virtual apply routine.
  this.applyVirtualJabsAction(target);
};

/**
 * The canonical JABS action application routine.
 * Performs pre-apply work, executes if a hit, and updates last-target bookkeeping.
 * This is the single place that defines the apply flow for map actions.
 * @param {Game_Actor|Game_Enemy} target The target of this action.
 */
Game_Action.prototype.applyVirtualJabsAction = function(target)
{
  // do the preliminary
  this.preApplyAction(target);

  const result = target.result();

  // validate we landed a hit.
  if (result.isHit())
  {
    // applies common events that may be a part of a skill's effect.
    this.executeJabsAction(target);
  }
  // check if this was evaded.
  else if (result.isEvaded())
  {
    // execute evasion hooks.
    target.onEvade(this.subject(), this);
  }

  // also update the last target hit.
  this.updateLastTarget(target);
};

/**
 * Handles the pre-apply effects, such as setting up the result with some
 * additional information ahead of execution.
 * @param {Game_Actor|Game_Enemy} target The target of this action.
 */
Game_Action.prototype.preApplyAction = function(target)
{
  // always clear the caster's result (???).
  this.subject()
    .clearResult();

  const result = target.result();

  // NOTE: the action is already cleared as a part of the "executeSkillEffects" function.
  //  in the base RMMZ code, this happens as a part of the "apply" function, though.
  // result.clear();

  // record if the skill was actually used.
  result.used = this.testApply(target);

  // record if the hit was actually evaded.
  result.evaded = this.isHitEvaded(target);

  // record if the usable was a physical-type.
  result.physical = this.isPhysical();

  // record if the usable was a drain-type.
  result.drain = this.isDrain();
};

/**
 * Executes the action, including calculating the various numbers and applying
 * the effects against the target.
 * @param {Game_Actor|Game_Enemy} target The target of this action.
 */
Game_Action.prototype.executeJabsAction = function(target)
{
  // grab the result again.
  const result = target.result();

  // check if there is a damage formula.
  if (this.item().damage.type > 0)
  {
    // a glancing blow cannot also be a critical hit; the two outcomes are mutually exclusive.
    result.critical = result.glancing
      ? false
      : this.isHitCritical(target);

    // calculate the damage from the formula.
    let value = this.makeDamageValue(target, result.critical);

    // glancing blows deal only a fraction of the calculated damage.
    if (result.glancing)
    {
      value = this.applyGlancingDamageReduction(value);
    }

    // actually apply the damage to the target.
    this.executeDamage(target, value);
  }

  // add the subject who is applying the state as a parameter for tracking purposes.
  this.item()
    .effects
    .forEach(effect => this.applyItemEffect(target, effect));

  // applies on-cast/on-hit effects, like gaining TP or producing on-cast states.
  this.applyItemUserEffect(target);

  // applies common events that may be a part of a skill's effect.
  this.applyGlobal();
};

/**
 * Calculates whether or not this action is evaded by the target.
 * @param {Game_Battler} target The target the skill is being applied to.
 * @returns {boolean} True if this action was evaded, false otherwise.
 */
Game_Action.prototype.isHitEvaded = function(target)
{
  // combine the attacker's hit rate and the target's evade rate into a single percent chance-
  // both are already-summed fractional rates (0.05 = 5%), so this converts to a 0-100+ percent.
  const hitChancePercent = (1 + this.itemHit() - this.itemEva(target)) * 100;

  // the attacker wants this roll to succeed (their own luck plus this skill's own bonus);
  // the target wants it to fail (their own curse resisting the hit).
  const attackerPositiveRolls = this.subject().getPositiveRollsForSkill(this.item());
  const targetNegativeRolls = target.getNegativeRolls();

  // roll once for whether the hit actually connects.
  const isHit = RPGManager.fateOf100(this.subject(), hitChancePercent, 1 + attackerPositiveRolls, targetNegativeRolls);

  // evaded is simply the inverse of having landed the hit.
  return isHit === false;
};

/**
 * Calculates whether or not this action is a critical hit against the target.
 * @param {Game_Battler} target The target the skill is being applied to.
 * @returns {boolean} True if this action was critical, false otherwise.
 */
Game_Action.prototype.isHitCritical = function(target)
{
  // itemCri() already yields the fully-combined, floored-at-0 crit rate (0.05 = 5%);
  // convert to a percent and roll once for whether this hit qualifies as a critical.
  const attackerPositiveRolls = this.subject().getPositiveRollsForSkill(this.item());
  const targetNegativeRolls = target.getNegativeRolls();

  const isCritical = RPGManager.fateOf100(
    this.subject(), this.itemCri(target) * 100, 1 + attackerPositiveRolls, targetNegativeRolls);

  return isCritical;
};

/**
 * Overwrites {@link #itemHit}.<br/>
 * This overwrite converts the success rate of a skill into the value
 * representing what percent of your hit is used in the hit chance formula.
 * @returns {number}
 */
Game_Action.prototype.itemHit = function()
{
  // success is a multiplier against the hitrate.
  const successFactor = this.item().successRate * 0.01;

  // calculate the hitrate factor.
  const hitRate = successFactor * this.subject().hit;

  // return the hitrate factor.
  return hitRate;
};

/**
 * Extends {@link #makeDamageValue}.<br/>
 * Includes consideration of guard effects of the target.
 * Also applies state damage multipliers and cast-time direct damage bonuses before guard,
 * then skill history bonuses from both thisSkillHistoryBonus and skillHistoryBonus tags.
 */
J.ABS.Aliased.Game_Action.set('makeDamageValue', Game_Action.prototype.makeDamageValue);
Game_Action.prototype.makeDamageValue = function(target, critical)
{
  // perform original logic.
  let base = J.ABS.Aliased.Game_Action.get('makeDamageValue')
    .call(this, target, critical);

  // apply state-based damage multipliers before guard so flat guard reduction
  // cannot fully negate the bonus (guard bites into the already-amplified pool).
  base = this.applyStateDamageMultipliers(base, target);

  // scale direct damage by resolved cast duration when cast-time bonus tags are present.
  base = this.applyCastTimeDamageBonus(base);

  // validate we have a target.
  if (this.canHandleGuardEffects(target))
  {
    // grab the guarding
    const guardingJabsBattler = JABS_AiManager.getBattlerByUuid(target.getUuid());

    // apply guard damage modifiers.
    base = this.handleGuardEffects(base, guardingJabsBattler);
  }

  // apply any skill history bonuses derived from both tag scopes.
  base = this.applySkillHistoryBonus(base);

  // return the damage output.
  return base;
};

//region guard-related damage modification
/**
 * Determines whether or not the action should consider guard effects.
 * @param {Game_Battler} target The target considering guard effects.
 * @returns {boolean} True if guard effects should be considered, false otherwise.
 */
Game_Action.prototype.canHandleGuardEffects = function(target)
{
  // if there is no target, then the target cannot guarding.
  if (!target) return false;

  // handle guarding!
  return true;
};

/**
 * Handles all guard-related effects, such as parrying or guarding.
 * @param {number} damage The amount of damage before damage reductions.
 * @param {JABS_Battler} jabsBattler The battler potentially doing guard things.
 * @returns {number} The amount of damage after damage reductions from guarding.
 */
Game_Action.prototype.handleGuardEffects = function(damage, jabsBattler)
{
  // check if the battler is parrying; parrying takes priority over guarding.
  if (jabsBattler.parrying())
  {
    // process the parry functionality.
    this.processParry(jabsBattler);

    // calculate the reduced amount from guarding.
    const parryReducedDamage = this.calculateParryDamageReduction(jabsBattler, damage);

    // return the reduced amount.
    return parryReducedDamage;
  }

  // check if the battler is guarding.
  if (jabsBattler.guarding())
  {
    // process the guard functionality.
    this.processGuard(jabsBattler);

    // calculate the reduced amount from guarding.
    const guardReducedDamage = this.calculateGuardDamageReduction(jabsBattler, damage);

    // return the reduced amount.
    return guardReducedDamage;
  }

  // if there was no guarding or parrying happen, just return the original damage.
  return damage;
};

/**
 * Processes the action as a parry, mitigating all damage, along
 * with any additional side effects.
 * @param {JABS_Battler} jabsBattler The battler that is parrying.
 */
Game_Action.prototype.processParry = function(jabsBattler)
{
  // shorthand the underlying battler.
  const battler = jabsBattler.getBattler();

  // grab the action result.
  const actionResult = battler.result();

  // nullify the result via parry.
  actionResult.parried = true;

  // perform on-parry effects.
  this.onParry(jabsBattler);

  // reset the player's guarding.
  jabsBattler.setParryWindow(0);
  jabsBattler.setGuardSkillId(0);
};

/**
 * A hook to perform all side effects of a successful parry.
 * Extensions may alias this to add telemetry, custom visuals, or other behavior.
 * @param {JABS_Battler} jabsBattler The battler that is parrying.
 */
Game_Action.prototype.onParry = function(jabsBattler)
{
  // handle tp generation from parrying.
  const guardSkillTp = this.getTpFromGuardSkill(jabsBattler) * 10;

  // gain 10x of the tp from the guard skill when parrying.
  jabsBattler.getBattler()
    .gainTp(guardSkillTp);

  // play the parry animation (0 = disabled via plugin parameters).
  const parryAnimationId = J.ABS.Metadata.ParryCharacterAnimationId;
  if (parryAnimationId > 0)
  {
    jabsBattler.getCharacter()
      .requestAnimation(parryAnimationId);
  }
};

/**
 * Calculates the damage reduction from parrying.
 * Active (timed, skill-driven) parry retains full negation as the mastery-layer reward.
 * @param {JABS_Battler} jabsBattler The battler that is parrying.
 * @param {number} originalDamage The original amount of damage.
 * @returns {number} The damage after reduction.
 */
// eslint-disable-next-line no-unused-vars
Game_Action.prototype.calculateParryDamageReduction = function(jabsBattler, originalDamage)
{
  // active parry fully negates the hit; return zero damage.
  return 0;
};

/**
 * Scales the given damage value down to the glancing blow fraction defined by plugin parameters.
 * @param {number} originalDamage The calculated damage before the glancing reduction.
 * @returns {number} The reduced damage, rounded to the nearest integer.
 */
Game_Action.prototype.applyGlancingDamageReduction = function(originalDamage)
{
  // retrieve the configured fraction of damage a glancing blow deals.
  const damageFactor = J.ABS.Metadata.GlancingBlowDamageFactor;

  // scale the damage down and round to the nearest integer.
  return Math.round(originalDamage * damageFactor);
};

/**
 * Processes the action as a guard, reducing damage along with any
 * additional side effects.
 * @param {JABS_Battler} jabsBattler The battler that is guar1ding.
 */
Game_Action.prototype.processGuard = function(jabsBattler)
{
  // perform on-guard effects.
  this.onGuard(jabsBattler);
};

/**
 * A hook to perform actions on-guard.
 * @param {JABS_Battler} jabsBattler The battler that is guarding.
 */
Game_Action.prototype.onGuard = function(jabsBattler)
{
  // gain any tp associated with defending.
  const guardSkillTp = this.getTpFromGuardSkill(jabsBattler);

  // gain 100% of the tp from the guard skill when guarding.
  jabsBattler.getBattler()
    .gainTp(guardSkillTp);
};

/**
 * Calculates the damage reduction from guarding.
 * @param {JABS_Battler} jabsBattler The battler that is guarding.
 * @param {number} originalDamage The original amount of damage.
 * @returns {number} The damage after reduction.
 */
Game_Action.prototype.calculateGuardDamageReduction = function(jabsBattler, originalDamage)
{
  // assign the damage to a local variable because good coding practices.
  let modifiedDamage = originalDamage;

  // reduce the damage accordingly per the guard data- percent then flat.
  modifiedDamage = this.applyPercentDamageReduction(modifiedDamage, jabsBattler);
  modifiedDamage = this.applyFlatDamageReduction(modifiedDamage, jabsBattler);

  // return the guard-modified damage.
  return modifiedDamage;
};

/**
 * Gets the TP from the guard skill that was performed.
 * @param {JABS_Battler} jabsBattler The battler that is defending.
 * @return {number} The TP
 */
Game_Action.prototype.getTpFromGuardSkill = function(jabsBattler)
{
  // handle tp generation from the guard skill.
  const skillId = jabsBattler.getGuardSkillId();

  // grab the potentially extended guard skill.
  const skill = jabsBattler.getSkill(skillId);

  // if timing is just a hair off, the guarding skill won't be available.
  if (!skill) return 0;

  // return the tp associated with the guard skill.
  return skill.tpGain;
};

/**
 * Reduces damage of a value if defending- by a flat amount.
 * @param {number} base The base damage value to modify.
 * @param {JABS_Battler} jabsBattler The battler.
 * @returns {number} The damage after reduction.
 */
Game_Action.prototype.applyFlatDamageReduction = function(base, jabsBattler)
{
  // calculate the flat reduction.
  const reduction = parseFloat(jabsBattler.flatGuardReduction());

  // grab the action result for updating.
  const result = jabsBattler.getBattler()
    .result();

  // take note of the flat amount reduced in the action result.
  result.reduced += reduction;

  // prevent reducing the damage into healing instead.
  const flatReducedDamage = Math.max((base + reduction), 0);

  // return the reduced amount of damage.
  return flatReducedDamage;
};

/**
 * Reduces damage of a value if defending- by a percent amount.
 * @param {number} baseDamage The base damage value to modify.
 * @param {JABS_Battler} jabsBattler The battler reducing damage.
 * @returns {number} The damage after reduction.
 */
Game_Action.prototype.applyPercentDamageReduction = function(baseDamage, jabsBattler)
{
  // calculate the percent reduction.
  const reduction = parseFloat(baseDamage - ((100 + jabsBattler.percGuardReduction()) / 100) * baseDamage);

  // grab the action result for updating.
  const actionResult = jabsBattler.getBattler()
    .result();

  // take note of the percent amount reduced in the action result.
  actionResult.reduced -= reduction;

  // prevent reducing the damage into healing instead.
  const percentReducedDamage = Math.max((baseDamage - reduction), 0);

  // return the reduced amount of damage.
  return percentReducedDamage;
};
//endregion guard-related damage modification

//region state-related effect application
/**
 * Extends {@link #itemEffectAddState}.<br/>
 * Adds a conditional check to see if adding state-related effects is allowed
 * against the target.
 * @param {Game_Battler} target The target battler potentially being afflicted.
 * @param {RPG_UsableEffect} effect The effect being applied to the target.
 */
J.ABS.Aliased.Game_Action.set('itemEffectAddState', Game_Action.prototype.itemEffectAddState);
Game_Action.prototype.itemEffectAddState = function(target, effect)
{
  // check if we are able to apply state-related effects.
  if (!this.canItemEffectAddState(target, effect)) return;

  // perform original logic.
  J.ABS.Aliased.Game_Action.get('itemEffectAddState')
    .call(this, target, effect);
};

/**
 * Determines whether or not the state from the effect of a skill or item can be applied
 * against the target. This is not a check of state resistances, but a check of whether
 * or not the application of state effects of any kind are allowed.
 *
 * By default, if an action is parried, then its states are not applied to the target.
 * @param {Game_Battler} target The target battler potentially being afflicted.
 * @param {RPG_UsableEffect} effect The effect being applied to the target.
 */
// eslint-disable-next-line no-unused-vars
Game_Action.prototype.canItemEffectAddState = function(target, effect)
{
  // if the target parried the result, then its state-related effects do not apply.
  const result = target.result();
  if (result && result.parried) return false;

  // see if the state-related effects are applied!
  return true;
};

/**
 * Overwrites {@link #itemEffectAddAttackState}.<br/>
 * When a "Normal Attack" effect is used and a state is applied, then
 * all of the battler's attack states have an opportunity to be applied
 * based on all the various rates and calculations.
 *
 * DEV NOTE:
 * It was frustrating that this needed an entire replacement just to
 * inject the battler.
 * @param {Game_Battler} target The target.
 * @param {RPG_UsableEffect} effect The potential effect to add.
 */
Game_Action.prototype.itemEffectAddAttackState = function(target, effect)
{
  // grab all the attacker's state ids.
  const attackerStateIds = this.subject()
    .attackStates();

  // if there are no attacker state ids, then don't process anything.
  if (!attackerStateIds.length) return;

  // extract the date point.
  const { value1: chance } = effect;

  // an iterator function for how to check and apply a state.
  const forEacher = stateId =>
  {
    // handle the application of the state- if applicable.
    this.handleApplyState(target, stateId, chance, true);
  };

  // run the logic against all the attacker's own states.
  attackerStateIds.forEach(forEacher, this);
};

/**
 * Overwrites {@link #itemEffectAddNormalState}.<br/>
 * Updates the method to be more modifyable, and considers attackers
 * when applying states.
 *
 * Passes the attacker as another data point to the application of state.
 * @param {Game_Battler} target The target.
 * @param {RPG_UsableEffect} effect The potential effect to add.
 */
Game_Action.prototype.itemEffectAddNormalState = function(target, effect)
{
  // extract the data points.
  const {
    value1: chance,
    dataId: stateId
  } = effect;

  // handle the application of the state- if applicable.
  this.handleApplyState(target, stateId, chance, false);
};

/**
 * Overwrites {@link #itemEffectRemoveState}.<br/>
 * Potentially removes the state, leveraging our {@link RPGManager.chanceIn100}.
 * @param {Game_Battler} target The target having the state removed.
 * @param {RPG_UsableEffect} effect The effect containing state data for removal.
 */
Game_Action.prototype.itemEffectRemoveState = function(target, effect)
{
  // extract the data points.
  const {
    value1: chance,
    dataId: stateId
  } = effect;

  // convert the fractional value into a rounded base-100 roll.
  const d100 = Math.round(chance * 100);

  // the caster wants the removal to succeed; the target's own curse can still resist it, even
  // when the effect is a beneficial cleanse- a cursed battler's good luck fails them too.
  const casterPositiveRolls = this.subject().getPositiveRollsForSkill(this.item());
  const targetNegativeRolls = target.getNegativeRolls();

  // check if RNGesus blesses this battler.
  const isRemoved = RPGManager.fateOf100(this.subject(), d100, 1 + casterPositiveRolls, targetNegativeRolls);

  if (isRemoved === true)
  {
    // remove the given state.
    target.removeState(stateId);

    // flag the action as a success.
    this.makeSuccess(target);
  }
};

/**
 * Applies a state when the shouldApplyState roll passes for this action.
 * @param {Game_Battler} target The target.
 * @param {number} stateId The id of the state being applied.
 * @param {number} chance The base chance the state will be applied.
 * @param {boolean} useAttackerStateRate Whether or not the attacker's state rate should apply.
 */
Game_Action.prototype.handleApplyState = function(target, stateId, chance, useAttackerStateRate)
{
  // resolve how many times this proc's action should execute (Accumulate Mode/Encore aware).
  const procCount = this.resolveApplyStateProcCount(target, stateId, chance, useAttackerStateRate);

  // apply the state once per success.
  for (let i = 0; i < procCount; i++)
  {
    this.applyStateEffect(target, stateId);
  }
};

/**
 * Calculates the fully-modified d100 chance of applying the given state to the target, shared
 * by both {@link #shouldApplyState} and {@link #resolveApplyStateProcCount}.
 * @param {Game_Battler} target The battler being afflicted with the state.
 * @param {number} stateId The id of the state being applied.
 * @param {number} baseChance The decimal base chance of applying the state.
 * @param {boolean=} useAttackerStateRate Whether or not to apply the attacker's state rate.
 * @returns {number} The rounded base-100 chance of application.
 */
Game_Action.prototype.calculateStateApplicationD100 = function(target, stateId, baseChance, useAttackerStateRate = false)
{
  // initialize the application modifier to 100%.
  let applicationModifier = 1.00;

  // check if we're applying the attacker's state rate against the base chance.
  if (useAttackerStateRate)
  {
    // apply the chance of success for this particular state from the attacker.
    applicationModifier *= this.subject()
      .attackStatesRate(stateId);
  }

  // determine whether or not we should apply target resistances for this action.
  if (this.shouldTargetApplyResistances())
  {
    // apply the target's own state resistance rates against the state.
    applicationModifier *= target.stateRate(stateId);

    // apply the target's own type-scoped resistance rate against the state.
    applicationModifier *= target.stateTypeResistRate(stateId);
  }

  // apply the action's luck modifier based on the two battlers.
  applicationModifier *= this.lukEffectRate(target);

  // calculate the chance.
  const calculatedChance = baseChance * applicationModifier;

  // convert the result into a rounded base-100 number.
  return Math.round(calculatedChance * 100);
};

/**
 * Determines whether or not the state should be applied to the target.
 * @param {Game_Battler} target The battler being afflicted with the state.
 * @param {number} stateId The id of the state being applied.
 * @param {number} baseChance The decimal base chance of applying the state.
 * @param {boolean=} useAttackerStateRate Whether or not to apply the attacker's state rate.
 * @returns {boolean} True if the state should be applied to the target, false otherwise.
 */
Game_Action.prototype.shouldApplyState = function(target, stateId, baseChance, useAttackerStateRate = false)
{
  const d100 = this.calculateStateApplicationD100(target, stateId, baseChance, useAttackerStateRate);

  // the caster wants the state to stick; the target's own curse can undermine that success.
  const casterPositiveRolls = this.subject().getPositiveRollsForSkill(this.item());
  const targetNegativeRolls = target.getNegativeRolls();

  // roll d100.
  return RPGManager.fateOf100(this.subject(), d100, 1 + casterPositiveRolls, targetNegativeRolls);
};

/**
 * Resolves how many times the state application should execute, folding in the caster's
 * Accumulate Mode and Encore repeats.
 * @param {Game_Battler} target The battler being afflicted with the state.
 * @param {number} stateId The id of the state being applied.
 * @param {number} baseChance The decimal base chance of applying the state.
 * @param {boolean=} useAttackerStateRate Whether or not to apply the attacker's state rate.
 * @returns {number} How many times the state application should execute; 0 means it did not proc.
 */
Game_Action.prototype.resolveApplyStateProcCount = function(target, stateId, baseChance, useAttackerStateRate = false)
{
  const d100 = this.calculateStateApplicationD100(target, stateId, baseChance, useAttackerStateRate);

  // the caster wants the state to stick; the target's own curse can undermine that success.
  const casterPositiveRolls = this.subject().getPositiveRollsForSkill(this.item());
  const targetNegativeRolls = target.getNegativeRolls();

  return RPGManager.resolveProcCount(this.subject(), d100, 1 + casterPositiveRolls, targetNegativeRolls);
};

/**
 * Determines whether or not the direct application of a state should be
 * resisted by a target.
 *
 * The default implementation is to ignore resistances only for skills/items that
 * are of type "certain hit" in the database.
 * @returns {boolean} True if the resistances should be applied, false otherwise.
 */
Game_Action.prototype.shouldTargetApplyResistances = function()
{
  // certain hits ignore target's state application modifiers and luck impacts!
  if (this.isCertainHit()) return false;

  return true;
};

/**
 * Applies a state to a given target.
 * @param {Game_Battler} target The target having the state applied to.
 * @param {number} stateId The id of the staate being applied.
 */
Game_Action.prototype.applyStateEffect = function(target, stateId)
{
  // apply the state with the attacker and the skill/item currently executing.
  target.addState(stateId, this.subject(), this.item());

  // flag the result as "success" of applying a state.
  this.makeSuccess(target);
};
//endregion state-related effect application

//region state damage multipliers
/**
 * Applies damage multipliers derived from the current states of the target.
 * Combines perDebuffBuff (per-negative-state bonus), bonusDamageIfState (specific-state bonus),
 * bonusDamageIfStateType (type-classifier presence bonus), bonusDamagePerStateType
 * (type-classifier count bonus), bonusDamagePerStateStack (named-state stack-depth bonus),
 * thisBonusDamagePerStateStack (skill-scoped named-state stack-depth bonus),
 * bonusDamageForMyStateCount (authored-distinct-state count bonus),
 * vulnerabilityPerAuthoredStateStack (authored-state stack bonus collected by any attacker),
 * bonusDamage (unconditional caster-wide bonus), thisBonusDamage (unconditional skill-scoped
 * bonus), and bonusDamageIfTargetHpBelow/thisBonusDamageIfTargetHpBelow (target-missing-hp
 * execute bonus).
 * Applied before guard effects so flat guard reduction cannot fully cancel the state-exploitation bonus.
 * @param {number} baseDamage The damage value before state multipliers.
 * @param {Game_Battler} target The target whose states are evaluated.
 * @returns {number} The damage value after state multipliers have been applied.
 */
Game_Action.prototype.applyStateDamageMultipliers = function(baseDamage, target)
{
  // non-positive damage has no multiplicative state bonus.
  if (baseDamage <= 0) return baseDamage;

  // sum contributions from all eight tag types.
  const debuffPct = this.calculatePerDebuffBonusPct(target);
  const specificPct = this.calculateBonusIfStatePct(target);
  const thisSpecificPct = this.calculateThisBonusDamageIfStatePct(target);
  const selfStatePct = this.calculateBonusIfSelfStatePct();
  const thisSelfStatePct = this.calculateThisBonusDamageIfSelfStatePct();
  const flatPct = this.calculateBonusDamagePct();
  const thisFlatPct = this.calculateThisBonusDamagePct();
  const typePresencePct = this.calculateBonusIfStateTypePct(target);
  const typeCountPct = this.calculatePerStateTypePct(target);
  const stackDepthPct = this.calculatePerStateStackPct(target);
  const thisStackDepthPct = this.calculateThisBonusDamagePerStateStackPct(target);
  const myStateCountPct = this.calculateBonusForMyStateCountPct(target);
  const thisMyStateCountPct = this.calculateThisBonusForMyStateCountPct(target);
  const authoredVulnerabilityPct = this.calculateAuthoredVulnerabilityStackPct(target);
  const targetHpBelowPct = this.calculateBonusIfTargetHpBelowPct(target);
  const thisTargetHpBelowPct = this.calculateThisBonusDamageIfTargetHpBelowPct(target);

  const combinedPct = debuffPct + specificPct + thisSpecificPct + selfStatePct + thisSelfStatePct
    + flatPct + thisFlatPct + typePresencePct + typeCountPct + stackDepthPct + thisStackDepthPct
    + myStateCountPct + thisMyStateCountPct + authoredVulnerabilityPct + targetHpBelowPct
    + thisTargetHpBelowPct;

  // if no source contributed a bonus, return damage unchanged.
  if (combinedPct === 0) return baseDamage;

  // build the final multiplier and apply it.
  return Math.round(baseDamage * (1 + combinedPct / 100));
};

/**
 * Calculates the total damage bonus percent from perDebuffBuff tags on the caster's notes.
 * Counts every active state on the target carrying the <type:negative> classifier and multiplies
 * the summed N value by that count.
 * @param {Game_Battler} target The target whose negative states are counted.
 * @returns {number} The total bonus percent from this tag type.
 */
Game_Action.prototype.calculatePerDebuffBonusPct = function(target)
{
  // sum all perDebuffBuff:N values from the caster's note sources.
  const totalN = RPGManager.getSumFromAllNotesByRegex(
    this.subject()
      .getAllNotes(),
    J.ABS.RegExp.PerDebuffBuff
  );

  // if no tags exist on this caster, there is no bonus.
  if (totalN === 0) return 0;

  // count the target's active states carrying the <type:negative> classifier.
  const debuffCount = target.states()
    .filter(s => s.isNegativeType())
    .length;

  // multiply the per-debuff rate by the number of debuffs on the target.
  return totalN * debuffCount;
};

/**
 * Calculates the total damage bonus percent from bonusDamageIfState tags on the caster's notes.
 * Each tag contributes its PCT value if the target currently has the specified state active.
 * Multiple tags for different state ids each fire independently and stack additively.
 * @param {Game_Battler} target The target whose active states are checked.
 * @returns {number} The total bonus percent from all matching state tags.
 */
Game_Action.prototype.calculateBonusIfStatePct = function(target)
{
  // collect all [STATE_ID, PCT] pairs from every note source on the caster.
  // getArraysFromNotesByRegex with tryParse=true returns already-parsed [number, number] arrays.
  const allPairs = this.subject()
    .getAllNotes()
    .flatMap(note => RPGManager.getArraysFromNotesByRegex(note, J.ABS.RegExp.BonusDamageIfState));

  // if no tags are present anywhere, there is nothing to sum.
  if (!allPairs.length) return 0;

  // accumulate the percent from each tag whose state is active on the target.
  let totalPct = 0;
  allPairs.forEach(([ stateId, percent ]) =>
  {
    // check if the target currently has this specific state.
    if (target.isStateAffected(stateId))
    {
      totalPct += percent;
    }
  });

  return totalPct;
};

/**
 * Calculates the total damage bonus percent from thisBonusDamageIfState tags on this action's skill.
 * Reads from this.item() only — fires only when this specific skill is the action being resolved.
 * Multiple tags for different state ids each fire independently and stack additively.
 * @param {Game_Battler} target The target whose active states are checked.
 * @returns {number} The total bonus percent from all matching state tags on this skill.
 */
Game_Action.prototype.calculateThisBonusDamageIfStatePct = function(target)
{
  // read all [STATE_ID, PCT] pairs from the executing skill's own note only.
  // nullIfEmpty = false: getArraysFromNotesByRegex returns [] when the tag is absent.
  const allPairs = RPGManager.getArraysFromNotesByRegex(
    this.item(),
    J.ABS.RegExp.ThisBonusDamageIfState
  );

  // if no tags are present on this skill, there is no bonus.
  if (!allPairs.length) return 0;

  // accumulate the percent from each tag whose state is active on the target.
  let totalPct = 0;
  allPairs.forEach(([ stateId, percent ]) =>
  {
    // check if the target currently has this specific state.
    if (target.isStateAffected(stateId))
    {
      totalPct += percent;
    }
  });

  return totalPct;
};

/**
 * Calculates the total damage bonus percent from bonusDamageIfSelfState tags on the caster's notes.
 * Each tag contributes its PCT value if the CASTER currently has the specified state active.
 * Multiple tags for different state ids each fire independently and stack additively.
 * @returns {number} The total bonus percent from all matching self-state tags.
 */
Game_Action.prototype.calculateBonusIfSelfStatePct = function()
{
  // collect all [STATE_ID, PCT] pairs from every note source on the caster.
  const allPairs = this.subject()
    .getAllNotes()
    .flatMap(note => RPGManager.getArraysFromNotesByRegex(note, J.ABS.RegExp.BonusDamageIfSelfState));

  // if no tags are present anywhere, there is nothing to sum.
  if (!allPairs.length) return 0;

  // accumulate the percent from each tag whose state is active on the caster.
  let totalPct = 0;
  allPairs.forEach(([ stateId, percent ]) =>
  {
    // check if the caster currently has this specific state.
    if (this.subject()
      .isStateAffected(stateId))
    {
      totalPct += percent;
    }
  });

  return totalPct;
};

/**
 * Calculates the total damage bonus percent from thisBonusDamageIfSelfState tags on this action's skill.
 * Reads from this.item() only — fires only when this specific skill is the action being resolved.
 * Each tag contributes its PCT value if the CASTER currently has the specified state active.
 * Multiple tags for different state ids each fire independently and stack additively.
 * @returns {number} The total bonus percent from all matching self-state tags on this skill.
 */
Game_Action.prototype.calculateThisBonusDamageIfSelfStatePct = function()
{
  // read all [STATE_ID, PCT] pairs from the executing skill's own note only.
  const allPairs = RPGManager.getArraysFromNotesByRegex(
    this.item(),
    J.ABS.RegExp.ThisBonusDamageIfSelfState
  );

  // if no tags are present on this skill, there is no bonus.
  if (!allPairs.length) return 0;

  // accumulate the percent from each tag whose state is active on the caster.
  let totalPct = 0;
  allPairs.forEach(([ stateId, percent ]) =>
  {
    // check if the caster currently has this specific state.
    if (this.subject()
      .isStateAffected(stateId))
    {
      totalPct += percent;
    }
  });

  return totalPct;
};

/**
 * Calculates the unconditional flat percent damage bonus from bonusDamage tags on the caster's
 * notes. Fires on every action the caster performs, with no target-state or self-state check.
 * Reads from getAllNotes() (actor, class, equips, states), so it applies caster-wide rather than
 * being scoped to one skill — the sibling tag for that is thisBonusDamage.
 * @returns {number} The total bonus percent from all bonusDamage tags on the caster, or 0.
 */
Game_Action.prototype.calculateBonusDamagePct = function()
{
  // sum all bonusDamage:PCT values from every note source on the caster.
  return RPGManager.getSumFromAllNotesByRegex(
    this.subject()
      .getAllNotes(),
    J.ABS.RegExp.BonusDamage
  );
};

/**
 * Calculates the unconditional flat percent damage bonus from the thisBonusDamage tag on this
 * action's skill. Fires whenever this skill is the action being resolved, with no state check.
 * Reads from this.item() only — does not affect any other skill in the caster's kit.
 * @returns {number} The bonus percent, or 0 if the tag is absent.
 */
Game_Action.prototype.calculateThisBonusDamagePct = function()
{
  // read the PCT value directly from the executing skill's own note.
  // nullIfEmpty = true so we can distinguish tag-absent from tag-present-with-zero.
  const pct = RPGManager.getNumberFromNoteByRegex(
    this.item(),
    J.ABS.RegExp.ThisBonusDamage,
    true
  );

  // if the tag is not present on this skill, there is no bonus.
  if (pct === null) return 0;

  return pct;
};

/**
 * Resolves a battler's current HP as a whole-number percent of their max HP.
 * Rounded to match the same convention used by J-Passive-Conditional's hp threshold gates.
 * @param {Game_Battler} battler The battler whose hp percent is resolved.
 * @returns {number} A rounded percent 0-100; zero when max hp is zero or less.
 */
Game_Action.prototype.resolveHpPercent = function(battler)
{
  // guard divide-by-zero on dead or zero-max battlers.
  if (battler.mhp <= 0) return 0;

  return Math.round((battler.hp / battler.mhp) * 100);
};

/**
 * Calculates the total damage bonus percent from bonusDamageIfTargetHpBelow tags on the
 * caster's notes. Each tag opens its gate once the target's current hp percent is at or under
 * THRESHOLD_PCT, then scales its contribution by PCT_PER_POINT for every percentage point the
 * target is currently under that threshold- an "execute" style bonus that grows continuously as
 * the target's hp keeps dropping, not a flat one-time bonus. Multiple tags each fire independently
 * and stack additively.
 * @param {Game_Battler} target The target whose current hp percent is checked.
 * @returns {number} The total bonus percent from all matching target-hp tags.
 */
Game_Action.prototype.calculateBonusIfTargetHpBelowPct = function(target)
{
  // collect all [THRESHOLD_PCT, PCT_PER_POINT] pairs from every note source on the caster.
  const allPairs = this.subject()
    .getAllNotes()
    .flatMap(note => RPGManager.getArraysFromNotesByRegex(note, J.ABS.RegExp.BonusDamageIfTargetHpBelow));

  // if no tags are present anywhere, there is nothing to sum.
  if (!allPairs.length) return 0;

  // resolve the target's current hp once- every tag's gate check reads the same snapshot.
  const targetHpPct = this.resolveHpPercent(target);

  // accumulate the scaled percent from each tag whose threshold the target is currently under.
  let totalPct = 0;
  allPairs.forEach(([ thresholdPct, pctPerPoint ]) =>
  {
    // this tag's gate hasn't opened- target hp is still at or above the threshold.
    if (targetHpPct > thresholdPct) return;

    // scale the bonus by how many percentage points below the threshold the target currently is.
    totalPct += pctPerPoint * (thresholdPct - targetHpPct);
  });

  return totalPct;
};

/**
 * Calculates the total damage bonus percent from thisBonusDamageIfTargetHpBelow tags on this
 * action's skill. Reads from this.item() only — fires only when this specific skill is the
 * action being resolved. Same gate-then-scale behavior as {@link calculateBonusIfTargetHpBelowPct},
 * scoped to one skill instead of the caster's whole kit.
 * @param {Game_Battler} target The target whose current hp percent is checked.
 * @returns {number} The total bonus percent from all matching target-hp tags on this skill.
 */
Game_Action.prototype.calculateThisBonusDamageIfTargetHpBelowPct = function(target)
{
  // read all [THRESHOLD_PCT, PCT_PER_POINT] pairs from the executing skill's own note only.
  const allPairs = RPGManager.getArraysFromNotesByRegex(
    this.item(),
    J.ABS.RegExp.ThisBonusDamageIfTargetHpBelow
  );

  // if no tags are present on this skill, there is no bonus.
  if (!allPairs.length) return 0;

  // resolve the target's current hp once- every tag's gate check reads the same snapshot.
  const targetHpPct = this.resolveHpPercent(target);

  // accumulate the scaled percent from each tag whose threshold the target is currently under.
  let totalPct = 0;
  allPairs.forEach(([ thresholdPct, pctPerPoint ]) =>
  {
    // this tag's gate hasn't opened- target hp is still at or above the threshold.
    if (targetHpPct > thresholdPct) return;

    // scale the bonus by how many percentage points below the threshold the target currently is.
    totalPct += pctPerPoint * (thresholdPct - targetHpPct);
  });

  return totalPct;
};

/**
 * Checks whether the target has at least one active state carrying the given type
 * classifier. The comparison is case-insensitive.
 * @param {Game_Battler} target The target whose active states are checked.
 * @param {string} type The type classifier to look for.
 * @returns {boolean} True if any active state on the target carries this type.
 */
Game_Action.prototype.targetHasActiveStateType = function(target, type)
{
  // check the target's active states for a case-insensitive type classifier match.
  return target.states()
    .some(state => state.types()
      .some(stateType => stateType.toLowerCase() === type.toLowerCase()));
};

/**
 * Calculates the total damage bonus percent from bonusDamageIfStateType tags on the caster's notes.
 * Each tag contributes its PCT value if the target has at least one active state carrying the
 * specified type classifier. Multiple tags for different types each fire independently and stack
 * additively.
 * @param {Game_Battler} target The target whose active states are checked.
 * @returns {number} The total bonus percent from all matching type classifier tags.
 */
Game_Action.prototype.calculateBonusIfStateTypePct = function(target)
{
  // collect all [TYPE, PCT] pairs from every note source on the caster.
  // getArraysFromNotesByRegex with tryParse=true returns already-parsed [string, number] arrays.
  const allPairs = this.subject()
    .getAllNotes()
    .flatMap(note => RPGManager.getArraysFromNotesByRegex(note, J.ABS.RegExp.BonusDamageIfStateType));

  // if no tags are present anywhere, there is nothing to sum.
  if (!allPairs.length) return 0;

  // accumulate the percent from each tag whose type is present on the target.
  let totalPct = 0;
  allPairs.forEach(([ type, percent ]) =>
  {
    // check if the target currently has any state carrying this type.
    if (this.targetHasActiveStateType(target, type))
    {
      totalPct += percent;
    }
  });

  return totalPct;
};

/**
 * Calculates the total damage bonus percent from bonusDamagePerStateType tags on the caster's notes.
 * Each tag's PCT is multiplied by the count of distinct active states on the target carrying the
 * specified type classifier, then summed across all tags.
 * @param {Game_Battler} target The target whose active states are counted.
 * @returns {number} The total bonus percent from all type classifier tags.
 */
Game_Action.prototype.calculatePerStateTypePct = function(target)
{
  // collect all [TYPE, PCT] pairs from every note source on the caster.
  // getArraysFromNotesByRegex with tryParse=true returns already-parsed [string, number] arrays.
  const allPairs = this.subject()
    .getAllNotes()
    .flatMap(note => RPGManager.getArraysFromNotesByRegex(note, J.ABS.RegExp.BonusDamagePerStateType));

  // if no tags are present anywhere, there is nothing to sum.
  if (!allPairs.length) return 0;

  // accumulate percent contributions, scaled by matching state count per tag.
  let totalPct = 0;
  allPairs.forEach(([ type, percent ]) =>
  {
    // count the target's distinct active states that carry this type classifier.
    const matchingStateCount = target.states()
      .filter(state => state.types()
        .some(stateType => stateType.toLowerCase() === type.toLowerCase()))
      .length;

    // multiply this tag's rate by the number of matching states on the target.
    totalPct += percent * matchingStateCount;
  });

  return totalPct;
};

/**
 * Calculates the total damage bonus percent from bonusDamagePerStateStack tags on the caster's
 * notes. Each tag's PCT is multiplied by the current stack count of the one named state on the
 * target, then summed across all tags. Reads the live tracker directly rather than target.states()
 * because that array duplicates entries per stack for visualization- reading it here would double-count.
 * @param {Game_Battler} target The target whose named-state stack count is read.
 * @returns {number} The total bonus percent from all matching named-state tags.
 */
Game_Action.prototype.calculatePerStateStackPct = function(target)
{
  // collect all [STATE_ID, PCT] pairs from every note source on the caster.
  const allPairs = this.subject()
    .getAllNotes()
    .flatMap(note => RPGManager.getArraysFromNotesByRegex(note, J.ABS.RegExp.BonusDamagePerStateStack));

  // if no tags are present anywhere, there is nothing to sum.
  if (!allPairs.length) return 0;

  // accumulate percent contributions, scaled by the named state's current stack count.
  let totalPct = 0;
  allPairs.forEach(([ stateId, percent ]) =>
  {
    // skip states that are not actually currently afflicting the target.
    if (!target.isStateAffected(stateId)) return;

    // pull the live tracker to read its current stack count.
    const trackedState = $jabsEngine.getJabsStateByUuidAndStateId(target.getUuid(), stateId);

    // an untracked-but-flagged-affected state has no stack count to read.
    if (!trackedState) return;

    // multiply this tag's rate by the state's current stack count.
    totalPct += percent * trackedState.stackCount;
  });

  return totalPct;
};

/**
 * Calculates the total damage bonus percent from thisBonusDamagePerStateStack tags on this
 * action's skill. Reads from this.item() only — fires only when this specific skill is the
 * action being resolved. Each tag's PCT is multiplied by the current stack count of the one
 * named state on the target, then summed across all tags. Reads the live tracker directly
 * rather than target.states() because that array duplicates entries per stack for
 * visualization- reading it here would double-count.
 * @param {Game_Battler} target The target whose named-state stack count is read.
 * @returns {number} The total bonus percent from all matching named-state tags on this skill.
 */
Game_Action.prototype.calculateThisBonusDamagePerStateStackPct = function(target)
{
  // read all [STATE_ID, PCT] pairs from the executing skill's own note only.
  const allPairs = RPGManager.getArraysFromNotesByRegex(
    this.item(),
    J.ABS.RegExp.ThisBonusDamagePerStateStack
  );

  // if no tags are present on this skill, there is no bonus.
  if (!allPairs.length) return 0;

  // accumulate percent contributions, scaled by the named state's current stack count.
  let totalPct = 0;
  allPairs.forEach(([ stateId, percent ]) =>
  {
    // skip states that are not actually currently afflicting the target.
    if (!target.isStateAffected(stateId)) return;

    // pull the live tracker to read its current stack count.
    const trackedState = $jabsEngine.getJabsStateByUuidAndStateId(target.getUuid(), stateId);

    // an untracked-but-flagged-affected state has no stack count to read.
    if (!trackedState) return;

    // multiply this tag's rate by the state's current stack count.
    totalPct += percent * trackedState.stackCount;
  });

  return totalPct;
};

/**
 * Counts the target's distinct currently-active states that this battler personally applied.
 * Reads the live tracker map directly (one entry per distinct state id) rather than
 * target.states(), which duplicates entries per stack for visualization.
 * @param {Game_Battler} target The target whose authored states are counted.
 * @returns {number} The count of distinct states on the target authored by this battler.
 */
Game_Action.prototype.countTargetStatesAuthoredByCaster = function(target)
{
  // shorthand the caster's uuid for comparison against each tracked state's source.
  const casterUuid = this.subject()
    .getUuid();

  // grab the live map of tracked states afflicting the target, keyed by state id.
  const trackedStates = $jabsEngine.getJabsStatesByUuid(target.getUuid());

  // accumulate the count of distinct states authored by the caster.
  let count = 0;
  trackedStates.forEach(trackedState =>
  {
    // skip trackers that are lingering post-expiration but not yet purged.
    if (!target.isStateAffected(trackedState.stateId)) return;

    // skip states this caster did not personally apply.
    if (trackedState.source.getUuid() !== casterUuid) return;

    count++;
  });

  return count;
};

/**
 * Calculates the total damage bonus percent from bonusDamageForMyStateCount tags on the caster's
 * notes. Lives on a passive state, so it is always active regardless of which skill is executing.
 * @param {Game_Battler} target The target whose authored state count is read.
 * @returns {number} The total bonus percent from this tag type.
 */
Game_Action.prototype.calculateBonusForMyStateCountPct = function(target)
{
  // sum all bonusDamageForMyStateCount:N values from the caster's note sources.
  const perStatePct = RPGManager.getSumFromAllNotesByRegex(
    this.subject()
      .getAllNotes(),
    J.ABS.RegExp.BonusDamageForMyStateCount
  );

  // if no tags exist on this caster, there is no bonus.
  if (perStatePct === 0) return 0;

  // multiply the per-state rate by the count of distinct states this caster authored.
  return perStatePct * this.countTargetStatesAuthoredByCaster(target);
};

/**
 * Calculates the total damage bonus percent from thisBonusDamageForMyStateCount on this action's
 * skill. Reads from this.item() only- fires only when this specific skill is the action resolving.
 * @param {Game_Battler} target The target whose authored state count is read.
 * @returns {number} The total bonus percent from this tag on this skill.
 */
Game_Action.prototype.calculateThisBonusForMyStateCountPct = function(target)
{
  // read the PCT value directly from the executing skill's own note.
  // nullIfEmpty = true so we can distinguish tag-absent from tag-present-with-zero.
  const perStatePct = RPGManager.getNumberFromNoteByRegex(
    this.item(),
    J.ABS.RegExp.ThisBonusDamageForMyStateCount,
    true
  );

  // if the tag is not present on this skill, there is no bonus.
  if (perStatePct === null) return 0;

  // multiply the per-state rate by the count of distinct states this caster authored.
  return perStatePct * this.countTargetStatesAuthoredByCaster(target);
};

/**
 * Calculates the total damage bonus percent from vulnerabilityPerAuthoredStateStack tags.
 * Unlike every other bonus in this region, this one is not read from this.subject()- it is read
 * from each tracked state's own source battler, so the bonus applies no matter who is currently
 * dealing the damage. This lets one battler's kit turn their applied debuffs into a standing
 * vulnerability that any ally can then exploit.
 * @param {Game_Battler} target The target whose tracked states are inspected.
 * @returns {number} The total bonus percent contributed by every authored, tagged state stack.
 */
Game_Action.prototype.calculateAuthoredVulnerabilityStackPct = function(target)
{
  // grab every tracked state currently afflicting the target, keyed by state id.
  const trackedStates = $jabsEngine.getJabsStatesByUuid(target.getUuid());

  // accumulate the bonus percent across every tracked state's author.
  let totalPct = 0;
  trackedStates.forEach(trackedState =>
  {
    // skip trackers that are lingering post-expiration but not yet purged.
    if (!target.isStateAffected(trackedState.stateId)) return;

    // the author is whoever originally applied this particular tracked state.
    const author = trackedState.source;

    // a state with no discernible author cannot carry an authored vulnerability.
    if (!author) return;

    // read the vulnerability rate off the author's own notes- not the current attacker's.
    const perStackPct = RPGManager.getSumFromAllNotesByRegex(
      author.getAllNotes(),
      J.ABS.RegExp.VulnerabilityPerAuthoredStateStack);

    // if the author carries no such tag, this tracked state contributes nothing.
    if (perStackPct === 0) return;

    // multiply the author's rate by this specific state's current stack count.
    totalPct += perStackPct * trackedState.stackCount;
  });

  return totalPct;
};
//endregion state damage multipliers

//region skill history bonus
/**
 * Applies any skill history bonuses to the given base damage amount.
 * Reads from two sources: thisSkillHistoryBonus on this.item() (skill-specific)
 * and skillHistoryBonus from getAllNotes() (passive/equipment/state sources).
 * If neither source yields a bonus the base damage is returned unchanged.
 * @param {number} baseDamage The damage value before history bonuses.
 * @returns {number} The damage value after history bonuses have been applied.
 */
Game_Action.prototype.applySkillHistoryBonus = function(baseDamage)
{
  // negative or zero base damage has no multiplicative history bonus.
  if (baseDamage <= 0) return baseDamage;

  // grab the subject's uuid for querying the skill history log.
  const uuid = this.subject()
    .getUuid();

  // if there is no uuid, this is not a JABS battler and there is nothing to do.
  if (!uuid) return baseDamage;

  // calculate the bonus percent from the "this" skill's own tag.
  const thisPct = this.calculateThisSkillHistoryBonusPct(uuid);

  // calculate the combined bonus percent from all passive/state/equip sources.
  const generalPct = this.calculateGeneralSkillHistoryBonusPct(uuid);

  // if both sources contributed no bonus, return the damage unchanged.
  const combinedPct = thisPct + generalPct;
  if (combinedPct === 0) return baseDamage;

  // build the final multiplier and apply it.
  const multiplier = 1 + (combinedPct / 100);
  return Math.round(baseDamage * multiplier);
};

/**
 * Calculates the total bonus percent from the thisSkillHistoryBonus tag on this action's item.
 * Only fires when this specific skill is the action being resolved.
 * History scope is limited to this skill's own id.
 * @param {string} uuid The caster's uuid for log queries.
 * @returns {number} The total bonus percent contribution from this tag.
 */
Game_Action.prototype.calculateThisSkillHistoryBonusPct = function(uuid)
{
  // grab the skill item being resolved.
  const item = this.item();

  // pull the raw bracket text for the "this" variant from the skill's own note.
  // nullIfEmpty = true so we get null back when the tag is absent.
  const rawTag = RPGManager.getStringFromNoteByRegex(
    item,
    J.ABS.RegExp.ThisSkillHistoryBonus,
    true
  );

  // if the tag is not present on this skill, there is no bonus.
  if (!rawTag) return 0;

  // parse the bracket content — [WINDOW, PCT, COUNT_MODE].
  const parsed = this.parseSkillHistoryBracket(rawTag);

  // if the bracket was malformed, skip this tag.
  if (!parsed) return 0;

  const {
    window,
    pct,
    countMode
  } = parsed;

  // query the history log: scope is this specific skill id only.
  const count = $jabsEngine.querySkillExecutionLog(uuid, item.id, 0, window, countMode);

  return pct * count;
};

/**
 * Calculates the total bonus percent from all skillHistoryBonus tags on the subject's notes.
 * Reads from getAllNotes() and sums contributions from every matching tag.
 * @param {string} uuid The caster's uuid for log queries.
 * @returns {number} The summed bonus percent from all passive sources.
 */
Game_Action.prototype.calculateGeneralSkillHistoryBonusPct = function(uuid)
{
  // accumulate the total general bonus percent from all matching tags.
  let totalPct = 0;

  // collect the raw bracket text from every note source for the general variant tag-
  // deliberately not routed through getArraysFromNotesByRegex's JSON-ish parsing, since
  // parseGeneralSkillHistoryBracket below does its own parsing of the bracket content.
  const rawTags = RPGManager.getStringsFromAllNotesByRegex(
    this.subject()
      .getAllNotes(),
    J.ABS.RegExp.SkillHistoryBonus
  );

  // if there are no tags anywhere, there is nothing to sum.
  if (!rawTags.length) return 0;

  // iterate over each tag capture and accumulate its contribution.
  rawTags.forEach(rawTag =>
  {
    // parse the bracket content — [TYPE_ID, WINDOW, PCT, COUNT_MODE].
    const parsed = this.parseGeneralSkillHistoryBracket(rawTag);

    // if the bracket was malformed, skip this tag.
    if (!parsed) return;

    const {
      typeId,
      window,
      pct,
      countMode
    } = parsed;

    // query the history: scope is any skill id, filtered by type.
    const count = $jabsEngine.querySkillExecutionLog(uuid, 0, typeId, window, countMode);

    totalPct += pct * count;
  });

  return totalPct;
};

/**
 * Parses the bracket string from a thisSkillHistoryBonus tag into its component values.
 * Expected format: [WINDOW, PCT, COUNT_MODE]
 * @param {string} bracket The captured bracket string, e.g. "[3, 8, streak]".
 * @returns {{window:number, pct:number, countMode:string}|null} Parsed values, or null if malformed.
 */
Game_Action.prototype.parseSkillHistoryBracket = function(bracket)
{
  // strip the outer square brackets and split on comma to get each part.
  const parts = bracket.replace(/[[\]]/g, '')
    .split(',')
    .map(p => p.trim());

  // validate that we have exactly the three required parts.
  if (parts.length !== 3) return null;

  // coerce the numeric parts and read the count mode string.
  const window = Number(parts[0]);
  const pct = Number(parts[1]);
  const countMode = parts[2].toLowerCase();

  return {
    window,
    pct,
    countMode
  };
};

/**
 * Parses the bracket string from a skillHistoryBonus tag into its component values.
 * Expected format: [TYPE_ID, WINDOW, PCT, COUNT_MODE]
 * @param {string} bracket The captured bracket string, e.g. "[7, 5, 5, streak]".
 * @returns {{typeId:number, window:number, pct:number, countMode:string}|null} Parsed values, or null if malformed.
 */
Game_Action.prototype.parseGeneralSkillHistoryBracket = function(bracket)
{
  // strip the outer square brackets and split on comma to get each part.
  const parts = bracket.replace(/[[\]]/g, '')
    .split(',')
    .map(p => p.trim());

  // validate that we have exactly the four required parts.
  if (parts.length !== 4) return null;

  // coerce the numeric parts and read the count mode string.
  const typeId = Number(parts[0]);
  const window = Number(parts[1]);
  const pct = Number(parts[2]);
  const countMode = parts[3].toLowerCase();

  return {
    typeId,
    window,
    pct,
    countMode
  };
};
//endregion skill history bonus

//region cast time damage bonus
/**
 * Stores the resolved cast duration in frames on this action payload.
 * Stamped once when the parent JABS action is created; shared by volley spokes
 * and every hit tick from the same skill execution.
 * @param {number} frames The cast duration in frames (0 when the skill is instant).
 */
Game_Action.prototype.setResolvedCastTimeFrames = function(frames)
{
  this._resolvedCastTimeFrames = Math.max(0, Math.round(frames));
};

/**
 * Returns the resolved cast duration stamped on this action payload.
 * @returns {number} Cast frames, or 0 when unstamped or instant.
 */
Game_Action.prototype.getResolvedCastTimeFrames = function()
{
  if (this._resolvedCastTimeFrames === undefined) return 0;

  return this._resolvedCastTimeFrames;
};

/**
 * Applies direct damage scaling from cast-time bonus tags on the caster and skill.
 * Uses the stamped resolved cast duration; does not affect healing, recovery, or slip DoT.
 * @param {number} baseDamage The damage value before cast-time scaling.
 * @returns {number} The damage value after cast-time scaling has been applied.
 */
Game_Action.prototype.applyCastTimeDamageBonus = function(baseDamage)
{
  // non-positive damage has no multiplicative cast-time bonus.
  if (baseDamage <= 0) return baseDamage;

  // only skills participate; items and other usables are out of scope.
  if (!this.isSkill()) return baseDamage;

  // only hp and mp damage effect types qualify (not recovery or drain-only edge cases).
  const damageType = this.item().damage.type;
  if (damageType !== 1 && damageType !== 2) return baseDamage;

  // instant skills carry no cast duration and earn no bonus.
  const castFrames = this.getResolvedCastTimeFrames();
  if (castFrames <= 0) return baseDamage;

  // sum percent-per-second contributions from both tag scopes.
  const thisPctPerSec = this.calculateThisCastTimeDamageBonusPctPerSec();
  const generalPctPerSec = this.calculateGeneralCastTimeDamageBonusPctPerSec();
  const combinedPctPerSec = thisPctPerSec + generalPctPerSec;

  // if neither source contributed a rate, return the damage unchanged.
  if (combinedPctPerSec === 0) return baseDamage;

  // convert stamped frames to seconds and build the total bonus percent.
  const castSeconds = castFrames / 60;
  const totalBonusPct = combinedPctPerSec * castSeconds;

  // build the final multiplier and apply it.
  const multiplier = 1 + (totalBonusPct / 100);
  return Math.round(baseDamage * multiplier);
};

/**
 * Calculates the percent-per-second bonus from thisCastTimeDamageBonus on this skill only.
 * @returns {number} The summed percent-per-second rate from the skill note.
 */
Game_Action.prototype.calculateThisCastTimeDamageBonusPctPerSec = function()
{
  // pull the skill row being resolved.
  const item = this.item();

  // sum every matching tag on this skill's note.
  return RPGManager.getSumFromAllNotesByRegex([ item ], J.ABS.RegExp.ThisCastTimeDamageBonus);
};

/**
 * Calculates the percent-per-second bonus from castTimeDamageBonus on all note sources.
 * @returns {number} The summed percent-per-second rate from passive/equipment/state sources.
 */
Game_Action.prototype.calculateGeneralCastTimeDamageBonusPctPerSec = function()
{
  // sum every matching tag across the caster's full note stack.
  return RPGManager.getSumFromAllNotesByRegex(
    this.subject()
      .getAllNotes(),
    J.ABS.RegExp.CastTimeDamageBonus
  );
};
//endregion cast time damage bonus
//endregion action application
//endregion Game_Action