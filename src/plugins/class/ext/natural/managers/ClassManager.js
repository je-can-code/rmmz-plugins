//region ClassManager
import ClassGrowthManager from './ClassGrowthManager.js';

/**
 * Extends {@link ClassManager.referenceValue}.<br/>
 * Also measures a parameter J-Classes has no curve for by what the class buffs it by while worn.
 *
 * A class authored as its starting class's buff times some number- `3 * a.level` against `1 * a.level`-
 * then shows that number as its multiplier, exactly the way a class authored as its starting class's curve
 * times some number does.
 * @param {Game_Actor} actor The actor being measured.
 * @param {number} classId The id of the class to read.
 * @param {string} parameterKey The registry key of the parameter.
 * @returns {number}
 */
J.CLASS.EXT.NATURAL.Aliased.ClassManager.set('referenceValue', ClassManager.referenceValue);
ClassManager.referenceValue = function(actor, classId, parameterKey)
{
  // perform original logic.
  const original = J.CLASS.EXT.NATURAL.Aliased.ClassManager.get('referenceValue')
    .call(this, actor, classId, parameterKey);

  // a parameter J-Classes already measures by its curve keeps that measure.
  if (original !== 0) return original;

  // anything else is measured by what the class buffs it by while worn.
  return ClassGrowthManager.buffAtReferenceLevel(actor, classId, parameterKey);
};
//endregion ClassManager