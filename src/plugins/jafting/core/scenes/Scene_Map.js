//region Scene_Map
import JaftingSalvageManager from '../managers/JaftingSalvageManager.js';

/**
 * Extends {@link Scene_Map.prototype.start}.<br/>
 * Trims per-copy salvage ledgers back to the copies the player still holds.
 *
 * **Why this is deferred rather than done when a copy leaves the bag.** A stamped copy can leave the container for
 * reasons that are nothing like each other: sold, handed to a story event, dismantled - or simply equipped, which
 * removes it from inventory without the player parting with it at all. At the instant of the removal those are
 * indistinguishable, and guessing wrong throws away the provenance of a sword somebody is still wearing, so
 * dismantling it later refunds nothing.
 *
 * `Scene_Map.start` is where the guessing stops. It runs on map transfer and on the return from any menu, shop, or
 * battle, so every path that could have released a copy has finished by the time this asks how many are held. Being
 * late costs only a slightly larger save in the meantime.
 *
 * This lives in JAFTING core rather than an extension because the bags are core's: Creation stamps them whether or
 * not Refinement is installed. Refinement adds its own pass for the dynamic rows only it creates.
 */
J.JAFTING.Aliased.Scene_Map.set('start', Scene_Map.prototype.start);
Scene_Map.prototype.start = function()
{
  // perform original logic.
  J.JAFTING.Aliased.Scene_Map.get('start')
    .call(this);

  // settle the per-copy ledgers against what the player actually has, now that nothing is in flight.
  JaftingSalvageManager.resizeTemplateLedgerBags();
};
//endregion Scene_Map