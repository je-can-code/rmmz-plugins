//region Scene_Boot
/**
 * Extends {@link #onDatabaseLoaded}.<br/>
 * Also validates every configured affix grant and sorts each into the slot its state belongs to.
 *
 * This is the earliest moment the work can happen and the latest it should. Deciding a grant's slot
 * reads notetags off a hydrated `$dataStates` row, which does not exist while plugin metadata is
 * being constructed - and deferring it any later would mean a broken grant on a layer nobody enables
 * never gets checked at all.
 */
J.DIFFICULTY.EXT.AFFIX.Aliased.Scene_Boot.set('onDatabaseLoaded', Scene_Boot.prototype.onDatabaseLoaded);
Scene_Boot.prototype.onDatabaseLoaded = function()
{
  // perform original logic.
  J.DIFFICULTY.EXT.AFFIX.Aliased.Scene_Boot.get('onDatabaseLoaded')
    .call(this);

  // the original hook is where the database finished hydrating, which is what makes a grant's
  // slot tags readable at all.
  J.DIFFICULTY.EXT.AFFIX.Metadata.assertGrantsAreValid();
};
//endregion Scene_Boot