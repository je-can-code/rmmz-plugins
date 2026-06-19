//region Game_Battler
import OverlayManager from './../managers/OverlayManager.js';

/**
 * Overwrites {@link #skill}.<br/>
 * Routes skill resolution through OverlayManager so any active extension overlays
 * for this battler are folded into the returned skill before callers inspect it.
 * Both actors and enemies benefit here: Game_Enemy#skills already calls this.skill()
 * per action, so enemies transparently receive overlay-merged skills when applicable.
 * @param {number} skillId The skill id to resolve.
 * @returns {RPG_Skill} The potentially extended skill.
 */
Game_Battler.prototype.skill = function(skillId)
{
  // resolve through OverlayManager so any active extensions for this battler are applied.
  return OverlayManager.getExtendedSkill(this, skillId);
};

/**
 * Overwrites {@link #state}.<br/>
 * Routes state resolution through OverlayManager so any active state extensions for this battler
 * are folded into the returned state before callers inspect it.
 * @param {number} stateId The state id to resolve.
 * @returns {RPG_State} The potentially extended state.
 */
Game_Battler.prototype.state = function(stateId)
{
  return OverlayManager.getExtendedState(this, stateId);
};
//endregion Game_Battler