//region Game_Action
import JABS_MetricsManager from '../managers/JABS_MetricsManager.js';

/**
 * Extends {@link #onParry}.<br/>
 * Also records the parry as the deliberate kind.
 *
 * This hook is reached only from {@link Game_Action.processGuard}'s sibling
 * {@link Game_Action.processParry}, which in turn only runs while the battler's parry window is
 * open- so arriving here is proof the player earned it on purpose. The passive roll that produces
 * the same `parried` outcome never comes through here, which is what makes the two separable at all.
 * @param {JABS_Battler} jabsBattler The battler that is parrying.
 */
J.ABS.EXT.METRICS.Aliased.Game_Action.set('onParry', Game_Action.prototype.onParry);
Game_Action.prototype.onParry = function(jabsBattler)
{
  // perform original logic.
  J.ABS.EXT.METRICS.Aliased.Game_Action.get('onParry')
    .call(this, jabsBattler);

  // enemies parry too, and their defensive record is not the one being kept.
  if (jabsBattler.isActor() === false) return;

  JABS_MetricsManager.trackPreciseParry();
};

/**
 * Extends {@link #onGuard}.<br/>
 * Also records that a hit landed on someone who was holding guard.
 * @param {JABS_Battler} jabsBattler The battler that is guarding.
 */
J.ABS.EXT.METRICS.Aliased.Game_Action.set('onGuard', Game_Action.prototype.onGuard);
Game_Action.prototype.onGuard = function(jabsBattler)
{
  // perform original logic.
  J.ABS.EXT.METRICS.Aliased.Game_Action.get('onGuard')
    .call(this, jabsBattler);

  // enemies guard too, and their defensive record is not the one being kept.
  if (jabsBattler.isActor() === false) return;

  JABS_MetricsManager.trackGuardedHit();
};

/**
 * Extends {@link #calculateGuardDamageReduction}.<br/>
 * Also records the difference between what the hit would have dealt and what it did.
 *
 * Measured here rather than anywhere downstream because this is the only point at which both numbers
 * exist at once- by the time the result carries a figure, the original is gone.
 * @param {JABS_Battler} jabsBattler The battler doing the guarding.
 * @param {number} originalDamage The damage before any guard reduction.
 * @returns {number} The damage after the guard reduction.
 */
J.ABS.EXT.METRICS.Aliased.Game_Action.set(
  'calculateGuardDamageReduction',
  Game_Action.prototype.calculateGuardDamageReduction);
Game_Action.prototype.calculateGuardDamageReduction = function(jabsBattler, originalDamage)
{
  // perform original logic.
  const reducedDamage = J.ABS.EXT.METRICS.Aliased.Game_Action.get('calculateGuardDamageReduction')
    .call(this, jabsBattler, originalDamage);

  // enemies guard too, and their defensive record is not the one being kept.
  if (jabsBattler.isActor())
  {
    JABS_MetricsManager.trackDamagePrevented(originalDamage, reducedDamage);
  }

  return reducedDamage;
};
//endregion Game_Action