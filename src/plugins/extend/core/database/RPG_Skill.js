//region RPG_Skill
/**
 * Determines whether or not there are any skill extensions on this skill.
 */
Object.defineProperty(RPG_Skill.prototype, "isSkillExtension", {
  get: function()
  {
    return !!RPGManager.getArrayFromNotesByRegex(this, J.EXTEND.RegExp.Extend, true, true);
  },
});

/**
 * Gets all skill extensions for this skill- if any.
 * Will return an empty array if none are present.
 */
Object.defineProperty(RPG_Skill.prototype, "getSkillExtensions", {
  get: function()
  {
    return RPGManager.getArrayFromNotesByRegex(this, J.EXTEND.RegExp.Extend, true);
  },
});
//endregion RPG_Skill