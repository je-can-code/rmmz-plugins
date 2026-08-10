//region Scene_Map
/**
 * Gets whether or not a map transfer is currently underway.
 * @returns {boolean} The transfer.
 */
Scene_Map.prototype.transfer = function()
{
  // hand back whether or not a map transfer is currently underway.
  return this._transfer;
};

/**
 * Extends {@link Scene_Map.prototype.start}.<br/>
 * Reconciles the party's inventory against the database it was actually loaded next to.
 *
 * **Why here, of all places.** The obvious home is `DataManager.extractSaveContents`, and it is wrong: rows created
 * at runtime rather than authored in the editor are written back into `$data*` from `Game_System.onAfterLoad`, which
 * fires later - so a reconciliation that early would see a legitimately restored row as a missing one and delete
 * the player's belongings. Aliasing `onAfterLoad` here does not help either, because this plugin loads first, which
 * puts its body *before* every extension's replay in that same chain. `Scene_Load` is no good as a hook either,
 * since J-Base-Save loads through a scene of its own.
 *
 * Every one of those paths ends up on the map, and by the time the map starts, everything that intends to populate
 * a datastore has done it. So the question gets asked from the one moment where the answer is trustworthy.
 *
 * Running on every map entry rather than once per load is deliberate: it costs three key scans, it is idempotent,
 * and it stays silent unless it actually removes something.
 */
J.BASE.Aliased.Scene_Map.set('start', Scene_Map.prototype.start);
Scene_Map.prototype.start = function()
{
  // perform original logic.
  J.BASE.Aliased.Scene_Map.get('start')
    .call(this);

  // drop anything the party is holding that the database no longer defines.
  $gameParty.pruneMissingInventoryEntries();
};
//endregion Scene_Map
