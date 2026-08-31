//region JABS_Engine
import BattlerMotionCoordinator from './BattlerMotionCoordinator.js';

/**
 * Extends {@link #handleDefeatedEnemy}.<br/>
 * Gives the enemy a death worth watching before it leaves the map.
 *
 * The engine's own defeat handling is untouched. It still clears followers, plays the collapse
 * sound, fires the enemy's death event actions, grants rewards and drops loot, and marks the
 * battler dying — all of which happens first, so gold and drops appear while the body is still
 * coming apart rather than after it has finished.
 *
 * What changes is only the last step. A dying battler destroys itself on the next update, and that
 * update already declines to run while the battler is waiting, so declaring the collapse and then
 * setting a wait for exactly its duration holds the corpse on screen for precisely as long as the
 * animation needs and not one frame longer. Nothing in J-ABS had to learn what a motion is.
 */
J.MOTION.EXT.ABS.Aliased.JABS_Engine.set('handleDefeatedEnemy', JABS_Engine.prototype.handleDefeatedEnemy);
JABS_Engine.prototype.handleDefeatedEnemy = function(defeatedTarget, caster)
{
  // perform original logic.
  J.MOTION.EXT.ABS.Aliased.JABS_Engine.get('handleDefeatedEnemy')
    .call(this, defeatedTarget, caster);

  // give the body somewhere to go.
  this.beginDeathMotion(defeatedTarget);
};

/**
 * Starts a defeated battler's collapse and holds it on the map long enough to be seen.
 * @param {JABS_Battler} defeatedTarget The battler that was defeated.
 */
JABS_Engine.prototype.beginDeathMotion = function(defeatedTarget)
{
  const duration = BattlerMotionCoordinator.beginDeath(defeatedTarget);

  // this battler opted out of a death animation, so it leaves as abruptly as it always did.
  if (duration <= 0) return;

  defeatedTarget.setWaitCountdown(duration);
};

/**
 * Extends {@link #postPartyCycling}.<br/>
 * Moves the state motions over to whoever is leading now.
 *
 * By the time this runs the swap is complete — `handlePartyCycleMemberChanges` has already rotated
 * the party and rebuilt the player battler — so the leader this reads is the new one.
 */
J.MOTION.EXT.ABS.Aliased.JABS_Engine.set('postPartyCycling', JABS_Engine.prototype.postPartyCycling);
JABS_Engine.prototype.postPartyCycling = function()
{
  // perform original logic.
  J.MOTION.EXT.ABS.Aliased.JABS_Engine.get('postPartyCycling')
    .call(this);

  // the character the player drives now stands for somebody else, so what it should be doing has
  // changed without a single state having been added or removed.
  BattlerMotionCoordinator.refreshLeaderStateMotions();
};
//endregion JABS_Engine