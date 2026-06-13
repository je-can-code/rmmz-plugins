//region AutoApplyStateOnNearbyManager
import AutoRuleManager from './AutoRuleManager.js';
import PassiveRuleJabsAccess from '../helpers/PassiveRuleJabsAccess.js';

/**
 * Schedules real JABS state applications onto nearby battlers from
 * {@link RPG_BaseItem#autoApplyStateOnNearbyRules} tuples.
 *
 * Unlike {@link AutoApplyStateManager}, which always applies the state to the rule bearer,
 * this manager redirects dispatch to the battlers in proximity — enemies or allies depending
 * on the condition kind. This enables aura-style effects where the bearer passively afflicts
 * surrounding targets on a pulse timer.
 *
 * Only {@code enemiesNearby} and {@code alliesNearby} conditions are meaningful here; other
 * condition kinds have no proximity target set to iterate and will not fire.
 */
class AutoApplyStateOnNearbyManager extends AutoRuleManager
{
  /**
   * The name of the source property that holds auto-apply-state-on-nearby rule tuples.
   * @returns {string} - The property name holding rule tuples on source objects.
   */
  static get rulesProperty() { return 'autoApplyStateOnNearbyRules'; }

  /**
   * Pushes a real combat state onto the target battler through the JABS addState path.
   *
   * The battler parameter here is the nearby target, not the rule bearer — the bearer's
   * cooldown is managed separately in {@link _tryDispatchProximityRule}.
   * @param {Game_Actor|Game_Enemy} battler - The nearby battler receiving the state.
   * @param {number} stateId - The database id of the state to apply.
   * @returns {boolean} - True when addState was called and the state was addable.
   */
  static dispatch(battler, stateId)
  {
    // passive-tracked states cannot be layered on as combat states.
    if (battler.isStateAddable(stateId) === false) return false;

    // apply the state with the target as the nominal source for JABS state tracking.
    battler.addState(stateId, battler);

    return true;
  }

  /**
   * Overrides the base proximity handler to redirect state application onto nearby battlers.
   *
   * The cooldown is tracked on the rule bearer so the pulse cadence is consistent regardless
   * of how many targets are in range. The state is applied to every nearby battler in the
   * resolved set each time the cooldown elapses.
   * @param {Game_Actor|Game_Enemy} battler - The battler whose proximity is evaluated.
   * @param {RPG_BaseItem} source - The database row that declared the rule.
   * @param {number} tupleIndex - Zero-based index of this tuple on the source row.
   * @param {number} id - The state id to apply to nearby battlers.
   * @param {string} kind - The proximity condition kind (enemiesNearby or alliesNearby).
   * @param {any[]} tuple - The full parsed tuple array from the authored tag.
   */
  static _tryDispatchProximityRule(battler, source, tupleIndex, id, kind, tuple)
  {
    // parse the minimum nearby battler count required to trigger this rule.
    const minCount = Number(tuple[2]);

    // parse the cooldown in frames between pulses, tracked on the bearer.
    const cooldownFrames = Number(tuple[3]);

    // read the optional explicit trigger radius from the fifth tuple position.
    const triggerTilesRaw = tuple.length >= 5 ? Number(tuple[4]) : null;

    // use the explicit radius when valid, otherwise fall back to the plugin default.
    const triggerTiles = triggerTilesRaw !== null && !Number.isNaN(triggerTilesRaw)
      ? triggerTilesRaw
      : null;

    // skip tuples that declare an invalid or zero minimum count.
    if (Number.isNaN(minCount) || minCount < 1) return;

    // skip tuples with invalid cooldown values.
    if (Number.isNaN(cooldownFrames) || cooldownFrames < 0) return;

    // collect the nearby battlers that will receive the state.
    const nearbyJabsBattlers = kind === 'enemiesNearby'
      ? PassiveRuleJabsAccess.nearbyEnemies(battler, triggerTiles)
      : PassiveRuleJabsAccess.nearbyAlliesExcludingSelf(battler);

    // the proximity gate fails — not enough battlers are in range yet.
    if (nearbyJabsBattlers.length < minCount) return;

    // build the cooldown key against the bearer so pulse rate is bearer-scoped.
    const ruleKey = this.buildRuleKey(source, tupleIndex, id, kind);

    // capture the current frame count as the reference point for cooldown evaluation.
    const now = Graphics.frameCount;

    // read the frame this rule last successfully pulsed on this bearer.
    const lastFrame = battler.getAutoRuleLastFrame(ruleKey);

    // the cooldown window has not yet elapsed — skip this pulse.
    if (lastFrame > 0 && (now - lastFrame) < cooldownFrames) return;

    // apply the state to every nearby target that is currently in range.
    let anyDispatched = false;
    nearbyJabsBattlers.forEach(jabsTarget =>
    {
      // unwrap the JABS battler to the underlying Game_Battler for addState.
      const target = jabsTarget.getBattler();

      // skip targets whose underlying battler cannot be resolved.
      if (!target) return;

      // dispatch the state onto this target and track whether any landed.
      if (this.dispatch(target, id) === true) anyDispatched = true;
    });

    // stamp the bearer's cooldown only when at least one dispatch succeeded.
    if (anyDispatched === true)
    {
      battler.setAutoRuleLastFrame(ruleKey, now);
    }
  }
}

export default AutoApplyStateOnNearbyManager;
//endregion AutoApplyStateOnNearbyManager
