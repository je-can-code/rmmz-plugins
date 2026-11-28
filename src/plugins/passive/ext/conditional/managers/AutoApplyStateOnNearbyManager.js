//region AutoApplyStateOnNearbyManager
import AutoRuleManager from './AutoRuleManager.js';

/**
 * Schedules real JABS state applications onto nearby battlers from
 * {@link RPG_BaseItem#autoApplyStateOnNearbyRules} tuples.
 *
 * Unlike {@link AutoApplyStateManager}, which always applies the state to the rule bearer,
 * this manager redirects dispatch to the battlers in proximity — enemies or allies depending
 * on the condition kind. This enables aura-style effects where the bearer passively afflicts
 * surrounding targets on a pulse timer.
 *
 * Every pulse rolls for the state on each target at the aura's full strength, through the same roll
 * as any other state applied by chance, {@link JABS_Fate.resolveStateProcCount}. The bearer is the
 * roller: each target's resistances and the luck between the two decide how likely it is to land,
 * the state's own {@code <type:negative>} classifier decides whether a target's curse helps it land
 * or stands in its way, and the bearer's Accumulate Mode and Encore can land it more than once in a
 * single pulse.
 *
 * Only proximity condition kinds ({@code enemiesNearby}/{@code alliesNearby} and their
 * {@code Below} counterparts) are meaningful here; other condition kinds have no proximity
 * target set to iterate and will not fire. Note that a {@code *Below} tuple with a threshold
 * of 1 (the "nothing nearby" case) can gate-pass while resolving zero targets — that pulse
 * simply rolls for nobody. Thresholds of 2+ aim at whichever stragglers remain under the count
 * (e.g. "not swarmed by 5+ enemies, but hit whichever 1-2 are still around").
 */
class AutoApplyStateOnNearbyManager extends AutoRuleManager
{
  /**
   * The name of the source property that holds auto-apply-state-on-nearby rule tuples.
   * @returns {string} - The property name holding rule tuples on source objects.
   */
  static get rulesProperty() { return 'autoApplyStateOnNearbyRules'; }

  /**
   * Rolls the aura's state against one nearby target, and pushes it onto that target through the
   * JABS addState path once for every time it lands.
   *
   * The bearer rolls at the aura's full strength through {@link JABS_Fate.resolveStateProcCount}:
   * the target's State Rate and {@code <stateTypeResist>}, and the luck between the two battlers,
   * shape the chance; the state's own {@code <type:negative>} classifier decides whether the
   * target's curse is one more chance for it to land or one more hurdle for it to clear; and the
   * bearer's Accumulate Mode and Encore decide how many times it lands. A state the target cannot
   * take at all is never rolled for, and every landing checks the target's immunities on its own.
   *
   * The battler parameter here is the nearby target, not the rule bearer — the bearer's
   * cooldown is managed separately in {@link _tryDispatchProximityRule}.
   * @param {Game_Actor|Game_Enemy} battler - The nearby battler receiving the state.
   * @param {number} stateId - The database id of the state to apply.
   * @param {Game_Actor|Game_Enemy} bearer - The battler whose aura this is, who rolls for the state to land.
   * @returns {boolean} - True when the state was rolled for against this target, whether or not it landed.
   */
  static dispatch(battler, stateId, bearer)
  {
    // a state the target cannot take at all- a passive it holds, or one it is immune to- is never rolled for.
    if (battler.isStateAddable(stateId) === false) return false;

    // the bearer rolls the aura's state at its full strength against this target's resistances.
    const procCount = JABS_Fate.resolveStateProcCount(bearer, battler, stateId, 100);

    // apply the state once per landing, with the target as the nominal source for JABS state tracking.
    for (let i = 0; i < procCount; i++)
    {
      battler.addState(stateId, battler);
    }

    // the state was rolled for, which is what a pulse spends its cooldown on, whether or not it landed.
    return true;
  }

  /**
   * Overrides the base proximity handler to redirect state application onto nearby battlers.
   *
   * The cooldown is tracked on the rule bearer so the pulse cadence is consistent regardless
   * of how many targets are in range. Each time the cooldown elapses, the state is rolled for on
   * every nearby battler in the resolved set, and the cooldown starts over as soon as any of them
   * was rolled for, whether or not it landed: a pulse spends its cooldown on the attempt, so a
   * target's resistances thin out the pulses that land rather than earning the aura a fresh roll
   * on the very next frame. A pulse whose targets cannot take the state at all rolls for nobody,
   * and leaves the cooldown where it was.
   * @param {Game_Actor|Game_Enemy} battler - The battler whose proximity is evaluated.
   * @param {RPG_BaseItem} source - The database row that declared the rule.
   * @param {number} tupleIndex - Zero-based index of this tuple on the source row.
   * @param {number} id - The state id to apply to nearby battlers.
   * @param {string} kind - The proximity condition kind; see {@link AutoRuleManager.isProximityKind}.
   * @param {any[]} tuple - The full parsed tuple array from the authored tag.
   */
  static _tryDispatchProximityRule(battler, source, tupleIndex, id, kind, tuple)
  {
    // parse the count threshold that gates this rule.
    const minCount = Number(tuple[2]);

    // parse the cooldown in frames between pulses, tracked on the bearer.
    const cooldownFrames = Number(tuple[3]);

    // read the optional explicit trigger radius from the fifth tuple position.
    const triggerTilesRaw = tuple.length >= 5 ? Number(tuple[4]) : null;

    // use the explicit radius when valid, otherwise fall back to the plugin default.
    const triggerTiles = triggerTilesRaw !== null && !Number.isNaN(triggerTilesRaw)
      ? triggerTilesRaw
      : null;

    // skip tuples that declare an invalid or zero count threshold.
    if (Number.isNaN(minCount) || minCount < 1) return;

    // skip tuples with invalid cooldown values.
    if (Number.isNaN(cooldownFrames) || cooldownFrames < 0) return;

    // collect the nearby battlers the state is rolled for — this is also the set the gate counts.
    const nearbyJabsBattlers = this.nearbyBattlersForKind(battler, kind, triggerTiles);

    // the proximity gate fails when this kind's comparison direction is not satisfied.
    if (this.proximityGatePasses(nearbyJabsBattlers.length, minCount, kind) === false) return;

    // build the cooldown key against the bearer so pulse rate is bearer-scoped.
    const ruleKey = this.buildRuleKey(source, tupleIndex, id, kind);

    // capture the current frame count as the reference point for cooldown evaluation.
    const now = Graphics.frameCount;

    // read the frame this rule last pulsed on this bearer.
    const lastFrame = battler.getAutoRuleLastFrame(ruleKey);

    // the cooldown window has not yet elapsed — skip this pulse.
    if (lastFrame > 0 && (now - lastFrame) < cooldownFrames) return;

    // roll the state for every nearby target that is currently in range.
    let anyRolled = false;
    nearbyJabsBattlers.forEach(jabsTarget =>
    {
      // unwrap the JABS battler to the underlying Game_Battler for addState.
      const target = jabsTarget.getBattler();

      // skip targets whose underlying battler cannot be resolved.
      if (!target) return;

      // roll the state for this target with the bearer rolling, and note whether it could be rolled for at all.
      if (this.dispatch(target, id, battler) === true) anyRolled = true;
    });

    // stamp the bearer's cooldown once any target was rolled for, whether or not the state landed.
    if (anyRolled === true)
    {
      battler.setAutoRuleLastFrame(ruleKey, now);
    }
  }
}

export default AutoApplyStateOnNearbyManager;
//endregion AutoApplyStateOnNearbyManager