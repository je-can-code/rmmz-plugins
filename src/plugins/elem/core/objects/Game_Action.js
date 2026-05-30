//region Game_Action
/**
 * Overwrites {@link #calcElementRate}.<br/>
 * Calculates the elemental rates of this action against the designated target.
 * @param {Game_Actor|Game_Enemy} target The target of this action.
 * @returns {number} The multiplier from elemental affiliation.
 */
Game_Action.prototype.calcElementRate = function(target)
{
  // initialize elements collection for this action.
  const elements = this.getApplicableElements(target);

  // non-elemental skills perform no elemental calculations.
  if (elements.includes(0))
  {
    return 1.0
  }

  // check if the target's strict elements contain the attack elements.
  const targetStrictElements = target.strictElements();

  // filter the action's elements down by what is available according to the strict elements.
  const attackElements = elements.filter(elementId => targetStrictElements.includes(elementId));

  let factor;
  switch (attackElements.length)
  {
    // if we have no elements left, then the elemental calculation is 0.
    case 0:
      factor = 0;
      break;
    // if we still only have the one element, then just use that.
    case 1:
      factor = this.calculateBoostRate(attackElements[0], target);
      break;
    // if we have more than 1 element, then handle it accordingly.
    default:
      factor = this.multipleElementalRates(target, attackElements);
      break;
  }

  return factor;
};

/**
 * Gets the raw element rate of this action against a particular target.
 * @param {Game_Actor|Game_Enemy} target The target of this action.
 * @returns {number} The non-caster-buffed elemental rate.
 */
Game_Action.prototype.calculateRawElementRate = function(target)
{
  const elements = this.getApplicableElements(target);
  const result = this.calculateMultipleRawElementalRate(target, elements);
  return result;
};

/**
 * Gets all applicable element ids that this action could have against this target.
 * @param {Game_Battler} target The target battler to check elemental applicability.
 * @returns {number[]} The list of element ids that this action has that are valid against the target.
 */
Game_Action.prototype.getApplicableElements = function(target)
{
  // the skill itself (or usable item).
  const skillOrItem = this.item();

  // the core element of the action.
  const baseElement = skillOrItem.damage.elementId;

  // initialize elements collection for this action.
  const elements = [ baseElement ];

  // add any extra elements the action has.
  const addedElements = Game_Action.extractElementsFromAction(skillOrItem);
  elements.push(...addedElements);

  // if the base element is -1 on the skill, then also add all the attacker's elements.
  const caster = this.subject();
  if (baseElement === -1)
  {
    elements.push(...caster.attackElements());
  }

  // if "none"-element is present, that is all that matters.
  if (elements.includes(0))
  {
    return [ 0 ];
  }

  // check if the target's strict elements contain the attack elements.
  const targetStrictElements = target.strictElements();

  // filter the action's elements down by what is available according to the strict elements.
  const restrictedElements = elements.filter(attackElementId => targetStrictElements.includes(attackElementId));
  return restrictedElements;
};

/**
 * Extracts all extra attack elements from a skill's notes.
 * @param {RPG_UsableItem} databaseObject The database object of this action.
 * @returns {number[]} The additional attack elements.
 */
Game_Action.extractElementsFromAction = function(databaseObject)
{
  return RPGManager.getNumbersFromNoteByRegex(databaseObject, J.ELEM.RegExp.AttackElementIds);
};

/**
 * Calculates the elemental rate of this action against a specific target.
 *
 * It is important to recognize that we are working with three different number types
 * in here: One is for "rates", which are positive integers that represent the
 * already-calculated elemental rate of the target. The second is "factor form" as
 * I call it, which represents the end result multiplier that this function returns.
 * It is a direct multiplier that is applied to damage, so it should be a decimal
 * typically ranging between 0.00 and maybe as high as 10.00. The third number is
 * simply the element id that hasn't been calculated yet. These are used to start
 * so you can calculate the rates of the action's elements against the target.
 * @param {Game_Actor|Game_Enemy} target The target to calculate against.
 * @param {number[]} elements The collection of elements we're attacking with.
 * @returns {number} The decimal elemental rate.
 */
Game_Action.prototype.multipleElementalRates = function(target, elements)
{
  const antiNullElementIds = this.getAntiNullElementIds();
  const hasAntiNullElementIds = antiNullElementIds.some(elementId => elements.includes(elementId));

  // if we have anti-null elements, then strip out the null
  if (hasAntiNullElementIds)
  {
    return this.calculateAntiNullElementalRate(target, elements);
  }

  // if we have an absorb rate amidst the attack elements that the target absorbs...
  const hasAbsorbRate = target.elementsAbsorbed()
    .some(absorbed => elements.includes(absorbed));
  if (hasAbsorbRate)
  {
    return this.calculateAbsorbRate(target, elements);
  }

  // if we have a null rate amidst the attack elements that the target nullifies...
  const hasNullRate = elements.some(attackElementId => this.calculateBoostRate(attackElementId, target) === 0);
  if (hasNullRate)
  {
    return this.calculateNullRate(target, elements);
  }

  // otherwise, calculate all the available elements.
  return this.calculateMultipleElementalRate(target, elements);
};

/**
 * Calculates the anti-null elemental rate for the target in relation to the set of elements.
 *
 * If an attack element is present in
 * @param {Game_Actor|Game_Enemy} target The target of this action.
 * @param {number[]} attackElements The attacking list of elements.
 * @returns {number} The "factor form" of the rate.
 */
Game_Action.prototype.calculateAntiNullElementalRate = function(target, attackElements)
{
  // the filter against the attack element ids.
  const filtering = (attackElementId) => !(this.calculateBoostRate(attackElementId, target) === 0);

  // filter out all null rates for the attack elements.
  const filteredElements = attackElements.filter(filtering);

  // if we have nothing left after purging all null-elements, then its "true" damage.
  if (!filteredElements.length) return 1;

  // the reducer for multiplying together all the rates.
  const reducer = (value, attackElementId) => (value * this.calculateBoostRate(attackElementId, target));

  // multiply together all the null-avoidant rates and return its "factor form".
  const nonNullRate = filteredElements.reduce(reducer, 1,);

  // and return the "factor form" of the non-nullable elemental product.
  return nonNullRate;
};

/**
 * Calculates the elemental rate for the target in relation to the set of elements.
 *
 * Though this implicitly handles 0-rate elements, it does not handle it explicitly,
 * nor does it handle absorbed elements.
 * @param {Game_Actor|Game_Enemy} target The target of this action.
 * @param {number[]} attackElements The attacking list of elements.
 * @returns {number} The "factor form" of the rate.
 */
Game_Action.prototype.calculateMultipleElementalRate = function(target, attackElements)
{
  return attackElements
    // calculate the rates for all the incoming attack elements.
    .map(attackElementId => this.calculateBoostRate(attackElementId, target), this)
    // multiply all rates together to get the "factor form".
    .reduce((previousRate, currentRate) => previousRate * currentRate, 1);
};

/**
 * Calculates the elemental rate for the target in relation to the set of elements.
 *
 * Though this implicitly handles 0-rate elements, it does not handle it explicitly,
 * nor does it handle absorbed elements.
 *
 * This does not factor in the attacker's boost rates, only the raw elemental affiliations.
 * @param {Game_Actor|Game_Enemy} target The target of this action.
 * @param {number[]} attackElements The attacking list of elements.
 * @returns {number} The "factor form" of the rate.
 */
Game_Action.prototype.calculateMultipleRawElementalRate = function(target, attackElements)
{
  return attackElements
    // calculate the rates for all the incoming attack elements.
    .map(attackElementId => target.elementRate(attackElementId), this)
    // multiply all rates together to get the "factor form".
    .reduce((previousRate, currentRate) => previousRate * currentRate, 1);
};

/**
 * Calculates the element's rate including applicable boosts and resistance piercing.
 *
 * This is effectively a wrapper around `target.elementRate(elementId)` that
 * also includes all of our elemental boosts from various notes around the
 * battlers, and now also applies resistance piercing before the boost multiplication.
 * @param {number} attackElementId The element id.
 * @param {Game_Actor|Game_Enemy} target The target being hit.
 * @returns {number}
 */
Game_Action.prototype.calculateBoostRate = function(attackElementId, target)
{
  // the attacker to gauge bonus element rates upon.
  const attacker = this.subject();

  // the base element rate from the target's traits.
  const baseRate = target.elementRate(attackElementId);

  // apply resistance pierce to the base rate before folding in the attacker's boost.
  const piercedRate = this.applyElementPierce(attackElementId, target, baseRate);

  // the boosted rate if the attacker has any.
  const elementBoostRate = attacker.elementRateBoost(attackElementId);

  // return the product.
  return piercedRate * elementBoostRate;
};

/**
 * Applies resistance piercing to a target's base element rate for a given element.
 *
 * Pierce nudges the rate toward 1.0 (neutral damage), hard-capped there.
 * Weaknesses (rate >= 1.0) and absorbed elements are never affected.
 * @param {number} attackElementId The element id being checked.
 * @param {Game_Actor|Game_Enemy} target The target whose resistance may be pierced.
 * @param {number} baseRate The raw element rate from the target's traits.
 * @returns {number} The pierced element rate, or the original if pierce does not apply.
 */
Game_Action.prototype.applyElementPierce = function(attackElementId, target, baseRate)
{
  // weaknesses and neutral rates have nothing to pierce through.
  if (baseRate >= 1.0) return baseRate;

  // absorbed elements are handled by a separate system — pierce does not apply.
  if (target.elementsAbsorbed().includes(attackElementId)) return baseRate;

  // sum all pierce contributions from attacker sources and the current skill.
  const totalPierce = this.getTotalElementPierce(attackElementId);

  // if there is no pierce at all, skip the clamp math.
  if (totalPierce <= 0) return baseRate;

  // nudge the resistance toward neutral, but never past it into bonus-damage territory.
  return Math.min(1.0, baseRate + totalPierce);
};

/**
 * Sums all element pierce contributions for the given element from two sources:
 *  - {@code pierceElement} tags on the attacker's full getAllNotes() collection (global/passive).
 *  - {@code thisPierceElement} tags on the specific skill being cast right now (skill-only).
 * @param {number} attackElementId The element id to sum pierce for.
 * @returns {number} Total pierce as a decimal rate (e.g. 0.30 for 30 pierce percent).
 */
Game_Action.prototype.getTotalElementPierce = function(attackElementId)
{
  const attacker = this.subject();
  let totalPercent = 0;

  // accumulate global pierce from all attacker sources (actor, class, equip, states, skills).
  for (const source of attacker.getAllNotes())
  {
    const pairs = RPGManager.getArraysFromNotesByRegex(source, J.ELEM.RegExp.PierceElement);

    for (const pair of pairs)
    {
      // each pair is [elementId, percent] — only accumulate when the element id matches.
      if (Array.isArray(pair) && pair.length === 2 && Number(pair[0]) === attackElementId)
      {
        totalPercent += Number(pair[1]);
      }
    }
  }

  // accumulate skill-specific pierce from only the skill being executed right now.
  const skillPairs = RPGManager.getArraysFromNotesByRegex(this.item(), J.ELEM.RegExp.ThisPierceElement);

  for (const pair of skillPairs)
  {
    // same filter — only accumulate when the element id matches.
    if (Array.isArray(pair) && pair.length === 2 && Number(pair[0]) === attackElementId)
    {
      totalPercent += Number(pair[1]);
    }
  }

  // convert integer percent to a decimal multiplier.
  return totalPercent / 100;
};

/**
 * Calculates the absorb rate for the target in relation to a set of elements.
 * @param {Game_Actor|Game_Enemy} target The target of this action.
 * @param {number[]} attackElements The attacking list of elements.
 * @returns {number} The "factor form" of the rate.
 */
Game_Action.prototype.calculateAbsorbRate = function(target, attackElements)
{
  // the reducer for multiplying together all the rates.
  const reducer = (previousRate, currentRate) => previousRate * currentRate;

  // get all those element ids that the target absorbs.
  const filteredAbsorbedIds = target.elementsAbsorbed()
    .filter(absorbed => attackElements.includes(absorbed));

  // translate the ids into rates.
  const absorbRates = filteredAbsorbedIds
    .map(attackElementId => this.calculateBoostRate(attackElementId, target), this);

  // multiply all the rates together.
  const absorbRate = absorbRates.reduce(reducer, 1);

  // return the product divided by 100 to get into "factor form".
  return absorbRate;
};

/**
 * Calculates the null rate for the target in relation to a set of elements.
 * @param {Game_Actor|Game_Enemy} target The target of this action.
 * @param {number[]} attackElements The attacking list of elements.
 * @returns {number} The "factor form" of the rate.
 */
// eslint-disable-next-line no-unused-vars
Game_Action.prototype.calculateNullRate = function(target, attackElements)
{
  // ... open for extension.
  return 0;
};

/**
 * If these elements are present in an elementId collection, then the calculation
 * will omit any 0 rate elements.
 * @returns {number[]} The ids to cause us to strip out all nulls.
 */
Game_Action.prototype.getAntiNullElementIds = function()
{
  return [];
};

/**
 * Overwrites {@link #evalDamageFormula}.<br/>
 * Evaluates the damage formula provided by the dev to determine the damage.
 * This also factors in elemental absorption for sign and floor handling.
 * Formula evaluation is delegated to {@link Game_Action#evalFormulaWithContext}
 * so all registered context variables (p, s, …) are available automatically.
 * @param {Game_Actor|Game_Enemy} target The target battler; the `b` of the formula.
 * @returns {number} The calculated damage value.
 */
Game_Action.prototype.evalDamageFormula = function(target)
{
  const item = this.item();
  const attackElements = Game_Action.extractElementsFromAction(item)
    .concat(item.damage.elementId);
  const absorbedElements = target.elementsAbsorbed();
  const targetAbsorbs = attackElements.some(elementId => absorbedElements.includes(elementId));

  // attacker and target — passed to evalFormulaWithContext as a and b.
  const a = this.subject();
  const b = target;

  // whether or not the damage should be multiplied by -1.
  const sign = this.healingFactor(targetAbsorbs);

  // attempt the fragile parse or io work inside this block.
  try
  {
    // evaluate the formula with the full registered context (a, b, v, p, s, …).
    const raw = this.evalFormulaWithContext(item.damage.formula, a, b);

    let value = 0;
    if (targetAbsorbs)
    {
      // absorbed elements lift the floor so negative (heal) values are allowed.
      value = raw * sign;
    }
    else
    {
      // otherwise, clamp to non-negative before applying sign.
      value = Math.max(raw, 0) * sign;
    }

    return isNaN(value)
      ? 0
      : value;
  }
  catch (e)
  {
    console.warn(`Error with the damage formula for item/skill id: ${item.id}.`);
    console.warn(item);
    console.error(e);
    return 0;
  }
};

/**
 * Determines the healing factor, and also considers whether or not the target
 * absorbs any of the action's elements (which would otherwise flip the sign).
 *
 * If the target absorbs any of the attack elements, then the `-1` is not applied,
 * however, the limit is lifted from formula damage evaluation.
 * @param {boolean} targetAbsorbs Whether or not the target absorbed this element.
 */
Game_Action.prototype.healingFactor = function(targetAbsorbs)
{
  const isHealingAction = [ 3, 4 ].includes(this.item().damage.type);
  return isHealingAction && !targetAbsorbs
    ? -1
    : 1;
};
//endregion Game_Action