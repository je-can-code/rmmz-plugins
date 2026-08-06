//region Scene_Map
/**
 * Extends {@link Scene_Map.prototype.start}.<br/>
 * Collects any refinement slot the playthrough can no longer reach.
 *
 * **Why the map, and why not the moment a row leaves inventory.** Refinement mints rows into `$dataWeapons` /
 * `$dataArmors` and the party tracks their provenance, so both need tidying once the player parts with one for
 * good. The tempting place to do that is the `loseItem` hook, and it is wrong: equipping spends a row out of the
 * bag before installing it in the slot, so an item mid-equip is momentarily held nowhere, and selling, dismantling
 * and story-driven removals each settle at their own pace. Collecting from inside any of those means reading a
 * transitional state as a final one.
 *
 * `Scene_Map.start` is the point where none of that is in flight. It runs on map transfer *and* on the return from
 * any menu, shop, or battle, because `SceneManager.pop` constructs a fresh scene rather than resuming the old one -
 * so every path that could have released a refined equip passes through here afterward, with the transaction
 * finished. Collection being late costs nothing: the slot allocator only ever counts upward, so no future
 * refinement is waiting on a freed slot.
 *
 * This lives in Refinement rather than JAFTING core because Refinement is what creates dynamic rows in the first
 * place. A project without it has none, and therefore wants no sweep.
 */
J.JAFTING.EXT.REFINE.Aliased.Scene_Map.set('start', Scene_Map.prototype.start);
Scene_Map.prototype.start = function()
{
  // perform original logic.
  J.JAFTING.EXT.REFINE.Aliased.Scene_Map.get('start')
    .call(this);

  // hand back whatever the player has finished with since the last time we were out here.
  JaftingSalvageManager.reclaimUnreferencedDynamicSlots();
};
//endregion Scene_Map