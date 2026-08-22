//region JABS_Engine
import JABS_MetricsManager from './JABS_MetricsManager.js';

/**
 * Extends {@link #handleDefeatedEnemy}.<br/>
 * Also records the kill against the appropriate tally.
 * @param {JABS_Battler} defeatedTarget The `JABS_Battler` that was defeated.
 * @param {JABS_Battler} caster The `JABS_Battler` that defeated the target.
 */
J.ABS.EXT.METRICS.Aliased.JABS_Engine.set('handleDefeatedEnemy', JABS_Engine.prototype.handleDefeatedEnemy);
JABS_Engine.prototype.handleDefeatedEnemy = function(defeatedTarget, caster)
{
  // perform original logic.
  J.ABS.EXT.METRICS.Aliased.JABS_Engine.get('handleDefeatedEnemy')
    .call(this, defeatedTarget, caster);

  // record the defeat.
  JABS_MetricsManager.trackDefeatedEnemy(defeatedTarget);
};

/**
 * Extends {@link #handleDefeatedAlly}.<br/>
 * Also records that a party member went down.
 * @param {JABS_Battler} defeatedAlly The ally that was defeated.
 */
J.ABS.EXT.METRICS.Aliased.JABS_Engine.set('handleDefeatedAlly', JABS_Engine.prototype.handleDefeatedAlly);
JABS_Engine.prototype.handleDefeatedAlly = function(defeatedAlly)
{
  // perform original logic.
  J.ABS.EXT.METRICS.Aliased.JABS_Engine.get('handleDefeatedAlly')
    .call(this, defeatedAlly);

  // record the downing.
  JABS_MetricsManager.trackDefeatedAlly();
};

/**
 * Extends {@link #handleDefeatedPlayer}.<br/>
 * Also records the death.
 *
 * The tally is taken before the original logic rather than after, because handling a defeated player
 * is what triggers the game over- there is no guarantee the rest of this function returns.
 */
J.ABS.EXT.METRICS.Aliased.JABS_Engine.set('handleDefeatedPlayer', JABS_Engine.prototype.handleDefeatedPlayer);
JABS_Engine.prototype.handleDefeatedPlayer = function()
{
  // record the death.
  JABS_MetricsManager.trackDefeatedPlayer();

  // perform original logic.
  J.ABS.EXT.METRICS.Aliased.JABS_Engine.get('handleDefeatedPlayer')
    .call(this);
};

/**
 * Extends {@link #postExecuteSkillEffects}.<br/>
 * Also records the combat outcome of the hit that just landed.
 * @param {JABS_Action} action The action being executed.
 * @param {JABS_Battler} target The target the skill effects were applied against.
 */
J.ABS.EXT.METRICS.Aliased.JABS_Engine.set('postExecuteSkillEffects', JABS_Engine.prototype.postExecuteSkillEffects);
JABS_Engine.prototype.postExecuteSkillEffects = function(action, target)
{
  // perform original logic, which is what puts the result on the target.
  J.ABS.EXT.METRICS.Aliased.JABS_Engine.get('postExecuteSkillEffects')
    .call(this, action, target);

  // tools are consumables rather than combat- counting a thrown bomb as a sword swing would make
  // the damage tallies say something the player did not do.
  if (action.getCooldownType() === JABS_Button.Tool) return;

  // an enemy on the receiving end means the party was attacking.
  if (target.isEnemy())
  {
    JABS_MetricsManager.trackAttackData(target);
  }
  // an actor on the receiving end means the party was being attacked.
  else if (target.isActor())
  {
    JABS_MetricsManager.trackDefensiveData(target);
  }
};

/**
 * Extends {@link #executeMapAction}.<br/>
 * Also records which slot the player is leaning on.
 * @param {JABS_Battler} caster The battler executing the action.
 * @param {JABS_Action} action The action being executed.
 * @param {number?} targetX The target's `x` coordinate, if applicable.
 * @param {number?} targetY The target's `y` coordinate, if applicable.
 */
J.ABS.EXT.METRICS.Aliased.JABS_Engine.set('executeMapAction', JABS_Engine.prototype.executeMapAction);
JABS_Engine.prototype.executeMapAction = function(caster, action, targetX, targetY)
{
  // perform original logic.
  J.ABS.EXT.METRICS.Aliased.JABS_Engine.get('executeMapAction')
    .call(this, caster, action, targetX, targetY);

  // these are metrics about how the player plays, so allies and enemies swinging do not count.
  if (caster.isPlayer() === false) return;

  // record which slot it came from.
  JABS_MetricsManager.trackActionData(action);
};
//endregion JABS_Engine