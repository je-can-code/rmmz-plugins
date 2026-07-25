//region RPG_Skill
/**
 * Whether or not this skill is a skill-extension skill (bears an {@code <extend:[IDs]>} tag).
 * Extension skills are excluded from the JABS AI skill pool.
 * @type {boolean}
 */
Object.defineProperty(RPG_Skill.prototype, 'isSkillExtender', {
  get: function()
  {
    return J.EXTEND.RegExp.Extend.test(this.note);
  },
});
//endregion RPG_Skill
