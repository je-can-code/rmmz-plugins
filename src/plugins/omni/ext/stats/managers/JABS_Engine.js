//region JABS_Engine
import StatistopediaRecorder from './StatistopediaRecorder.js';

/**
 * Extends {@link #preExecuteSkillEffects}.<br/>
 * Also remembers what the target was standing on before the hit lands.
 *
 * Overkill is the reason this hook is aliased at all. The engine clamps hp at zero, so once a lethal
 * blow has been applied there is no longer any record of how much further it would have gone- the
 * only moment that number exists is the one before the damage is dealt.
 * @param {JABS_Action} action The action being executed.
 * @param {JABS_Battler} target The target the skill effects are about to be applied against.
 */
J.OMNI.EXT.STATS.Aliased.JABS_Engine.set('preExecuteSkillEffects', JABS_Engine.prototype.preExecuteSkillEffects);
JABS_Engine.prototype.preExecuteSkillEffects = function(action, target)
{
  // perform original logic.
  J.OMNI.EXT.STATS.Aliased.JABS_Engine.get('preExecuteSkillEffects')
    .call(this, action, target);

  // remember the hp before anything touches it.
  StatistopediaRecorder.rememberPreHitHp(target);
};

/**
 * Extends {@link #postExecuteSkillEffects}.<br/>
 * Also files the outcome of the hit into the statistopedia's records.
 *
 * The item-slot exclusion mirrors J-ABS-Metrics exactly, and it has to: the counters this produces
 * are the denominators for rates whose numerators live over there, so a hit counted here under
 * looser rules than the crit counted there would produce a rate above one hundred percent.
 * @param {JABS_Action} action The action being executed.
 * @param {JABS_Battler} target The target the skill effects were applied against.
 */
J.OMNI.EXT.STATS.Aliased.JABS_Engine.set('postExecuteSkillEffects', JABS_Engine.prototype.postExecuteSkillEffects);
JABS_Engine.prototype.postExecuteSkillEffects = function(action, target)
{
  // perform original logic, which is what puts the result on the target.
  J.OMNI.EXT.STATS.Aliased.JABS_Engine.get('postExecuteSkillEffects')
    .call(this, action, target);

  // items are consumables rather than combat, and are excluded from every damage tally.
  const cooldownType = action.getCooldownType();
  if (JABS_MetricsManager.isItemSlot(cooldownType)) return;

  // a hit that dealt no hp damage is a state application or a heal, not an attack.
  const { hpDamage } = target.getBattler()
    .result();
  if (hpDamage <= 0) return;

  // an enemy on the receiving end means the party was attacking.
  if (target.isEnemy())
  {
    StatistopediaRecorder.trackHitLanded(action, target);
  }
  // an actor on the receiving end means the party was being attacked.
  else if (target.isActor())
  {
    StatistopediaRecorder.trackHitTaken(target);
  }
};

/**
 * Extends {@link #handleDefeatedEnemy}.<br/>
 * Also files the kill against the enemy, the map, and the running streak.
 * @param {JABS_Battler} defeatedTarget The `JABS_Battler` that was defeated.
 * @param {JABS_Battler} caster The `JABS_Battler` that defeated the target.
 */
J.OMNI.EXT.STATS.Aliased.JABS_Engine.set('handleDefeatedEnemy', JABS_Engine.prototype.handleDefeatedEnemy);
JABS_Engine.prototype.handleDefeatedEnemy = function(defeatedTarget, caster)
{
  // perform original logic.
  J.OMNI.EXT.STATS.Aliased.JABS_Engine.get('handleDefeatedEnemy')
    .call(this, defeatedTarget, caster);

  // record the defeat.
  StatistopediaRecorder.trackDefeatedEnemy(defeatedTarget);
};

/**
 * Extends {@link #handleDefeatedPlayer}.<br/>
 * Also files the death against the map and ends the running streak.
 *
 * The record is taken before the original logic rather than after, matching J-ABS-Metrics and for the
 * same reason: handling a defeated player is what triggers the game over, so there is no guarantee
 * the rest of the function returns.
 */
J.OMNI.EXT.STATS.Aliased.JABS_Engine.set('handleDefeatedPlayer', JABS_Engine.prototype.handleDefeatedPlayer);
JABS_Engine.prototype.handleDefeatedPlayer = function()
{
  // record the death.
  StatistopediaRecorder.trackDefeatedPlayer();

  // perform original logic.
  J.OMNI.EXT.STATS.Aliased.JABS_Engine.get('handleDefeatedPlayer')
    .call(this);
};

/**
 * Extends {@link #executeMapAction}.<br/>
 * Also files which skill the player reached for.
 * @param {JABS_Battler} caster The battler executing the action.
 * @param {JABS_Action} action The action being executed.
 * @param {number?} targetX The target's `x` coordinate, if applicable.
 * @param {number?} targetY The target's `y` coordinate, if applicable.
 */
J.OMNI.EXT.STATS.Aliased.JABS_Engine.set('executeMapAction', JABS_Engine.prototype.executeMapAction);
JABS_Engine.prototype.executeMapAction = function(caster, action, targetX, targetY)
{
  // perform original logic.
  J.OMNI.EXT.STATS.Aliased.JABS_Engine.get('executeMapAction')
    .call(this, caster, action, targetX, targetY);

  // this is a record of how the player plays, so allies and enemies swinging do not count.
  if (caster.isPlayer() === false) return;

  // record which skill it was.
  StatistopediaRecorder.trackSkillUsage(action);
};
//endregion JABS_Engine