//region JABS_Engine
import JabsBossManager from '../managers/JabsBossManager.js';

/**
 * Extends {@link #resolveKnockbackResist}.<br/>
 * Also keeps every participant of the boss fight exactly where it stands.
 *
 * A boss is immune to knockback outright, however hard it is hit and whatever it otherwise resists. A boss that
 * can be shoved around its own arena can be wedged into a doorway or pinned in a corner, and then the fight is
 * fought against the walls of the room rather than against the boss. A pull is knockback aimed back toward the
 * caster, and dragging a boss into that same doorway is the same problem, so full resistance refuses both: J-ABS
 * and J-ABS-Tools read this one resistance before moving anyone. Only being moved is refused: every state a hit
 * carries, a stun among them, still lands.
 * @param {JABS_Battler} target The map battler whose resistance is being resolved.
 * @returns {number}
 */
J.ABS.EXT.BOSS.Aliased.JABS_Engine.set('resolveKnockbackResist', JABS_Engine.prototype.resolveKnockbackResist);
JABS_Engine.prototype.resolveKnockbackResist = function(target)
{
  // a boss stands its ground: full resistance, which refuses even a hop in place.
  if (JabsBossManager.isParticipant(target)) return JABS_Engine.FullKnockbackResist;

  // perform original logic.
  return J.ABS.EXT.BOSS.Aliased.JABS_Engine.get('resolveKnockbackResist')
    .call(this, target);
};

/**
 * Extends {@link #handleDefeatedEnemy}.<br/>
 * Also tells the boss fight an enemy fell, so the moment its last winning body goes down, whatever the fight
 * spawned leaves with it. This is the handler that starts the fallen enemy's death scene, and the fight's own
 * update stands still while a scene plays, so here is the last moment before the boss's last words.
 * @param {JABS_Battler} defeatedTarget The enemy that was defeated.
 * @param {JABS_Battler} caster The battler that defeated it.
 */
J.ABS.EXT.BOSS.Aliased.JABS_Engine.set('handleDefeatedEnemy', JABS_Engine.prototype.handleDefeatedEnemy);
JABS_Engine.prototype.handleDefeatedEnemy = function(defeatedTarget, caster)
{
  // perform original logic.
  J.ABS.EXT.BOSS.Aliased.JABS_Engine.get('handleDefeatedEnemy')
    .call(this, defeatedTarget, caster);

  // a fight whose last winning body just fell takes what it spawned with it.
  JabsBossManager.onEnemyDefeated();
};
//endregion JABS_Engine