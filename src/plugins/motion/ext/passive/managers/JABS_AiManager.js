//region JABS_AiManager
import PassiveMotionCoordinator from './PassiveMotionCoordinator.js';

/**
 * Extends {@link #addOrUpdateBattler}.<br/>
 * Settles the newly-tracked battler's passive motions now that it can be found.
 *
 * The refresh hook alone is not enough for a spawn, and the reason is ordering. A map event becomes
 * a battler in `convertEventToBattler`, and the affix extension hands over its passive state ids
 * from inside that call — but nothing is added to this manager's tracking until the whole map's
 * worth of conversions has finished. So the reconcile that the affix grant triggers runs against a
 * battler that cannot yet be looked up by uuid, finds no character, and correctly does nothing.
 *
 * This is the frame after that, and it is the first moment a battler and its character can be
 * reached from each other. It is also where the player arrives: `refreshPlayer1Data` registers
 * player 1 here on map setup and again after every party cycle, which is what keeps the character
 * the player drives showing the passives of whoever is currently leading.
 * @param {JABS_Battler} battler The battler being tracked.
 */
J.MOTION.EXT.PASSIVE.Aliased.JABS_AiManager.set('addOrUpdateBattler', JABS_AiManager.addOrUpdateBattler);
JABS_AiManager.addOrUpdateBattler = function(battler)
{
  // perform original logic. only the battler is forwarded- this is reached through a `forEach` in
  // `addOrUpdateBattlers`, so an index and the source array arrive behind it that mean nothing here.
  J.MOTION.EXT.PASSIVE.Aliased.JABS_AiManager.get('addOrUpdateBattler')
    .call(this, battler);

  // the battler can be found by uuid now, so its character can finally be reached.
  PassiveMotionCoordinator.reconcile(battler.getBattler());
};
//endregion JABS_AiManager