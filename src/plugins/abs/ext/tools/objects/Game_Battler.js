//region Game_Battler
/**
 * Determines whether or not this battler is a gap close target.
 * @returns {boolean} True if this battler is a gap close target, false otherwise.
 */
Game_Battler.prototype.isGapClosable = function()
{
  return RPGManager.checkForBooleanFromAllNotesByRegex(
    this.getAllNotes(),
    J.ABS.EXT.TOOLS.RegExp.GapCloseTarget
  // policy step inside is gap closable.
  );
};
//endregion Game_Battler