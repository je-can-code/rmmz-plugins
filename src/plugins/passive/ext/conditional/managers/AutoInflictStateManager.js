//region AutoInflictStateManager
import AutoRuleManager from './AutoRuleManager.js';

/**
 * Schedules real JABS state applications from {@link RPG_BaseItem#autoInflictStateRules} tuples.
 *
 * Unlike {@link AutoApplyStateManager} (self-targeted) and {@link AutoApplyStateOnNearbyManager}
 * (proximity-targeted), this manager reads rules from the battler who just did something to an
 * external battler- inflicted a state, or knocked them back- and applies the configured payload
 * state onto that same external target, not onto the rule bearer, and not onto anything nearby.
 */
class AutoInflictStateManager extends AutoRuleManager
{
  /**
   * The name of the source property that holds auto-inflict-state rule tuples.
   * @returns {string} - The property name holding rule tuples on source objects.
   */
  static get rulesProperty() { return 'autoInflictStateRules'; }

  /**
   * Tracks the current nesting depth of in-flight auto-inflict dispatches.
   *
   * Used to prevent synchronous re-entry when a dispatched state is itself negative-tagged and
   * would otherwise immediately re-trigger this same manager via {@link #scheduleInflictedStateTriggers}.
   * @type {number}
   */
  static #inflictDepth = 0;

  /**
   * Pushes a real combat state onto the target battler through the JABS addState path.
   *
   * Depth-guarded to prevent infinite re-entry- if the dispatched state is itself negative-tagged,
   * applying it fires {@link Game_Battler#onJabsStateInflicted} again, which could otherwise chain
   * indefinitely.
   * @param {Game_Actor|Game_Enemy} battler - The target battler receiving the state.
   * @param {number} stateId - The database id of the state to apply.
   * @param {Game_Actor|Game_Enemy} inflictor - The battler who actually inflicted this state- the
   * bearer of the {@code autoInflictState} rule, credited as the source for JABS state tracking.
   * @returns {boolean} - True when addState was called and the state was addable.
   */
  static dispatch(battler, stateId, inflictor)
  {
    // read the configured maximum nesting depth from plugin metadata.
    const maxDepth = J.PASSIVE.EXT.CONDITIONAL.Metadata.autoInflictStateMaxDepth || 1;

    // the dispatch stack is already at maximum depth- skip to avoid infinite re-entry.
    if (AutoInflictStateManager.#inflictDepth >= maxDepth) return false;

    // passive-tracked states cannot be layered on as combat states.
    if (battler.isStateAddable(stateId) === false) return false;

    // increment the depth counter before entering the state application.
    AutoInflictStateManager.#inflictDepth += 1;

    try
    {
      // apply the state crediting the rule bearer as the true inflictor- by default, the source
      // of an applied state is whoever actually inflicted it, not the target receiving it.
      battler.addState(stateId, inflictor);

      return true;
    }
    finally
    {
      // always decrement the depth counter when leaving the dispatch scope.
      AutoInflictStateManager.#inflictDepth -= 1;
    }
  }

  /**
   * Evaluates every {@code autoInflictState} rule on the inflicting battler and applies matching
   * payload states onto the battler that was just afflicted.
   * @param {Game_Actor|Game_Enemy} applier - The battler whose rules are evaluated (the inflictor).
   * @param {Game_Actor|Game_Enemy} target - The battler who was just afflicted by {@code applier}.
   * @param {number} inflictedStateId - The database id of the state that was just inflicted.
   */
  static scheduleInflictedStateTriggers(applier, target, inflictedStateId)
  {
    // no ABS context means there is nothing to schedule.
    if (!$jabsEngine || $jabsEngine.absEnabled === false) return;

    // a valid applier/target pair is required to evaluate or dispatch anything.
    if (!applier || !target) return;

    // look up the just-inflicted state's database row to determine its polarity.
    const inflictedState = $dataStates[inflictedStateId];

    // if the state data is missing, polarity-specific rules cannot be evaluated.
    if (!inflictedState) return;

    // negative polarity comes from the state's own <type:negative> classifier.
    const polarityKind = inflictedState.isNegativeType()
      ? 'negaStateInflicted'
      : 'posiStateInflicted';

    // match either the polarity-specific kind or the polarity-agnostic "any" kind.
    this._dispatchMatchingRules(applier, target, kind => kind === 'anyStateInflicted' || kind === polarityKind);
  }

  /**
   * Evaluates every {@code autoInflictState} rule on the knocking-back battler and applies matching
   * payload states onto the battler that was just knocked back.
   * @param {Game_Actor|Game_Enemy} applier - The battler whose rules are evaluated (who knocked back).
   * @param {Game_Actor|Game_Enemy} target - The battler who was just knocked back by {@code applier}.
   */
  static scheduleKnockbackTriggers(applier, target)
  {
    // no ABS context means there is nothing to schedule.
    if (!$jabsEngine || $jabsEngine.absEnabled === false) return;

    // a valid applier/target pair is required to evaluate or dispatch anything.
    if (!applier || !target) return;

    // onKnockback has no polarity concept- it either matches or it doesn't.
    this._dispatchMatchingRules(applier, target, kind => kind === 'onKnockback');
  }

  /**
   * Shared dispatch loop for every {@code autoInflictState} condition kind.
   *
   * Cannot reuse the base {@link AutoRuleManager.tryDispatch} loop because that assumes one battler
   * plays both roles (rule owner and dispatch recipient)- here the rules live on {@code applier}
   * but the payload state lands on {@code target}. Cooldown is tracked on {@code applier} since
   * the rule itself belongs to them, regardless of which target it most recently fired against.
   * @param {Game_Actor|Game_Enemy} applier - The battler whose rules are evaluated.
   * @param {Game_Actor|Game_Enemy} target - The battler the payload state should land on.
   * @param {(kind: string) => boolean} kindMatches - Predicate deciding whether a tuple's condition
   * kind applies to the event currently being scheduled.
   */
  static _dispatchMatchingRules(applier, target, kindMatches)
  {
    // collect every authored rule tuple from the inflicting battler's passive-capable sources.
    const rules = this.collectRules(applier);

    // iterate over each rule entry and attempt a dispatch when the condition kind matches.
    for (const entry of rules)
    {
      // destructure the relevant fields from the rule entry.
      const { source, tuple, tupleIndex } = entry;

      // parse the payload state id, condition kind, and cooldown from the tuple.
      const id = Number(tuple[0]);
      const kind = String(tuple[1]);
      const cooldownFrames = Number(tuple[2]);

      // skip malformed tuples with invalid payload ids.
      if (Number.isNaN(id) || id <= 0) continue;

      // skip tuples whose condition kind doesn't apply to this event.
      if (kindMatches(kind) === false) continue;

      // skip tuples with invalid cooldown values.
      if (Number.isNaN(cooldownFrames) || cooldownFrames < 0) continue;

      // build the stable key used to track the last-dispatch frame for this rule.
      const ruleKey = this.buildRuleKey(source, tupleIndex, id, kind);

      // capture the current frame count as the reference point for cooldown evaluation.
      const now = Graphics.frameCount;

      // read the frame this rule last successfully dispatched, tracked on the inflicting battler.
      const lastFrame = applier.getAutoRuleLastFrame(ruleKey);

      // the cooldown window has not yet elapsed- skip dispatch for this rule.
      if (lastFrame > 0 && (now - lastFrame) < cooldownFrames) continue;

      // attempt the terminal dispatch onto the target, crediting applier as the source.
      const dispatched = this.dispatch(target, id, applier);

      // only stamp the cooldown, on the rule bearer, when the dispatch actually succeeded.
      if (dispatched === true)
      {
        applier.setAutoRuleLastFrame(ruleKey, now);
      }
    }
  }
}

export default AutoInflictStateManager;
//endregion AutoInflictStateManager
