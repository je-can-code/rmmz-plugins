//region Game_Action
import JABS_Shield from './../_models/JABS_Shield.js';
/**
 * Extends {@link #executeDamage}.<br/>
 * Considers shields when executing damage.
 */
J.ABS.EXT.SHIELD.Aliased.Game_Action.set('executeDamage', Game_Action.prototype.executeDamage);
Game_Action.prototype.executeDamage = function(target, value)
{
  // reduce damage by shields where applicable.
  const updatedValue = this.applyShields(target, value);

  // perform original logic.
  J.ABS.EXT.SHIELD.Aliased.Game_Action.get('executeDamage')
    .call(this, target, updatedValue);
};

/**
 * Potentially applies shields to the damage value.
 * @param {Game_Actor|Game_Enemy} target The target of the action.
 * @param {number} value The damage value to be applied.
 * @returns {number} The updated damage value after applying shields.
 */
Game_Action.prototype.applyShields = function(target, value)
{
  // don't bother with shield processing if there is no damage.
  if (value === 0) return value;

  // grab the actionable data.
  const skillOrItem = this.item();

  // valid damage types are HP Damage and HP Drain.
  const validDamageTypes = [ 1, 5 ];

  // if the damage type is not valid, then we can skip shield processing.
  if (validDamageTypes.includes(skillOrItem.damage.type) === false) return value;

  // grab the currently active shields.
  const shieldStates = target.getShieldStates();

  // if there are no shields, then we can skip shield processing.
  if (shieldStates.length === 0) return value;

  // declare a modifiable damage value for shield processing.
  let updatedValue = value;

  // iterate over the shields and apply them to the damage value.
  for (const shieldState of shieldStates)
  {
    // update the value and mitigate damage.
    updatedValue = this.applyShield(shieldState, target, updatedValue);

    // if we have no damage left, then we can stop processing shields.
    if (updatedValue === 0) break;
  }

  // return the updated value after processing shields.
  return updatedValue;
};

/**
 * Applies the shield to the damage value against the target.
 * Also applies any shield-only bonus damage from this action.
 * @param {JABS_State} shieldState The state bearing the shield.
 * @param {Game_Actor|Game_Enemy} target The target of the action.
 * @param {number} value The damage value to be applied.
 * @returns {number} The leftover damage value after applying the shield.
 */
Game_Action.prototype.applyShield = function(shieldState, target, value)
{
  // validate we have a shield to work with.
  const { shield } = shieldState;

  // if there is no shield, then there is nothing to apply.
  if (!shield)
  {
    return value;
  }

  // resolve the elements for this action for relevance checks.
  const skillOrItem = this.item();
  const actionElements = this.getActionElementsForShieldChecks(this.subject(), skillOrItem);

  // if the shield is typed but does not match the action, the shield is not relevant to this hit.
  if (this.isShieldRelevantToAction(shield, actionElements) === false)
  {
    return value;
  }

  // check if we should bypass shields for this hit (typed or universal).
  if (this.shouldBypassShield(shield))
  {
    return value;
  }

  // compute shield-only damage bonus for this target.
  // this bonus can only be absorbed by shields; it will never spill into HP.
  const pendingBonusInitial = this.calculateShieldBonusDamage(target, value);

  // delegate the absorption into a helper that mutates the pools and handles break logic.
  const postAbsorption = this.absorbDamageIntoShield(shieldState, target, value, pendingBonusInitial);

  // return whatever HP damage remains after shield absorption.
  return postAbsorption;
};

/**
 * Determines whether or not a shield should be bypassed by this action.
 * @param {JABS_Shield} shield The shield to check.
 * @returns {boolean} True if the shield should be bypassed, false otherwise.
 */
Game_Action.prototype.shouldBypassShield = function(shield)
{
  // no shield means there is nothing to bypass.
  if (!shield)
  {
    return false;
  }

  // grab the actionable data.
  const skillOrItem = this.item();

  // you cannot bypass shields without any bypass tag.
  if (skillOrItem.hasShieldBypass === false)
  {
    return false;
  }

  // parameterless form bypasses ALL shields regardless of typing.
  if (skillOrItem.isShieldBypassUniversal === true)
  {
    return true;
  }

  // read the shield's typed elements and the typed bypass elements from the action.
  const shieldElements = shield.getShieldTypes();
  const bypassElements = skillOrItem.shieldBypassElements;

  // typing needs to be present on both sides of the bypass, or it won't bypass.
  if (!bypassElements || bypassElements.length === 0 || shieldElements.length === 0)
  {
    return false;
  }

  // typed bypass applies when the action's bypass list targets this shield's types.
  const bypassesThisShield = ArrayHelper.hasAnyIntersection(shieldElements, bypassElements);
  if (bypassesThisShield === false)
  {
    return false;
  }

  // typed bypass conditions satisfied: bypass this shield for this hit.
  return true;
};

/**
 * Calculates the SHIELD-ONLY bonus damage for this action against a specific target.
 * The result may be absorbed by shields but can never spill into HP damage.
 *
 * Variables available to formulas:
 * - a: the subject/caster of this action.
 * - b: the target receiving this action.
 * - o: the HP damage value for this hit (pre-shield processing).
 *
 * @param {Game_Actor|Game_Enemy} target The target of the action.
 * @param {number} baseDamage The base HP damage value (pre-shield).
 * @returns {number} The total non-negative, rounded shield-only bonus value.
 */
Game_Action.prototype.calculateShieldBonusDamage = function(target, baseDamage)
{
  // Grab the action data.
  const skillOrItem = this.item();

  // Pull all shield-bonus formulas.
  const formulas = skillOrItem.shieldBonusFormulas;

  // If no formulas are present, then there is no bonus.
  if (formulas.length === 0)
  {
    return 0;
  }

  // provide common variables for evaluation — a (attacker), b (target), o (original damage).
  const a = this.subject();
  const b = target;
  const o = baseDamage;

  // sum the evaluated formulas (clamped to non-negative, rounded).
  const sum = formulas.reduce((total, f) =>
  {
    // evaluate the formula with the scoped context variables.
    const result = new Function('a', 'b', 'o', `return (${f})`)(a, b, o);

    // Coerce to number and clamp to non-negative.
    const n = Number(result) || 0;

    // Accumulate the rounded non-negative value.
    return total + Math.max(0, Math.round(n));
  }, 0);

  // Return the computed sum.
  return sum;
};

/**
 * Absorbs as much of the provided damage as possible into the provided shield state.
 * This will also consume any shield-only bonus damage, display pops, and handle break logic.
 * If the shield is protected, the remainder of the hit is nullified.
 *
 * @param {JABS_State} shieldState The state bearing the shield to absorb damage.
 * @param {Game_Actor|Game_Enemy} target The target receiving the action.
 * @param {number} overflowDamage The current remaining HP damage to be applied to the target.
 * @param {number} bonusDamage The current remaining SHIELD-ONLY bonus damage available.
 * @returns {number} The leftover HP damage after absorption (0 if shield protected and nullified).
 */
Game_Action.prototype.absorbDamageIntoShield = function(shieldState, target, overflowDamage, bonusDamage)
{
  // assign locally.
  let remainingDamage = overflowDamage;
  let pendingBonusDamage = bonusDamage;

  // continue absorbing while there is remaining HP damage OR pending shield-bonus,
  // and this state still has a shield pool (handle stacked state refresh).
  while ((remainingDamage > 0 || pendingBonusDamage > 0))
  {
    // re-resolve the shield reference (it may have been refreshed on a prior break in this loop).
    const { shield: updatedShield } = shieldState;

    // if there is no shield to absorb, stop processing this state.
    if (!updatedShield)
    {
      break;
    }

    // how much could be absorbed this iteration when considering the bonus?
    const before = updatedShield.getCurrent();

    // if the pool is already empty, stop processing this state.
    if (before <= 0)
    {
      break;
    }

    // the maximum absorb this tick is limited by the pool.
    const maxAbsorbThisTick = before;

    // our available absorb power combines real damage + pendingBonus.
    const absorbPower = remainingDamage + pendingBonusDamage;

    // determine absorption this iteration.
    const absorbed = Math.min(absorbPower, maxAbsorbThisTick);

    // split the absorption between real damage and bonus.
    const useFromReal = Math.min(remainingDamage, absorbed);
    const useFromBonus = absorbed - useFromReal;

    // deduct from the shield first.
    updatedShield.setCurrent(before - absorbed);

    // reduce the pools accordingly.
    remainingDamage -= useFromReal;
    pendingBonusDamage -= useFromBonus;

    // show a shield damage popup for the amount absorbed (real + bonus). The loop guard above
    // (remainingDamage > 0 || pendingBonusDamage > 0) combined with the pool check (before > 0)
    // guarantees absorbed is always positive here for legitimate non-negative inputs.
    this.onShieldDamageAbsorbed(target, absorbed);

    // determine whether this shield broke on this application.
    const brokeThisHit = (before > 0 && updatedShield.getCurrent() === 0);

    // if the shield broke on this hit, handle the break lifecycle.
    if (brokeThisHit)
    {
      // show a popup indicating the shield broke.
      this.onShieldBroken(target);

      // consume a stack, refill if stacks remain, or remove the state if none remain.
      shieldState.onShieldBreak();

      // if this shield is protected, the remainder of this hit is nullified.
      if (updatedShield.isProtected())
      {
        // stop processing entirely for this hit.
        return 0;
      }

      // loop again: if stacks remain, the state refilled and we keep absorbing.
      continue;
    }

    // if the pool did not break and we still have either remaining HP damage or pending bonus,
    // the next shield state (outer loop) will handle it; break out for this state.
    break;
  }

  // return whatever HP damage remains after rolling through this state's stacks.
  // note: pendingBonus never affects returned HP damage.
  return remainingDamage;
};

/**
 * Resolves the element ids that should be considered for shield relevance checks.
 * Falls back to the skill/item's element, expands via J.ELEM when present,
 * or uses the subject's normal attack elements when the element id is -1.
 * @param {Game_Battler} subject The acting battler.
 * @param {RPG_UsableItem} skillOrItem The action being executed.
 * @returns {number[]} The collection of element ids for this action.
 */
Game_Action.prototype.getActionElementsForShieldChecks = function(subject, skillOrItem)
{
  // start with the database-declared element id.
  const declaredId = skillOrItem.damage.elementId;

  // if using the elementalistics plugin, gather all applicable elements.
  if (J.ELEM)
  {
    // gather all elements applicable for this action from the subject.
    return [ ...this.getApplicableElements(subject) ];
  }

  // if the element is "normal attack", use the subject's attack elements.
  if (declaredId === -1)
  {
    // include all the subject's normal attack elements.
    return [ ...subject.attackElements() ];
  }

  // otherwise just use the declared element id.
  return [ declaredId ];
};

/**
 * Determines whether or not the provided shield is relevant to the action's elements.
 * Untyped shields are always relevant. Typed shields must intersect with the action's elements.
 * @param {JABS_Shield} shield The shield being checked for relevance.
 * @param {number[]} actionElements The elements associated with the action.
 * @returns {boolean} True if the shield is relevant to this action, false otherwise.
 */
Game_Action.prototype.isShieldRelevantToAction = function(shield, actionElements)
{
  // read the shield's typed elements.
  const shieldElements = shield.getShieldTypes();

  // untyped shields are always relevant.
  if (shieldElements.length === 0)
  {
    return true;
  }

  // typed shields are only relevant if the action elements overlap the shield types.
  const matches = ArrayHelper.hasAnyIntersection(actionElements, shieldElements);
  if (matches === false)
  {
    return false;
  }

  // the shield is relevant to this action.
  return true;
};

/**
 * Lifecycle event: shield mitigation occurred on the target.
 * Extended by optional plugins (e.g. J-Popups-ABS) to surface map feedback.
 * @param {Game_Actor|Game_Enemy} target The battler doing the mitigating.
 * @param {number} value The amount of damage mitigated.
 */
// eslint-disable-next-line no-unused-vars
Game_Action.prototype.onShieldDamageAbsorbed = function(target, value) 
{};

/**
 * Lifecycle event: a shield broke on the target.
 * Extended by optional plugins (e.g. J-Popups-ABS) to surface map feedback.
 * @param {Game_Actor|Game_Enemy} target The battler with the shield breaking.
 */
// eslint-disable-next-line no-unused-vars
Game_Action.prototype.onShieldBroken = function(target) 
{};
//endregion Game_Action