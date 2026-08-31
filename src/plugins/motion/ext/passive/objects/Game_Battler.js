//region Game_Battler
import PassiveMotionCoordinator from '../managers/PassiveMotionCoordinator.js';

/**
 * Extends {@link #refreshPassiveStates}.<br/>
 * Settles the battler's passive motions against the set that was just rebuilt.
 *
 * This is the one moment a battler's passives are known to have been recalculated, whatever caused
 * it — an equip change, a skill learned, a spawning event handing over its affixes, or J-Passive's
 * conditional extension deciding a gate now opens. Every one of those routes through here, so
 * hooking it is what makes the feature dynamic rather than something settled once at spawn.
 */
J.MOTION.EXT.PASSIVE.Aliased.Game_Battler.set('refreshPassiveStates', Game_Battler.prototype.refreshPassiveStates);
Game_Battler.prototype.refreshPassiveStates = function(deferRefresh = false)
{
  // perform original logic.
  J.MOTION.EXT.PASSIVE.Aliased.Game_Battler.get('refreshPassiveStates')
    .call(this, deferRefresh);

  // the passive set is settled, so what the sprite should be doing about it can be settled too.
  PassiveMotionCoordinator.reconcile(this);
};
//endregion Game_Battler