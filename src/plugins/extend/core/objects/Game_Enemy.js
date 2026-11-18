//region Game_Enemy
import OverlayManager from './../managers/OverlayManager.js';

/**
 * Extends {@link #learnSkill}.<br/>
 * Invalidates the caster cache when a skill is learned.
 */
J.EXTEND.Aliased.Game_Enemy.set('learnSkill', Game_Enemy.prototype.learnSkill);
Game_Enemy.prototype.learnSkill = function(skillId)
{
  // perform original logic.
  const learnedSkill = J.EXTEND.Aliased.Game_Enemy.get('learnSkill')
    .call(this, skillId);

  // also invalidate the caster cache.
  OverlayManager.invalidate(this);

  // pass along whether anything was learned, as the original promises.
  return learnedSkill;
};
//endregion Game_Enemy