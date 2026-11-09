//region JABS_Engine
import JabsBossManager from '../managers/JabsBossManager.js';

/**
 * Extends {@link #resolveKnockbackDistance}.<br/>
 * Also keeps every participant of the boss fight exactly where it stands.
 *
 * A boss is immune to knockback outright, however hard it is hit and whatever it otherwise resists. A boss that
 * can be shoved around its own arena can be wedged into a doorway or pinned in a corner, and then the fight is
 * fought against the walls of the room rather than against the boss. Only being moved is refused: every state a
 * hit carries, a stun among them, still lands.
 */
J.ABS.EXT.BOSS.Aliased.JABS_Engine.set('resolveKnockbackDistance', JABS_Engine.prototype.resolveKnockbackDistance);
JABS_Engine.prototype.resolveKnockbackDistance = function(action, target)
{
  // a boss stands its ground: no distance at all, which is not the same thing as a hop in place.
  if (JabsBossManager.isParticipant(target)) return null;

  // perform original logic.
  return J.ABS.EXT.BOSS.Aliased.JABS_Engine.get('resolveKnockbackDistance')
    .call(this, action, target);
};
//endregion JABS_Engine