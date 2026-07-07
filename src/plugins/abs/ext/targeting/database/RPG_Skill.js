//region RPG_Skill
/**
 * Whether this skill requires the tactical targeting UX (cursor-driven target selection)
 * instead of firing immediately, via the `<targeted>` tag.
 */
Object.defineProperty(RPG_Skill.prototype, 'targeted', {
  get: function()
  {
    return RPGManager.checkForBooleanFromNoteByRegex(this, J.ABS.EXT.TARGETING.RegExp.Targeted);
  }
});
//endregion RPG_Skill
