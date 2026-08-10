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
    // the attacker wants the state to stick; the recipient's own curse can resist it. When this
    // is a self-targeting effect, recipient === attacker, so both contributions naturally come
    // from the same battler's own two stats- no special-casing needed.
    const skill = effect.baseSkill(attacker);
    const positiveRolls = 1 + attacker.getPositiveRollsForSkill(skill);
    const negativeRolls = recipient.getNegativeRolls();

    // <forceCritProcs> forces this roll specifically to guarantee success, without touching the
    // attacker's real isVeryLucky()/isVeryCursed() flags or any other roll site. Accumulate Mode
    // and Encore still read straight off the real attacker, so they continue to stack normally.
    const positiveRoller = attacker.isForceCritProcs()
      ? {
        isVeryLucky: () => true,
        isVeryCursed: () => false,
        isAccumulating: () => attacker.isAccumulating(),
        getEncoreRepeats: () => attacker.getEncoreRepeats(),
      }
      : attacker;

    // resolve how many times this proc's action should execute (Accumulate Mode/Encore aware).
    const procCount = effect.resolveProcCount(positiveRolls, negativeRolls, positiveRoller);

    for (let i = 0; i < procCount; i++)
    {
      recipient.addState(effect.skillId, attacker, skill);
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
  const notes = this.subject()
    .getAllNotes();

  return RPGManager.getOnChanceEffectsFromDatabaseObjects(notes, J.CRIT.RegExp.OnCritApply);
};

/**
 * Gets all on-crit self states sourced from anywhere on the attacker.
 * Uses the {@link onCritSelf} tag — fires whenever any crit lands, regardless of the skill used.
 * @returns {JABS_OnChanceEffect[]}
 */
Game_Action.prototype.onCritSelfStates = function()
{
  const notes = this.subject()
    .getAllNotes();

  return RPGManager.getOnChanceEffectsFromDatabaseObjects(notes, J.CRIT.RegExp.OnCritSelf);
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
  const baseCriticalReductionRate = (1 - defender.ctr)

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

  // check if its an unconditional guaranteed crit.
  if (this.isGuaranteedCrit()) return 9999;

  // check if the target's current states trigger a guaranteed crit.
  if (this.isGuaranteedCritVsTarget(target)) return 9999;

  // grab the attacker's crit chance.
  let critChance = this.subject().cri;

  // add any bonus crit from the action.
  critChance += this.ownCriticalChanceBonus();

  // add any conditional crit bonus from this skill's state-gated tags.
  critChance += this.thisCritChanceIfStateBonus(target);

  // add any conditional crit bonus from the attacker's global state-gated tags.
  critChance += this.critChanceIfStateBonus(target);

  // calculate the crit chance against the target's crit evasion.
  critChance -= target.cev;

  // normalize the crit to 0 just in case it drops below.
  return Math.max(critChance, 0);
};

/**
 * Calculates this action's own bonus to crit damage multipliers.
 * Formula context: `a` is this action's subject (the attacker), `b` is 0 (no meaningful
 * per-skill base value to expose), `v` is `$gameVariables._data`.
 * @returns {number}
 */
Game_Action.prototype.ownCriticalDamageMultiplier = function()
{
  return RPGManager.getResultsFromAllNotesByRegex(
    [ this.item() ],
    J.CRIT.RegExp.ThisCritDamageMultiplier,
    0,
    this.subject()) / 100;
};

/**
 * Checks if this action is an unconditional guaranteed critical hit.
 * @returns {boolean}
 */
Game_Action.prototype.isGuaranteedCrit = function()
{
  return RPGManager.checkForBooleanFromNoteByRegex(this.item(), J.CRIT.RegExp.ThisCritsAlways);
};

/**
 * Checks if the target's current states trigger a guaranteed critical hit for this action.
 * Checks both the skill's own {@link thisCritsAlwaysIfState} tags and the attacker's global
 * {@link critAlwaysIfState} tags across all note sources.
 * @param {Game_Battler} target The target being struck.
 * @returns {boolean} True if the target has any state that guarantees a crit, false otherwise.
 */
Game_Action.prototype.isGuaranteedCritVsTarget = function(target)
{
  // collect all state ids from this skill's own guaranteed-crit-if-state tags.
  const skillStateIds = this.item().thisCritsAlwaysIfStates;

  // if any of this skill's listed states are active on the target, the crit is guaranteed.
  if (skillStateIds.some(stateId => target.isStateAffected(stateId))) return true;

  // collect all state type classifiers from this skill's guaranteed-crit-if-state-type tags.
  const skillStateTypes = this.item().thisCritsAlwaysIfStateTypes;

  // if the target has any active state carrying one of this skill's listed type classifiers, the crit is guaranteed.
  if (skillStateTypes.some(type => this.targetHasActiveStateType(target, type))) return true;

  // collect all state ids from the attacker's global guaranteed-crit-if-state tags.
  const globalStateIds = this.subject().getAllNotes()
    .flatMap(noteSource => noteSource.critAlwaysIfStates);

  // if any of the attacker's globally listed states are active on the target, the crit is guaranteed.
  if (globalStateIds.some(stateId => target.isStateAffected(stateId))) return true;

  // collect all state type classifiers from the attacker's global guaranteed-crit-if-state-type tags.
  const globalStateTypes = this.subject().getAllNotes()
    .flatMap(noteSource => noteSource.critAlwaysIfStateTypes);

  // if the target has any active state carrying one of the attacker's globally listed type classifiers, the crit is guaranteed.
  return globalStateTypes.some(type => this.targetHasActiveStateType(target, type));
};

/**
 * Calculates this action's own bonus to crit chance.
 * Formula context: `a` is this action's subject (the attacker), `b` is 0 (no meaningful
 * per-skill base value to expose), `v` is `$gameVariables._data`.
 * @returns {number}
 */
Game_Action.prototype.ownCriticalChanceBonus = function()
{
  return RPGManager.getResultsFromAllNotesByRegex(
    [ this.item() ],
    J.CRIT.RegExp.ThisCritDamageChance,
    0,
    this.subject()) / 100;
};

/**
 * Calculates the conditional crit chance bonus from this skill's own state-gated tags.
 * Reads all {@link thisCritChanceIfState} pairs on the executing skill and sums the bonus
 * for each pair whose state the target currently has active.
 * @param {Game_Battler} target The target being struck.
 * @returns {number} The total conditional bonus as a 0–1 rate addend.
 */
Game_Action.prototype.thisCritChanceIfStateBonus = function(target)
{
  // get all [stateId, bonusChance] pairs defined on this skill.
  const pairs = this.item().thisCritChanceIfStates;

  // get all [type, bonusChance] pairs defined on this skill.
  const typePairs = this.item().thisCritChanceIfStateTypes;

  // if the skill carries neither kind of conditional crit pair, short circuit. Both have to be
  // checked here: a skill tagged only by state type contributes through the second reduce below,
  // and bailing on the first collection alone would silently discard it.
  if (!pairs.length && !typePairs.length) return 0;

  // accumulate the bonus for each pair whose state the target currently has.
  const stateIdBonus = pairs.reduce((total, [ stateId, bonusChance ]) =>
  {
    // only add the bonus if the target is afflicted with this state.
    return total + (target.isStateAffected(stateId) ? bonusChance / 100 : 0);
  }, 0);

  // accumulate the bonus for each pair whose state type the target currently has.
  const stateTypeBonus = typePairs.reduce((total, [ type, bonusChance ]) =>
  {
    // only add the bonus if the target has any active state carrying this type classifier.
    return total + (this.targetHasActiveStateType(target, type) ? bonusChance / 100 : 0);
  }, 0);

  return stateIdBonus + stateTypeBonus;
};

/**
 * Calculates the conditional crit chance bonus from the attacker's global state-gated tags.
 * Reads all {@link critChanceIfState} pairs from every note source on the attacker and sums
 * the bonus for each pair whose state the target currently has active.
 * @param {Game_Battler} target The target being struck.
 * @returns {number} The total conditional bonus as a 0–1 rate addend.
 */
Game_Action.prototype.critChanceIfStateBonus = function(target)
{
  // collect critChanceIfStates arrays from every note source the attacker carries.
  const allPairs = this.subject().getAllNotes()
    .flatMap(noteSource => noteSource.critChanceIfStates);

  // collect all [type, bonusChance] pairs from the attacker's global state-type-gated tags.
  const allTypePairs = this.subject().getAllNotes()
    .flatMap(noteSource => noteSource.critChanceIfStateTypes);

  // if none of the attacker's note sources carry either kind of conditional crit pair, short
  // circuit. Both have to be checked here: an attacker tagged only by state type contributes
  // through the second reduce below, and bailing on the first collection alone would discard it.
  if (!allPairs.length && !allTypePairs.length) return 0;

  // accumulate the bonus for each pair whose state the target currently has.
  const stateIdBonus = allPairs.reduce((total, [ stateId, bonusChance ]) =>
  {
    // only add the bonus if the target is afflicted with this state.
    return total + (target.isStateAffected(stateId) ? bonusChance / 100 : 0);
  }, 0);

  // accumulate the bonus for each pair whose state type the target currently has.
  const stateTypeBonus = allTypePairs.reduce((total, [ type, bonusChance ]) =>
  {
    // only add the bonus if the target has any active state carrying this type classifier.
    return total + (this.targetHasActiveStateType(target, type) ? bonusChance / 100 : 0);
  }, 0);

  return stateIdBonus + stateTypeBonus;
};

/**
 * Checks whether the target has any active state carrying the specified type classifier.
 * The comparison is case-insensitive.
 * @param {Game_Battler} target The target whose active states are checked.
 * @param {string} type The type classifier to look for.
 * @returns {boolean} True if any active state on the target carries this type.
 */
Game_Action.prototype.targetHasActiveStateType = function(target, type)
{
  // check each of the target's active states for a case-insensitive type classifier match.
  return target.states()
    .some(state => state.types()
      .some(stateType => stateType.toLowerCase() === type.toLowerCase()));
};
//endregion Game_Action