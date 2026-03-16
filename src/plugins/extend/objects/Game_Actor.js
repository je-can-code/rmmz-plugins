//region Game_Actor
/**
 * Overrides {@link #skill}<br/>.
 * Overlays the skill with any skill extensions.
 * @param {number} skillId The skill id to get the skill for.
 * @returns {RPG_Skill} The potentially extended skill.
 */
Game_Actor.prototype.skill = function(skillId)
{
  return OverlayManager.getExtendedSkill(this, skillId);
};

/**
 * Extends {@link #learnSkill}.<br/>
 * Invalidates the caster cache when a skill is learned.
 */
J.EXTEND.Aliased.Game_Actor.set('learnSkill', Game_Actor.prototype.learnSkill);
Game_Actor.prototype.learnSkill = function(skillId)
{
  // perform original logic.
  J.EXTEND.Aliased.Game_Actor.get('learnSkill')
    .call(this, skillId);

  // also invalidate the caster cache.
  OverlayManager.invalidate(this);
};

/**
 * Extends {@link #forgetSkill}.<br/>
 * Invalidates the caster cache when a skill is forgotten.
 */
J.EXTEND.Aliased.Game_Actor.set('forgetSkill', Game_Actor.prototype.forgetSkill);
Game_Actor.prototype.forgetSkill = function(skillId)
{
  // perform original logic.
  J.EXTEND.Aliased.Game_Actor.get('forgetSkill')
    .call(this, skillId);

  // also invalidate the caster cache.
  OverlayManager.invalidate(this);
};
//endregion Game_Actor