//region AutoApplyStateManager
import AutoRuleManager from './AutoRuleManager.js';

/**
 * Schedules real JABS state applications from {@link RPG_BaseItem#autoApplyStateRules} tuples.
 *
 * Uses {@link Game_Battler#addState} as the terminal dispatch — separate from the passive grant
 * pipeline so states applied here behave as live combat states with durations and removal.
 * The state is always applied to the rule bearer (self). For aura-style application to nearby
 * battlers, see {@link AutoApplyStateOnNearbyManager}.
 */
class AutoApplyStateManager extends AutoRuleManager
{
  /**
   * The name of the source property that holds auto-apply-state rule tuples.
   * @returns {string} - The property name holding rule tuples on source objects.
   */
  static get rulesProperty() { return 'autoApplyStateRules'; }

  /**
   * Evaluates every rule matching the given condition kind — delegates to {@link tryDispatch}.
   * Exposed as a named method so callers can invoke condition-scoped evaluations without
   * knowing the base class method name.
   * @param {Game_Actor|Game_Enemy} battler - The battler whose rules are evaluated.
   * @param {string} conditionKind - The condition kind to evaluate (e.g. 'move', 'time').
   */
  static tryApply(battler, conditionKind)
  {
    return this.tryDispatch(battler, conditionKind);
  }

  /**
   * Pushes a real combat state onto the battler through the JABS addState path.
   * @param {Game_Actor|Game_Enemy} battler - The battler receiving the state.
   * @param {number} stateId - The database id of the state to apply.
   * @param {any[]} _tuple - The full authored tuple; unused here, this rule's whole payload is the id.
   * @returns {boolean} - True when addState was called and the state was addable.
   */
  static dispatch(battler, stateId, _tuple)
  {
    // passive-tracked states cannot be layered on as combat states.
    if (battler.isStateAddable(stateId) === false) return false;

    // apply the state with self as the source so JABS state tracking has a valid attacker.
    battler.addState(stateId, battler);

    return true;
  }
}

export default AutoApplyStateManager;
//endregion AutoApplyStateManager
