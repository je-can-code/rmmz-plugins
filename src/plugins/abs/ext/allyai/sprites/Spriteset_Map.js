//region Spriteset_Map
/**
 * Extends {@link #refreshAllCharacterSprites}.<br/>
 * Also refreshes follower ally battlers after sprites have been refreshed.
 */
J.ABS.EXT.ALLYAI.Aliased.Spriteset_Map.set(
  'refreshAllCharacterSprites',
  Spriteset_Map.prototype.refreshAllCharacterSprites);
Spriteset_Map.prototype.refreshAllCharacterSprites = function()
{
  // perform original logic.
  J.ABS.EXT.ALLYAI.Aliased.Spriteset_Map.get('refreshAllCharacterSprites').call(this);

  // After rebinds, rebuild the ally battlers (once per refresh request).
  if ($jabsEngine.requestAlliesRefresh)
  {
    // Re-parse followers into JABS_Battlers now that follower <-> actor links are current.
    $gameMap.updateAllies();

    // reset the allies refresh request flag.
    $jabsEngine.requestAlliesRefresh = false;
  }
};

//endregion Spriteset_Map