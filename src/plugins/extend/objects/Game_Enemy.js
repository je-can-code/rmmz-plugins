//region Game_Enemy
/**
 * Extends {@link #learnSkill}.<br/>
 * Invalidates the caster cache when a skill is learned.
 */
J.EXTEND.Aliased.Game_Enemy.set('learnSkill', Game_Enemy.prototype.learnSkill);
Game_Enemy.prototype.learnSkill = function(skillId)
{
  // perform original logic.
  J.EXTEND.Aliased.Game_Enemy.get('learnSkill')
    .call(this, skillId);

  // also invalidate the caster cache.
  OverlayManager.invalidate(this);
};
//endregion Game_Enemy