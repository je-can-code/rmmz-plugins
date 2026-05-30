//region Game_Action
/**
 * Extends the `initialize()` function to include initializing our new target tracker.
 * Note that the target tracker will remain null on this action until after our custom logic
 * within `apply()` has been executed (before aliased function logic).
 */
J.CRIT.Aliased.Game_Action.set('initialize', Game_Action.prototype.initialize);
Game_Action.prototype.initialize = function(subject, forcing)
{
  // perform original logic.
  J.CRIT.Aliased.Game_Action.get('initialize')
    .call(this, subject, forcing);

  /**
   * The target of this action.
   * This remains null until the `apply()` function is executed.
   * @type {Game_Actor|Game_Enemy|null}
   */
  this._targetBattler = null;
};

/**
 * Sets the target battler of this action.
 * This is primarily used in functions that do not normally have access to the target,
 * such as the `applyCritical()` function.
 * @param {Game_Actor|Game_Enemy|null} targetBattler The target of this action.
 */
Game_Action.prototype.setTargetBattler = function(targetBattler)
{
  this._targetBattler = targetBattler;
};

/**
 * Gets the current target of this action.
 * This will always yield `null` if this is accessed before `apply()` has started running.
 * @returns {Game_Actor|Game_Enemy|null}
 */
Game_Action.prototype.targetBattler = function()
{
  return this._targetBattler;
};

/**
 * Extends {@link #apply}.<br/>
 * Tracks the target for use in critical calculations, then fires any on-crit state effects
 * when the result confirms a critical hit landed.
 */
J.CRIT.Aliased.Game_Action.set('apply', Game_Action.prototype.apply);
Game_Action.prototype.apply = function(target)
{
  // set the target for more universal use throughout this action's calculations.
  this.setTargetBattler(target);

  // perform original logic.
  J.CRIT.Aliased.Game_Action.get('apply')
    .call(this, target);

  // if the hit registered as a critical, trigger any on-crit state effects.
  if (target.result().critical)
  {
    this.applyOnCriticalStateEffects(target);
  }
};

/**
 * Applies all on-crit state effects — states to the target and states to self — from both
 * the executing skill and any global crit tags present anywhere on the attacker.
 * Guarded by J-ABS availability since on-chance effects depend on {@link JABS_OnChanceEffect}.
 * @param {Game_Actor|Game_Enemy} target The target that received the critical hit.
 */
Game_Action.prototype.applyOnCriticalStateEffects = function(target)
{
  // on-chance state effects require J-ABS to resolve JABS_OnChanceEffect objects.
  if (!J.ABS) return;

  // apply states to the target sourced from this skill and the attacker's global notes.
  this.applyOnCriticalTargetStates(target);

  // apply states to the attacker sourced from this skill and the attacker's global notes.
  this.applyOnCriticalSelfStates();
};

/**
 * Rolls and applies all on-crit states that target the enemy that was just critically hit.
 * Checks both the executing skill ({@link thisCritApply}) and all attacker notes ({@link onCritApply}).
 * @param {Game_Actor|Game_Enemy} target The target to apply states to.
 */
Game_Action.prototype.applyOnCriticalTargetStates = function(target)
{
  // apply any per-skill on-crit target states first.
  this.rollAndApplyCritStates(target, this.thisCritTargetStates());

  // then apply any global (attacker-wide) on-crit target states.
  this.rollAndApplyCritStates(target, this.onCritTargetStates());
};

/**
 * Rolls and applies all on-crit states that target the attacker themselves.
 * Checks both the executing skill ({@link thisCritSelf}) and all attacker notes ({@link onCritSelf}).
 */
Game_Action.prototype.applyOnCriticalSelfStates = function()
{
  const attacker = this.subject();

  // apply any per-skill on-crit self states first.
  this.rollAndApplyCritStates(attacker, this.thisCritSelfStates());

  // then apply any global (attacker-wide) on-crit self states.
  this.rollAndApplyCritStates(attacker, this.onCritSelfStates());
};

/**
 * Iterates a list of on-chance effects and applies any that pass their roll to the recipient.
 * @param {Game_Actor|Game_Enemy} recipient The battler receiving the state applications.
 * @param {JABS_OnChanceEffect[]} onChanceEffects The effects to roll and apply.
 */
Game_Action.prototype.rollAndApplyCritStates = function(recipient, onChanceEffects)
{
  // skip if there is nothing to process.
  if (onChanceEffects.length === 0) return;

  const attacker = this.subject();

  // roll each effect individually — each has its own state id and chance.
  onChanceEffects.forEach(effect =>
  {
    // only apply if the random roll beats the configured chance.
    if (effect.shouldTrigger())
    {
      recipient.addState(effect.skillId, attacker);
    }
  });
};

/**
 * Gets all on-crit target states sourced from the executing skill only.
 * Uses the {@link thisCritApply} tag — independent of what the attacker has globally.
 * @returns {JABS_OnChanceEffect[]}
 */
Game_Action.prototype.thisCritTargetStates = function()
{
  return RPGManager.getOnChanceEffectsFromDatabaseObjects(
    [ this.item() ],
    J.CRIT.RegExp.ThisCritApply
  );
};

/**
 * Gets all on-crit self states sourced from the executing skill only.
 * Uses the {@link thisCritSelf} tag — independent of what the attacker has globally.
 * @returns {JABS_OnChanceEffect[]}
 */
Game_Action.prototype.thisCritSelfStates = function()
{
  return RPGManager.getOnChanceEffectsFromDatabaseObjects(
    [ this.item() ],
    J.CRIT.RegExp.ThisCritSelf
  );
};

/**
 * Gets all on-crit target states sourced from anywhere on the attacker.
 * Uses the {@link onCritApply} tag — fires whenever any crit lands, regardless of the skill used.
 * @returns {JABS_OnChanceEffect[]}
 */
Game_Action.prototype.onCritTargetStates = function()
{
  return RPGManager.getOnChanceEffectsFromDatabaseObjects(
    this.subject().getAllNotes(),
    J.CRIT.RegExp.OnCritApply
  );
};

/**
 * Gets all on-crit self states sourced from anywhere on the attacker.
 * Uses the {@link onCritSelf} tag — fires whenever any crit lands, regardless of the skill used.
 * @returns {JABS_OnChanceEffect[]}
 */
Game_Action.prototype.onCritSelfStates = function()
{
  return RPGManager.getOnChanceEffectsFromDatabaseObjects(
    this.subject().getAllNotes(),
    J.CRIT.RegExp.OnCritSelf
  );
};

/**
 * Overwrites {@link #applyCritical}.<br/>
 * Replaces the way critical damage is calculated by
 * adding multiplier and reduction modifiers for actors and enemies alike.
 * @param {number} baseDamage The base damage before crit modification.
 * @returns {number} The critically modified damage.
 */
Game_Action.prototype.applyCritical = function(baseDamage)
{
  // get the actual amount of bonus critical damage to add to the base damage.
  const criticalBonusDamage = this.applyCriticalDamageMultiplier(baseDamage);

  // reduce the above bonus critical damage by any reductions on the target.
  const reducedCriticalBonusDamage = this.applyCriticalDamageReduction(criticalBonusDamage);

  // return the total damage including critical modifiers.
  return baseDamage + reducedCriticalBonusDamage;
};

/**
 * Calculates the amount of critical damage to add onto the base damage.
 * @param {number} baseDamage The base damage before crit modification.
 * @returns {number} The amount of critical damage to add onto the base.
 */
Game_Action.prototype.applyCriticalDamageMultiplier = function(baseDamage)
{
  // get the attacker for this action.
  const attacker = this.subject();

  // get the base crit multiplier.
  let critMultiplier = attacker.baseCriticalMultiplier();

  // get the attacker's bonus crit multiplier.
  critMultiplier += attacker.cdm;

  // add the action's specific multiplier if any exists.
  critMultiplier += this.ownCriticalDamageMultiplier();

  // return the calculated amount of critical bonus damage to add onto the base.
  return (baseDamage * critMultiplier);
};

/**
 * Calculates the amount of critical damage that will be removed from the bonus crit damage.
 * @param {number} criticalDamage The critical damage to be added.
 * @returns {number} The amount of critical damage after mitigations.
 */
Game_Action.prototype.applyCriticalDamageReduction = function(criticalDamage)
{
  // get the target for this action.
  const defender = this.targetBattler();

  // if somehow we don't have a defender/target, then just return the base damage.
  if (!defender) return criticalDamage;

  // this gives us a multiplier representing how reduced the crit damage is.
  const baseCriticalReductionRate = (1 - defender.cdr)

  // this cannot reduce the crit bonus damage below 0.
  const criticalReductionRate = Math.max(baseCriticalReductionRate, 0);

  // return the calculated amount of remaining critical damage after reductions.
  return criticalDamage * criticalReductionRate;
};

/**
 * Overwrites {@link #itemCri}.<br/>
 * Includes the addition of potential action-based crit rate boosts.
 * @param {Game_Battler} target The target being struck with the critical.
 * @returns {number} The calculated critical chance of this action.
 */
Game_Action.prototype.itemCri = function(target)
{
  // if this action can't crit, then do not process it as a critical hit.
  if (!this.item().damage.critical) return 0;

  // check if its a guaranteed crit- if so, return an unrealistically high number over 1.
  if (this.isGuaranteedCrit()) return 9999;

  // grab the attacker's crit chance.
  let critChance = this.subject().cri;

  // add any bonus crit from the action.
  critChance += this.ownCriticalChanceBonus();

  // calculate the crit chance against the target's crit evasion.
  critChance -= target.cev;

  // normalize the crit to 0 just in case it drops below.
  return Math.max(critChance, 0);
};

/**
 * Calculates this action's own bonus to crit damage multipliers.
 * @returns {number}
 */
Game_Action.prototype.ownCriticalDamageMultiplier = function()
{
  return RPGManager.getSumFromAllNotesByRegex([ this.item() ], J.CRIT.RegExp.ThisCritDamageMultiplier) / 100;
};

/**
 * Checks if this action is a guaranteed critical hit.
 * @returns {boolean}
 */
Game_Action.prototype.isGuaranteedCrit = function()
{
  return RPGManager.checkForBooleanFromNoteByRegex(this.item(), J.CRIT.RegExp.ThisCritsAlways);
};

/**
 * Calculates this action's own bonus to crit chance.
 * @returns {number}
 */
Game_Action.prototype.ownCriticalChanceBonus = function()
{
  return RPGManager.getSumFromAllNotesByRegex([ this.item() ], J.CRIT.RegExp.ThisCritDamageChance) / 100;
};
//endregion Game_Action