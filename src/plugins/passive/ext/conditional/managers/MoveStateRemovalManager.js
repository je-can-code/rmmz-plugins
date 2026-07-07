//region MoveStateRemovalManager
import AutoApplyStateManager from './AutoApplyStateManager.js';

/**
 * Processes {@link RPG_State#removeStateOnMoveRules} when a map battler moves.<br/>
 * Peels stacks via {@link Game_Battler#decrementStateStacks} using {@code loseAllStacksAtOnce} policy,
 * then resets the stand cooldown for matching {@code autoApplyState} rules so the rebuild
 * interval starts fresh from the moment the battler stops moving.
 */
class MoveStateRemovalManager
{
  /**
   * Strips states declared by move-removal rules on every state this battler currently carries,
   * then resets the stand auto-apply cooldown for the matching payload so stacking restarts
   * from a full interval rather than firing immediately on the next stand tick.
   * @param {Game_Actor|Game_Enemy} battler The battler that just moved.
   */
  static process(battler)
  {
    if (!$jabsEngine || $jabsEngine.absEnabled === false) return;

    const activeStates = battler.allStates();

    // only states presently on the battler can declare move-removal rules on their own row.
    for (const state of activeStates)
    {
      if (!state) continue;

      const rules = state.removeStateOnMoveRules || [];

      for (const tuple of rules)
      {
        const stateId = Number(tuple[0]);

        if (Number.isNaN(stateId) || stateId <= 0) continue;

        const stacksLossCount = this.#resolveStacksLossCount(battler, stateId);

        battler.decrementStateStacks(stateId, stacksLossCount);

        // reset the stand cooldown for this payload so the rebuild interval starts fresh.
        this.#resetStandCooldown(battler, state, stateId);
      }
    }
  }

  /**
   * Resets the autoApplyState stand cooldown for a given payload state on a given source row.
   * Finds the matching stand tuple by payload state id and stamps its cooldown to now,
   * ensuring the battler must wait the full interval before the first stack reapplies.
   * @param {Game_Actor|Game_Enemy} battler The battler that moved.
   * @param {RPG_State} sourceState The state row carrying the removeStateOnMove + autoApplyState tags.
   * @param {number} payloadStateId The payload state id to match against autoApplyState tuples.
   */
  static #resetStandCooldown(battler, sourceState, payloadStateId)
  {
    const tuples = sourceState.autoApplyStateRules || [];

    for (let tupleIndex = 0; tupleIndex < tuples.length; tupleIndex++)
    {
      const tuple = tuples[tupleIndex];
      const tupleStateId = Number(tuple[0]);
      const condition = String(tuple[1]).toLowerCase();

      if (tupleStateId !== payloadStateId) continue;
      if (condition !== 'stand') continue;

      const ruleKey = AutoApplyStateManager.buildRuleKey(sourceState, tupleIndex, payloadStateId, 'stand');

      battler.setAutoApplyLastFrame(ruleKey, Graphics.frameCount);
    }
  }

  /**
   * Mirrors {@link JABS_State#handleStackChangeFromDuration} stack peel amount for one state id.
   * @param {Game_Actor|Game_Enemy} battler The battler losing stacks.
   * @param {number} stateId The database state id to peel.
   * @returns {number} How many stacks to remove in one proc.
   */
  static #resolveStacksLossCount(battler, stateId)
  {
    const stateRow = $dataStates[stateId];

    if (!stateRow) return 1;

    const loseAllStacksAtOnce = stateRow.jabsLoseAllStacksAtOnce === true;
    const tracked = $jabsEngine.getJabsStateByUuidAndStateId(battler.getUuid(), stateId);

    if (loseAllStacksAtOnce === true && tracked)
    {
      return tracked.stackCount;
    }

    return 1;
  }
}

export default MoveStateRemovalManager;
//endregion MoveStateRemovalManager
