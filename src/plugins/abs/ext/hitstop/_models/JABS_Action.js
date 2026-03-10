//region JABS_Action (hitstop helpers)
/**
 * Gets the hitstop frames declared on the skill via `<hitstop:N>`.
 * Returns 0 if not tagged.
 * @returns {number}
 */
JABS_Action.prototype.getHitstopFrames = function()
{
  // read a number from the skill’s notes.
  const skill = this.getBaseSkill();

  // extract the frames from the tag when present.
  const frames = RPGManager.getNumberFromNoteByRegex(skill, J.ABS.EXT.HITSTOP.RegExp.Hitstop, true);

  // return the frames or 0 if not found.
  return frames || 0;
};

/**
 * Whether this skill disables hitstop via `<noHitstop>`.
 * @returns {boolean}
 */
JABS_Action.prototype.skillDisablesHitstop = function()
{
  // read the existance of the tag from notes.
  const skill = this.getBaseSkill();

  // return whether or not the no-hitstop tag exists.
  return RPGManager.checkForBooleanFromNoteByRegex(skill, J.ABS.EXT.HITSTOP.RegExp.NoHitstop);
};
//endregion JABS_Action (hitstop helpers)