//region JABS_Battler
import JABS_MetricsManager from '../managers/JABS_MetricsManager.js';

/**
 * Extends {@link #executeGuard}.<br/>
 * Also records that the player reached for their guard.
 *
 * Counted on the transition into guarding rather than per frame held, and measured by comparing the
 * guard state either side of the original call rather than by re-deriving the conditions- the
 * original refuses the request for several reasons of its own, and duplicating that judgement here
 * would mean two answers to one question that could drift apart.
 * @param {boolean} guarding True if the battler is guarding, false otherwise.
 */
J.ABS.EXT.METRICS.Aliased.JABS_Battler.set('executeGuard', JABS_Battler.prototype.executeGuard);
JABS_Battler.prototype.executeGuard = function(guarding)
{
  // capture the guard state before the original gets a say in it.
  const wasGuarding = this.guarding();

  // perform original logic.
  J.ABS.EXT.METRICS.Aliased.JABS_Battler.get('executeGuard')
    .call(this, guarding);

  // this is an input metric, so only the player's own decisions count- ally ai raises guard on its
  // own schedule and would swamp the tally with choices the player never made.
  if (this.isPlayer() === false) return;

  // a guard that was already up, or one the original declined to raise, is not an activation.
  if (wasGuarding === true) return;
  if (this.guarding() === false) return;

  JABS_MetricsManager.trackGuardActivation();
};

/**
 * Extends {@link #applyToolItemEffects}.<br/>
 * Also records that an item was consumed out of one of the two item-bearing slots.
 *
 * Hooked here rather than at the executed map action because an item only produces an action when it
 * carries a skill id- a plain healing potion never reaches the engine at all, and counting there
 * would silently omit every item that does nothing but heal.
 * @param {number} toolId The id of the item being used.
 * @param {string} buttonType The slot the item was used from.
 * @param {boolean=} isLoot Whether this is a loot pickup rather than a deliberate use.
 */
J.ABS.EXT.METRICS.Aliased.JABS_Battler.set('applyToolItemEffects', JABS_Battler.prototype.applyToolItemEffects);
JABS_Battler.prototype.applyToolItemEffects = function(toolId, buttonType, isLoot = false)
{
  // perform original logic.
  J.ABS.EXT.METRICS.Aliased.JABS_Battler.get('applyToolItemEffects')
    .call(this, toolId, buttonType, isLoot);

  // this is an input metric, so only the player's own decisions count.
  if (this.isPlayer() === false) return;

  // walking over loot runs through this same path; picking a potion up is not using one.
  if (isLoot === true) return;

  JABS_MetricsManager.trackItemUsage(buttonType);
};
//endregion JABS_Battler