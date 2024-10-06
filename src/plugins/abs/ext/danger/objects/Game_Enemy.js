//region Game_Enemy
/**
 * Gets whether or not an enemy has a visible danger indicator from their notes.
 * This will be overwritten by values provided from an event.
 * @returns {boolean}
 */
Game_Enemy.prototype.showDangerIndicator = function()
{
  // check if any of the things have this tag on it.
  const hasNoIndicatorTag = RPGManager.checkForBooleanFromNoteByRegex(this.enemy(),
    J.ABS.EXT.DANGER.RegExp.NoIndicator);

  // check if we found the tag.
  if (hasNoIndicatorTag)
  {
    // if the tag exists, don't show the indicator.
    return false;
  }

  // otherwise we use the default.
  const defaultShowing = J.ABS.EXT.DANGER.Metadata.DefaultEnemyShowDangerIndicator;

  // return the default.
  return defaultShowing;
};
//endregion Game_Enemy