//region Scene_Boot
import DifficultyAffixManager from '../managers/DifficultyAffixManager.js';

// grants unlock J-Passive-Affix's reserved affixes, so there is nothing to validate without it.
if (J.PASSIVE.EXT.AFFIX)
{
  /**
   * Extends {@link #onDatabaseLoaded}.<br/>
   * Also validates every configured affix grant and sorts each into the slot its state belongs to.
   *
   * This is the earliest moment the work can happen and the latest it should. Deciding a grant's slot
   * reads notetags off a hydrated `$dataStates` row, which does not exist while plugin metadata is
   * being constructed - and deferring it any later would mean a broken grant on a layer nobody enables
   * never gets checked at all.
   */
  J.PASSIVE.EXT.DIFFICULTY.Aliased.Scene_Boot.set('onDatabaseLoaded', Scene_Boot.prototype.onDatabaseLoaded);
  Scene_Boot.prototype.onDatabaseLoaded = function()
  {
    // perform original logic.
    J.PASSIVE.EXT.DIFFICULTY.Aliased.Scene_Boot.get('onDatabaseLoaded')
      .call(this);

    // the original hook is where the database finished hydrating, which is what makes a grant's slot
    // tags readable at all.
    DifficultyAffixManager.assertGrantsAreValid();
  };
}
//endregion Scene_Boot