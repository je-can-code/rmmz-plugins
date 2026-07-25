//region JABS_Battler
import AutoApplyStateManager from './AutoApplyStateManager.js';
import AutoApplyStateOnNearbyManager from './AutoApplyStateOnNearbyManager.js';
import AutoExecuteSkillManager from './AutoExecuteSkillManager.js';
import MoveStateRemovalManager from './MoveStateRemovalManager.js';
import SkillExecutionStateRemovalManager from './SkillExecutionStateRemovalManager.js';

/**
 * Extends {@link JABS_Battler#update}.<br/>
 * Throttles passive rule reconciles and stamps movement timestamps for sinceLast/movedWithin rules.
 */
J.PASSIVE.EXT.CONDITIONAL.Aliased.JABS_Battler.set('update', JABS_Battler.prototype.update);
JABS_Battler.prototype.update = function()
{
  // perform original logic.
  J.PASSIVE.EXT.CONDITIONAL.Aliased.JABS_Battler.get('update')
    .call(this);

  // keep movement stamps and reconcile timer in sync with map simulation.
  this.updatePassiveRuleMovementTracking();
  this.updatePassiveRuleReconcile();
};

/**
 * Extends {@link JABS_Battler#setLastUsedSkillId}.<br/>
 * Stamps attack timestamps when this battler executes map skills.
 */
J.PASSIVE.EXT.CONDITIONAL.Aliased.JABS_Battler.set(
  'setLastUsedSkillId',
  JABS_Battler.prototype.setLastUsedSkillId
);
JABS_Battler.prototype.setLastUsedSkillId = function(skillId)
{
  // perform original logic.
  J.PASSIVE.EXT.CONDITIONAL.Aliased.JABS_Battler.get('setLastUsedSkillId')
    .call(this, skillId);

  // unwrap to the underlying Game_Battler for timestamp storage.
  const battler = this.getBattler();

  if (!battler) return;

  // real skill execution — not queued action polling — drives attackedWithin/sinceLastAttacked.
  battler.stampPassiveRuleAttackedFrame();

  SkillExecutionStateRemovalManager.process(battler, skillId);
};

/**
 * Delegates throttled passive rule reconciliation to the underlying battler.<br/>
 * Called every JABS update tick while this map battler is active.
 */
JABS_Battler.prototype.updatePassiveRuleReconcile = function()
{
  const battler = this.getBattler();

  // no underlying battler means nothing to reconcile.
  if (!battler) return;

  // advance the battler-owned timer; refresh happens when drift is detected.
  battler.updatePassiveRuleReconcileTimer();

  // periodic auto-apply rules (time condition) run every JABS tick while on the map.
  AutoApplyStateManager.processTimeRules(battler);

  // proximity-gated auto-apply-self rules mirror the auto-execute proximity path.
  AutoApplyStateManager.processEnemiesNearbyRules(battler);
  AutoApplyStateManager.processAlliesNearbyRules(battler);

  // proximity-gated aura rules apply states onto nearby battlers rather than the bearer.
  AutoApplyStateOnNearbyManager.processEnemiesNearbyRules(battler);
  AutoApplyStateOnNearbyManager.processAlliesNearbyRules(battler);

  // proximity-gated auto-execute rules run on the same tick cadence as time rules.
  AutoExecuteSkillManager.processTimeRules(battler);
  AutoExecuteSkillManager.processEnemiesNearbyRules(battler);
  AutoExecuteSkillManager.processAlliesNearbyRules(battler);

  // idle auto-apply rules (stand condition) run when this battler has not moved this frame.
  AutoApplyStateManager.processStandRules(battler);

  // idle auto-execute rules mirror the stand auto-apply path.
  AutoExecuteSkillManager.processStandRules(battler);
};

/**
 * Stamps movement when this map battler's character coordinates change.<br/>
 * Feeds {@code sinceLastMoved} and {@code movedWithin} gate kinds on the underlying battler.
 */
JABS_Battler.prototype.updatePassiveRuleMovementTracking = function()
{
  const character = this.getCharacter();

  if (!character) return;

  const battler = this.getBattler();

  if (!battler) return;

  const tracker = battler._j._passive._conditional;

  const currentX = character._realX;
  const currentY = character._realY;

  // seed baseline on first update so standing still does not count as movement.
  if (tracker._lastTrackedX === null)
  {
    tracker._lastTrackedX = currentX;
    tracker._lastTrackedY = currentY;

    return;
  }

  // no coordinate change — nothing to stamp this frame.
  if (tracker._lastTrackedX === currentX && tracker._lastTrackedY === currentY) return;

  // persist the new baseline for the next comparison.
  tracker._lastTrackedX = currentX;
  tracker._lastTrackedY = currentY;

  battler.stampPassiveRuleMovedFrame();

  MoveStateRemovalManager.process(battler);
};
//endregion JABS_Battler