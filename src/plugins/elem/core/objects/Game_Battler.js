//region Game_Battler
/**
 * Determines whether or not a given element id is absorbed by this battler.
 * @param {number} elementId The element id.
 * @returns {boolean}
 */
Game_Battler.prototype.isElementAbsorbed = function(elementId)
{
  return this.elementsAbsorbed()
    .includes(elementId);
};

/**
 * Determines whether or not a given element id can affect this battler in the
 * context of "strict" elements. If the target has no strict elements, then this
 * will automatically return true. Otherwise, it'll check elements.
 * @param {number} elementId The element id.
 * @returns {boolean}
 */
Game_Battler.prototype.isElementStrict = function(elementId)
{
  const strict = this.strictElements();

  // if we don't have any strict elements on this battler
  if (!strict.length)
  {
    // then strictness doesn't apply.
    return true;
  }

  // otherwise, check the strict elements to see if we have a match.
  return strict.includes(elementId);
};

/**
 * Gets all elements this battler absorbs.
 * @returns {number[]}
 */
Game_Battler.prototype.elementsAbsorbed = function()
{
  return [];
};

/**
 * Gets all absorbed element ids from a given object on this battler.
 *
 * @param {RPG_BaseItem} databaseObject The database data object.
 * @returns {number[]}
 */
Game_Battler.prototype.extractAbsorbedElements = function(databaseObject)
{
  return RPGManager.getNumbersFromNoteByRegex(databaseObject, J.ELEM.RegExp.AbsorbElementIds);
};

/**
 * Gets the strict elements for this battler, if any.
 * "Strict" elements are the only elements this battler can be affected by.
 *
 * If none are found, the default is all elements (to negate this feature).
 * @returns {number[]}
 */
Game_Battler.prototype.strictElements = function()
{
  return $dataSystem.elements.map((_, index) => index);
};

/**
 * Gets the strict element ids from a given object on this battler.
 *
 * @param {RPG_BaseItem} databaseObject The database data object.
 * @returns {number[]}
 */
Game_Battler.prototype.extractStrictElements = function(databaseObject)
{
  return RPGManager.getNumbersFromNoteByRegex(databaseObject, J.ELEM.RegExp.StrictElementIds);
};

/**
 * Gets the element rate boost for this element for this battler.
 * @param {number} elementId The element id to check.
 */
// eslint-disable-next-line no-unused-vars
Game_Battler.prototype.elementRateBoost = function(elementId)
{
  return 1;
};

/**
 * Gets the element boosts associated with the provided element id.
 * @param {RPG_BaseItem} referenceData The reference data with a note to parse.
 * @returns {[number, number][]}
 */
Game_Battler.prototype.extractElementRateBoosts = function(referenceData)
{
  // if for some reason there is no note, then don't try to parse it.
  if (!referenceData.note) return [];

  // each <boostElement:[ELEMENT_ID, PERCENT_BOOST]> tag parses directly into a numeric tuple.
  return RPGManager.getArraysFromNotesByRegex(referenceData, J.ELEM.RegExp.BoostElement);
};

/**
 * The slayer bonuses this battler has learned, as raw `[ELEMENT_ID, PERCENT]` tuples.
 *
 * Read from every note-bearing source on the battler, so a bonus can be granted by a state, a piece
 * of equipment, a class or the battler's own row without any of those needing to know about the
 * others. In practice these land on states and accessories.
 * @returns {[number, number][]}
 */
Game_Battler.prototype.slayerBonuses = function()
{
  return RPGManager.getArraysFromAllNotesByRegex(this.getAllNotes(), J.ELEM.RegExp.Slayer);
};

/**
 * Whether a target belongs to the elemental family named by an element id.
 *
 * Membership is read off the target's own innate element rates: something that takes extra damage
 * from `vs Undead` is, by that fact, undead. Neutral is a rate of exactly one, so any authored
 * weakness at all counts and no tuning threshold is needed to decide what something *is*.
 * @param {Game_Actor|Game_Enemy} target The target whose family is in question.
 * @param {number} elementId The element id naming the family.
 * @returns {boolean}
 */
Game_Battler.prototype.isTargetInElementalFamily = function(target, elementId)
{
  // read the target's innate elemental profile from its database row.
  const rates = target.databaseData()
    .elementRates();

  // a rate above neutral means this element identifies the target.
  return rates[elementId] > 1;
};

/**
 * The combined slayer multiplier this battler applies when striking a particular target.
 *
 * Every learned bonus whose family the target belongs to contributes, and they compound- two
 * separate 50% sources against the same target produce 2.25x rather than 2x. That matches how
 * {@link Game_Battler#elementRateBoost} and the elemental rates themselves already stack, so a
 * player who has studied a family from two directions is never surprised by the arithmetic.
 *
 * Answers exactly `1` when nothing applies, which is the identity for the multiplication it feeds.
 * @param {Game_Actor|Game_Enemy} target The target being struck.
 * @returns {number} The multiplier to apply on top of all other damage math.
 */
Game_Battler.prototype.slayerMultiplierAgainst = function(target)
{
  // collect every slayer bonus this battler has available.
  const bonuses = this.slayerBonuses();

  // compound the bonuses whose family the target actually belongs to.
  return bonuses.reduce((multiplier, [ elementId, percent ]) =>
  {
    // a bonus against a family this target is not part of contributes nothing.
    if (this.isTargetInElementalFamily(target, elementId) === false) return multiplier;

    // fold this bonus into the running product.
    const bonusFactor = 1 + (percent / 100);

    return multiplier * bonusFactor;
  }, 1);
};
//endregion Game_Battler