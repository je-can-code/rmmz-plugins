//region AutoInflictStateManager
import AutoRuleManager from './AutoRuleManager.js';

/**
 * Schedules real JABS state applications from {@link RPG_BaseItem#autoInflictStateRules} tuples.
 *
 * Unlike {@link AutoApplyStateManager} (self-targeted) and {@link AutoApplyStateOnNearbyManager}
 * (proximity-targeted), this manager reads rules from the battler who just did something to an
 * external battler- inflicted a state, or knocked them back- and applies the configured payload
 * state onto that same external target, not onto the rule bearer, and not onto anything nearby.
 *
 * The payload is rolled for at its full strength, through the same roll as any other state applied
 * by chance, {@link JABS_Fate.resolveStateProcCount}. The rule bearer is the roller: the target's
 * resistances and the luck between the two decide how likely it is to land, the payload's own
 * {@code <type:negative>} classifier decides whether the target's curse helps it land or stands in
 * its way, and the bearer's Accumulate Mode and Encore can land it more than once.
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
   * Rolls the payload state against the target, and pushes it onto the target through the JABS
   * addState path once for every time it lands.
   *
   * The inflictor rolls at the payload's full strength through {@link JABS_Fate.resolveStateProcCount}:
   * the target's State Rate and {@code <stateTypeResist>}, and the luck between the two battlers,
   * shape the chance; the payload's own {@code <type:negative>} classifier decides whether the
   * target's curse is one more chance for it to land or one more hurdle for it to clear; and the
   * inflictor's Accumulate Mode and Encore decide how many times it lands. A payload the target
   * cannot take at all is never rolled for, and every landing checks the target's immunities on its own.
   *
   * Depth-guarded to prevent infinite re-entry- if the dispatched state is itself negative-tagged,
   * applying it fires {@link Game_Battler#onJabsStateInflicted} again, which could otherwise chain
   * indefinitely. The guard holds across every landing of one roll, so none of them can re-enter, and
   * a dispatch it refuses is never rolled for.
   * @param {Game_Actor|Game_Enemy} battler - The target battler receiving the state.
   * @param {number} stateId - The database id of the state to apply.
   * @param {Game_Actor|Game_Enemy} inflictor - The battler who actually inflicted this state- the
   * bearer of the {@code autoInflictState} rule, who rolls for the payload and is credited as its
   * source for JABS state tracking.
   * @returns {boolean} - True when the payload was rolled for against the target, whether or not it landed.
   */
  static dispatch(battler, stateId, inflictor)
  {
    // read the configured maximum nesting depth from plugin metadata.
    const maxDepth = J.PASSIVE.EXT.CONDITIONAL.Metadata.autoInflictStateMaxDepth || 1;

    // the dispatch stack is already at maximum depth- skip to avoid infinite re-entry.
    if (AutoInflictStateManager.#inflictDepth >= maxDepth) return false;

    // a payload the target cannot take at all- a passive it holds, or one it is immune to- is never rolled for.
    if (battler.isStateAddable(stateId) === false) return false;

    // the inflictor rolls the payload at its full strength against the target's resistances.
    const procCount = JABS_Fate.resolveStateProcCount(inflictor, battler, stateId, 100);

    // increment the depth counter before entering the state application.
    AutoInflictStateManager.#inflictDepth += 1;

    try
    {
      // apply the state once per landing, crediting the rule bearer as the true inflictor- by default,
      // the source of an applied state is whoever actually inflicted it, not the target receiving it.
      for (let i = 0; i < procCount; i++)
      {
        battler.addState(stateId, inflictor);
      }
    }
    finally
    {
      // always decrement the depth counter when leaving the dispatch scope.
      AutoInflictStateManager.#inflictDepth -= 1;
    }

    // the payload was rolled for, which is what the rule spends its cooldown on, whether or not it landed.
    return true;
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
   * It starts over whenever the payload was rolled for, whether or not it landed: the rule spends
   * its cooldown on the attempt, so a target's resistances thin out the payloads that land rather
   * than earning the rule a fresh roll on the very next event. A payload the target cannot take at
   * all is never rolled for, and leaves the cooldown where it was.
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

      // read the frame this rule last rolled for its payload, tracked on the inflicting battler.
      const lastFrame = applier.getAutoRuleLastFrame(ruleKey);

      // the cooldown window has not yet elapsed- skip dispatch for this rule.
      if (lastFrame > 0 && (now - lastFrame) < cooldownFrames) continue;

      // roll the payload against the target, with applier rolling and credited as the source.
      const rolled = this.dispatch(target, id, applier);

      // stamp the cooldown, on the rule bearer, whenever the payload was rolled for- landed or not.
      if (rolled === true)
      {
        applier.setAutoRuleLastFrame(ruleKey, now);
      }
    }
  }
}

export default AutoInflictStateManager;
//endregion AutoInflictStateManager