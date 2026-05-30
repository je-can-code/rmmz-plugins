//region Game_Actor
import OverlayManager from './../managers/OverlayManager.js';

/**
 * Extends {@link #skills}.<br/>
 * Routes each skill through the extended skill resolver so that overlay
 * contributions from learned extension skills are reflected in the returned list.
 * Vanilla logic handles deduplication and addedSkills; we simply remap the result.
 * @returns {RPG_Skill[]} The (potentially extended) full skill list.
 */
J.EXTEND.Aliased.Game_Actor.set('skills', Game_Actor.prototype.skills);
Game_Actor.prototype.skills = function()
{
  // perform original logic.
  const baseSkills = J.EXTEND.Aliased.Game_Actor.get('skills').call(this);

  // route each through the extended skill resolver so all consumers see overlay-merged skills.
  return baseSkills.map(skill => this.skill(skill.id));
};

/**
 * Extends {@link #hasSkill}.<br/>
 * Vanilla compares by object reference (`skills().includes($dataSkills[id])`), which
 * breaks as soon as the overlay system returns a clone instead of the original database
 * entry.  Compare by id so the result is correct regardless of whether an overlay
 * is currently active for this skill.
 * @param {number} skillId The skill id to check for.
 * @returns {boolean}
 */
J.EXTEND.Aliased.Game_Actor.set('hasSkill', Game_Actor.prototype.hasSkill);
Game_Actor.prototype.hasSkill = function(skillId)
{
  // vanilla reference equality fails once the overlay system clones a skill.
  // check by id instead — the overlay does not change which skills the actor knows,
  // only how those skills behave.
  return this.skills().some(skill => skill.id === skillId);
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