//region AutoRuleManager
import PassiveRuleJabsAccess from '../helpers/PassiveRuleJabsAccess.js';

/**
 * Base class for managers that schedule automatic effects from passive-capable source tuples.
 *
 * Owns every condition branch — time, proximity, damage, state, movement, heal — and delegates
 * only the terminal dispatch (apply a state vs execute a skill) to the subclass.
 *
 * Subclasses must implement:
 *  - {@link rulesProperty}  — name of the source property holding authored tuples
 *  - {@link dispatch}       — terminal action (addState / forceMapAction)
 */
class AutoRuleManager
{
  // ---------------------------------------------------------------------------
  // Abstract interface — subclasses override these
  // ---------------------------------------------------------------------------

  /**
   * The name of the property on each source object that holds the authored rule tuples.
   *
   * Examples: {@code 'autoApplyStateRules'} or {@code 'autoExecuteSkillRules'}.
   * @returns {string} - The property name holding rule tuples on source objects.
   */
  static get rulesProperty()
  {
    // subclasses must declare which source property they read tuples from.
    throw new Error(`${this.name} must implement static get rulesProperty()`);
  }

  /**
   * Whether `tuple[0]` must be a strictly-positive integer to be considered valid.
   *
   * True for every subclass whose `tuple[0]` is a database id (state/skill ids are never 0 or
   * negative). Override to false for a subclass whose `tuple[0]` is a signed value instead (e.g. a
   * modification amount where negative/positive is meaningful direction, not an invalid id).
   * @returns {boolean}
   */
  static get requiresPositiveId()
  {
    return true;
  }

  /**
   * The terminal action for one resolved rule.
   *
   * Called after all condition and cooldown gates pass. Subclasses implement
   * the actual effect — applying a state, firing a skill, etc.
   * @param {Game_Battler} _battler - The battler that owns the rule.
   * @param {number} _id - State id or skill id, depending on the subclass.
   * @param {any[]} _tuple - The full authored tuple this dispatch came from, for subclasses whose
   * payload needs more than just `id` (e.g. a modification amount plus a range/target selector
   * living further down the tuple than the shared loop itself ever inspects).
   * @returns {boolean} - True when the effect was successfully dispatched.
   */
  static dispatch(_battler, _id, _tuple)
  {
    // subclasses must implement the actual dispatch logic for their effect type.
    throw new Error(`${this.name} must implement static dispatch()`);
  }

  // ---------------------------------------------------------------------------
  // Condition pumps — called from JABS_Battler update hooks
  // ---------------------------------------------------------------------------

  /**
   * Evaluates every {@code time} rule on this battler while active on the ABS map.
   * @param {Game_Actor|Game_Enemy} battler - The battler whose rules may fire.
   */
  static processTimeRules(battler)
  {
    // no ABS context means there is nothing to schedule.
    if (!$jabsEngine || $jabsEngine.absEnabled === false) return;

    // delegate to the main dispatch loop with the time condition kind.
    this.tryDispatch(battler, 'time');
  }

  /**
   * Evaluates every {@code stand} rule while this battler is idle on the ABS map.
   * @param {Game_Actor|Game_Enemy} battler - The battler whose rules may fire.
   */
  static processStandRules(battler)
  {
    // no ABS context means there is nothing to schedule.
    if (!$jabsEngine || $jabsEngine.absEnabled === false) return;

    // read the last frame this battler moved to determine whether they are currently standing still.
    const lastMovedFrame = battler.getPassiveRuleLastMovedFrame();

    // calculate how many frames have elapsed since the battler last moved.
    const framesSinceMoved = Graphics.frameCount - lastMovedFrame;

    // movement happened this frame — standing rules do not apply.
    if (framesSinceMoved === 0) return;

    // delegate to the main dispatch loop with the stand condition kind.
    this.tryDispatch(battler, 'stand');
  }

  /**
   * Evaluates every {@code enemiesNearby} and {@code enemiesNearbyBelow} rule on this battler
   * while on the ABS map.
   * @param {Game_Actor|Game_Enemy} battler - The battler whose rules may fire.
   */
  static processEnemiesNearbyRules(battler)
  {
    // no ABS context means there is nothing to schedule.
    if (!$jabsEngine || $jabsEngine.absEnabled === false) return;

    // delegate to the main dispatch loop with the enemiesNearby condition kind.
    this.tryDispatch(battler, 'enemiesNearby');

    // delegate to the main dispatch loop with the inverse enemiesNearbyBelow condition kind.
    this.tryDispatch(battler, 'enemiesNearbyBelow');
  }

  /**
   * Evaluates every {@code alliesNearby} and {@code alliesNearbyBelow} rule on this battler
   * while on the ABS map.
   * @param {Game_Actor|Game_Enemy} battler - The battler whose rules may fire.
   */
  static processAlliesNearbyRules(battler)
  {
    // no ABS context means there is nothing to schedule.
    if (!$jabsEngine || $jabsEngine.absEnabled === false) return;

    // delegate to the main dispatch loop with the alliesNearby condition kind.
    this.tryDispatch(battler, 'alliesNearby');

    // delegate to the main dispatch loop with the inverse alliesNearbyBelow condition kind.
    this.tryDispatch(battler, 'alliesNearbyBelow');
  }

  /**
   * Fires resource-specific and {@code anyDmg} rules after damage is applied to one pool.
   * @param {Game_Actor|Game_Enemy} battler - The battler that took damage.
   * @param {'hpDmg'|'mpDmg'|'tpDmg'} resourceKind - Which resource pool decreased.
   */
  static scheduleDamageTriggers(battler, resourceKind)
  {
    // fire rules that are specifically interested in the damaged resource pool.
    this.tryDispatch(battler, resourceKind);

    // also fire rules that respond to any damage regardless of which pool was affected.
    this.tryDispatch(battler, 'anyDmg');
  }

  /**
   * Fires {@code whenCrit} rules after this battler is struck by a critical hit.
   * @param {Game_Actor|Game_Enemy} battler - The battler that was critically hit.
   */
  static scheduleCritTriggers(battler)
  {
    // delegate to the main dispatch loop with the whenCrit condition kind.
    this.tryDispatch(battler, 'whenCrit');
  }

  /**
   * Fires {@code whenGlanced} rules after this battler suffers a glancing blow as the victim.
   *
   * Mutually exclusive with {@link scheduleCritTriggers} at the source- a glancing blow can never
   * also be a critical hit, so a single incoming attack can only ever fire one of the two.
   * @param {Game_Actor|Game_Enemy} battler - The battler that was glanced.
   */
  static scheduleGlancingTriggers(battler)
  {
    // delegate to the main dispatch loop with the whenGlanced condition kind.
    this.tryDispatch(battler, 'whenGlanced');
  }

  /**
   * Fires state-polarity and {@code anyStateAdded} rules after a combat state lands on this battler.
   * @param {Game_Actor|Game_Enemy} battler - The battler that received the state.
   * @param {number} stateId - The database id of the state that was added.
   */
  static scheduleStateAddedTriggers(battler, stateId)
  {
    // fire rules that respond to any state being added regardless of polarity.
    this.tryDispatch(battler, 'anyStateAdded');

    // look up the state data to determine its polarity classification.
    const state = $dataStates[stateId];

    // if the state data is missing, polarity-specific rules cannot be evaluated.
    if (!state) return;

    // negative polarity comes from the state's own <type:negative> classifier.
    if (state.isNegativeType())
    {
      // fire rules that are specifically interested in negative states being added.
      this.tryDispatch(battler, 'negaStateAdded');
    }
    else
    {
      // fire rules that are specifically interested in positive states being added.
      this.tryDispatch(battler, 'posiStateAdded');
    }
  }

  /**
   * Fires state-polarity and {@code anyStateInflicted} rules on the battler that just inflicted a
   * combat state onto someone else- single-party variant for subclasses whose effect lands back on
   * the rule bearer itself (e.g. modifying the inflictor's own cooldowns), not on the afflicted
   * target. {@link AutoInflictStateManager} handles the dual-party case (rule bearer, external
   * effect target) separately and does not go through this method.
   * @param {Game_Actor|Game_Enemy} battler - The battler that just inflicted the state.
   * @param {number} inflictedStateId - The database id of the state that was just inflicted.
   */
  static scheduleSelfStateInflictedTriggers(battler, inflictedStateId)
  {
    // no ABS context means there is nothing to schedule.
    if (!$jabsEngine || $jabsEngine.absEnabled === false) return;

    // no battler means there is nobody whose rules could fire.
    if (!battler) return;

    // look up the just-inflicted state's database row to determine its polarity.
    const inflictedState = $dataStates[inflictedStateId];

    // if the state data is missing, polarity-specific rules cannot be evaluated.
    if (!inflictedState) return;

    // fire rules that respond to any state being inflicted regardless of polarity.
    this.tryDispatch(battler, 'anyStateInflicted');

    // negative polarity comes from the state's own <type:negative> classifier.
    if (inflictedState.isNegativeType())
    {
      // fire rules that are specifically interested in negative states being inflicted.
      this.tryDispatch(battler, 'negaStateInflicted');
    }
    else
    {
      // fire rules that are specifically interested in positive states being inflicted.
      this.tryDispatch(battler, 'posiStateInflicted');
    }
  }

  /**
   * Fires heal-receive rules after one resource pool is restored on this battler.
   * @param {Game_Actor|Game_Enemy} battler - The battler that was healed.
   * @param {'onHealHp'|'onHealMp'|'onHealTp'} healKind - Which resource pool was restored.
   */
  static scheduleHealTriggers(battler, healKind)
  {
    // delegate to the main dispatch loop with the specific heal condition kind.
    this.tryDispatch(battler, healKind);
  }

  /**
   * Fires {@code onKill} rules on the battler that just landed a kill.
   * @param {Game_Actor|Game_Enemy} battler - The battler that defeated an enemy.
   */
  static scheduleKillTriggers(battler)
  {
    // no ABS context means there is nothing to schedule.
    if (!$jabsEngine || $jabsEngine.absEnabled === false) return;

    // no battler means there is nobody whose rules could fire.
    if (!battler) return;

    // delegate to the main dispatch loop with the onKill condition kind.
    this.tryDispatch(battler, 'onKill');
  }

  /**
   * Fires {@code onDamageDealt} rules on the battler that just landed damage on an opponent.
   * @param {Game_Actor|Game_Enemy} battler - The battler that dealt the damage.
   */
  static scheduleDamageDealtTriggers(battler)
  {
    // no ABS context means there is nothing to schedule.
    if (!$jabsEngine || $jabsEngine.absEnabled === false) return;

    // no battler means there is nobody whose rules could fire.
    if (!battler) return;

    // delegate to the main dispatch loop with the onDamageDealt condition kind.
    this.tryDispatch(battler, 'onDamageDealt');
  }

  /**
   * Fires {@code onWeaponHit} rules on the battler that just landed a mainhand/offhand attack.
   *
   * Narrower than {@code onDamageDealt} — only counts hits from the caster's own basic-attack or
   * combo chain (whatever is bound to the Mainhand/Offhand slot), not damage from arbitrary skills.
   * @param {Game_Actor|Game_Enemy} battler - The battler that landed the weapon hit.
   */
  static scheduleWeaponHitTriggers(battler)
  {
    // no ABS context means there is nothing to schedule.
    if (!$jabsEngine || $jabsEngine.absEnabled === false) return;

    // no battler means there is nobody whose rules could fire.
    if (!battler) return;

    // delegate to the main dispatch loop with the onWeaponHit condition kind.
    this.tryDispatch(battler, 'onWeaponHit');
  }

  /**
   * Credits one whole tile of travel toward {@code move} rules on this battler.
   *
   * Called from {@link Game_CharacterBase#updatePixelStepping} after a Pixelistics tile step completes.
   * @param {Game_Actor|Game_Enemy} battler - The battler that completed a whole map tile step.
   */
  static creditTileStep(battler)
  {
    // no ABS context means there is nothing to schedule.
    if (!$jabsEngine || $jabsEngine.absEnabled === false) return;

    // collect every authored rule tuple from this battler's passive-capable sources.
    const rules = this.collectRules(battler);

    // iterate over each rule entry and accumulate tile credit for move-condition rules.
    for (const entry of rules)
    {
      // destructure the relevant fields from the rule entry.
      const { source, tuple, tupleIndex } = entry;

      // parse the target id, condition kind, and tiles-per-dispatch from the tuple.
      const id = Number(tuple[0]);
      const kind = String(tuple[1]);
      const tilesPerDispatch = Number(tuple[2]);

      // skip malformed tuples with invalid ids.
      if (Number.isNaN(id) || (this.requiresPositiveId && id <= 0)) continue;

      // only move-condition rules accumulate tile credit through this path.
      if (kind !== 'move') continue;

      // skip tuples that declare an invalid or zero tiles-per-dispatch threshold.
      if (Number.isNaN(tilesPerDispatch) || tilesPerDispatch <= 0) continue;

      // build the stable rule key for tracking credit on this battler.
      const ruleKey = this.buildRuleKey(source, tupleIndex, id, kind);

      // read the current accumulated tile credit for this rule.
      const priorCredit = battler.getAutoRuleTileCredit(ruleKey);

      // increment the credit by one whole tile.
      const nextCredit = priorCredit + 1;

      // not enough whole tiles yet — store the updated credit and wait for the next step.
      if (nextCredit < tilesPerDispatch)
      {
        battler.setAutoRuleTileCredit(ruleKey, nextCredit);
        continue;
      }

      // the threshold was reached — dispatch the effect for this rule.
      this.dispatch(battler, id, tuple);

      // reset the tile counter regardless of whether dispatch succeeded, to avoid stuck credit.
      battler.setAutoRuleTileCredit(ruleKey, 0);
    }
  }

  /**
   * Forwards one Pixelistics tile step from a map character to its underlying battler.
   * @param {Game_Character} character - The character that just completed a whole-tile step.
   */
  static processTileStepFromCharacter(character)
  {
    // resolve the JABS battler wrapper from the map character.
    const jabsBattler = character.getJabsBattler();

    // if no JABS battler exists, there is no battler to credit the tile step to.
    if (!jabsBattler) return;

    // unwrap to the underlying Game_Battler for rule processing.
    const battler = jabsBattler.getBattler();

    // if no underlying battler exists, there is nothing to credit.
    if (!battler) return;

    // forward the tile step credit to the battler.
    this.creditTileStep(battler);
  }

  // ---------------------------------------------------------------------------
  // Core dispatch loop
  // ---------------------------------------------------------------------------

  /**
   * Walks every authored tuple on this battler and dispatches when the condition kind matches.
   * @param {Game_Actor|Game_Enemy} battler - The battler whose rules are evaluated.
   * @param {string} conditionKind - The condition kind to match against authored tuples.
   */
  static tryDispatch(battler, conditionKind)
  {
    // no ABS context means there is nothing to dispatch.
    if (!$jabsEngine || $jabsEngine.absEnabled === false) return;

    // collect every authored rule tuple from this battler's passive-capable sources.
    const rules = this.collectRules(battler);

    // iterate over each rule entry and attempt a dispatch when the condition kind matches.
    for (const entry of rules)
    {
      // destructure the relevant fields from the rule entry.
      const { source, tuple, tupleIndex } = entry;

      // parse the target id and condition kind from the tuple.
      const id = Number(tuple[0]);
      const kind = String(tuple[1]);

      // skip malformed tuples with invalid ids.
      if (Number.isNaN(id) || (this.requiresPositiveId && id <= 0)) continue;

      // skip tuples that do not match the requested condition kind.
      if (kind !== conditionKind) continue;

      // move-condition rules apply only through tile credit, not through the frame-cooldown path.
      if (kind === 'move') continue;

      // proximity rules use a wider 4/5-tuple shape and require special handling.
      if (this.isProximityKind(kind))
      {
        // delegate proximity parsing and gate evaluation to the dedicated helper.
        this._tryDispatchProximityRule(battler, source, tupleIndex, id, kind, tuple);
        continue;
      }

      // parse the standard third-position parameter (frames, tiles, etc.) from the tuple.
      const param = Number(tuple[2]);

      // skip tuples with invalid or negative parameter values.
      if (Number.isNaN(param) || param < 0) continue;

      // attempt to dispatch the rule through the frame-cooldown gate.
      this._tryDispatchRule(battler, source, tupleIndex, id, kind, param, tuple);
    }
  }

  // ---------------------------------------------------------------------------
  // Shared infrastructure
  // ---------------------------------------------------------------------------

  /**
   * Gathers rule tuples from every passive-capable source on this battler.
   * @param {Game_Actor|Game_Enemy} battler - The battler whose sources should be scanned.
   * @returns {{ source: RPG_BaseItem, tuple: any[], tupleIndex: number }[]} - Rules with their originating source row.
   */
  static collectRules(battler)
  {
    // start with an empty collection to accumulate all rule entries into.
    const collected = [];

    // retrieve all passive-capable sources for this battler.
    const sources = battler.getPassiveStateSources();

    // iterate over each source and collect its authored rule tuples.
    for (const source of sources)
    {
      // read the rule tuples from the source using the subclass-defined property name.
      const tuples = source[this.rulesProperty] || [];

      // iterate over each tuple and record it alongside its source and index.
      for (let tupleIndex = 0; tupleIndex < tuples.length; tupleIndex++)
      {
        // push the entry with its originating source row for rule key construction later.
        collected.push({ source, tuple: tuples[tupleIndex], tupleIndex });
      }
    }

    return collected;
  }

  /**
   * Builds a stable cooldown key for one authored rule on one source row.
   *
   * The tuple index is included so duplicate id/condition pairs on the same row stay independent.
   * @param {RPG_BaseItem} source - The database row carrying the tag.
   * @param {number} tupleIndex - Zero-based index of this tuple on the source row.
   * @param {number} id - State id or skill id for this rule.
   * @param {string} condition - The condition kind string.
   * @returns {string} - A unique key used for last-dispatch frame tracking on the battler.
   */
  static buildRuleKey(source, tupleIndex, id, condition)
  {
    // use the constructor name as a stable label for the source type.
    const sourceLabel = source.constructor.name || 'Unknown';

    // read the database id of the source row.
    const sourceId = source.id;

    // combine all four dimensions into a single colon-separated key string.
    return `${sourceLabel}:${sourceId}:${tupleIndex}:${id}:${condition}`;
  }

  /**
   * Handles the 4/5-tuple proximity branch for {@code enemiesNearby}/{@code alliesNearby} and
   * their {@code *Below} counterparts.
   * @param {Game_Actor|Game_Enemy} battler - The battler whose proximity is evaluated.
   * @param {RPG_BaseItem} source - The database row that declared the rule.
   * @param {number} tupleIndex - Zero-based index of this tuple on the source row.
   * @param {number} id - State id or skill id for this rule.
   * @param {string} kind - The proximity condition kind; see {@link isProximityKind}.
   * @param {any[]} tuple - The full parsed tuple array from the authored tag.
   */
  static _tryDispatchProximityRule(battler, source, tupleIndex, id, kind, tuple)
  {
    // parse the count threshold that gates this rule.
    const minCount = Number(tuple[2]);

    // parse the cooldown in frames between dispatches for this rule.
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

    // count opposing or allied battlers in range depending on the condition kind.
    const nearbyCount = this.nearbyBattlersForKind(battler, kind, triggerTiles).length;

    // the proximity gate fails when this kind's comparison direction is not satisfied.
    if (this.proximityGatePasses(nearbyCount, minCount, kind) === false) return;

    // the gate passed — attempt to dispatch through the frame-cooldown gate.
    this._tryDispatchRule(battler, source, tupleIndex, id, kind, cooldownFrames, tuple);
  }

  /**
   * Whether a condition kind string is one of the proximity-gated kinds handled by
   * {@link _tryDispatchProximityRule} instead of the standard frame-cooldown path.
   * @param {string} kind - The condition kind to test.
   * @returns {boolean} - True for enemiesNearby, alliesNearby, and their Below counterparts.
   */
  static isProximityKind(kind)
  {
    return kind === 'enemiesNearby' || kind === 'alliesNearby'
      || kind === 'enemiesNearbyBelow' || kind === 'alliesNearbyBelow';
  }

  /**
   * Resolves the JABS battler set a proximity kind counts/targets — opposing battlers for the
   * enemy kinds, allied battlers (excluding self) for the ally kinds. The {@code Below} suffix
   * only affects the gate comparison direction, not which set is measured.
   * @param {Game_Actor|Game_Enemy} battler - The evaluating battler.
   * @param {string} kind - The proximity condition kind; see {@link isProximityKind}.
   * @param {number|null} triggerTiles - Optional explicit tile radius override.
   * @returns {JABS_Battler[]} - The resolved battler set for this kind.
   */
  static nearbyBattlersForKind(battler, kind, triggerTiles)
  {
    return (kind === 'enemiesNearby' || kind === 'enemiesNearbyBelow')
      ? PassiveRuleJabsAccess.nearbyEnemies(battler, triggerTiles)
      : PassiveRuleJabsAccess.nearbyAlliesExcludingSelf(battler);
  }

  /**
   * Compares a resolved nearby-battler count against the tuple's threshold, honoring the
   * {@code Below} suffix as an inversion of the default at-least-COUNT comparison.
   * @param {number} nearbyCount - Battlers currently resolved in range.
   * @param {number} minCount - The count threshold authored on the tuple.
   * @param {string} kind - The proximity condition kind; see {@link isProximityKind}.
   * @returns {boolean} - True when the gate for this kind passes.
   */
  static proximityGatePasses(nearbyCount, minCount, kind)
  {
    // *Below kinds pass while strictly under the threshold — the "nobody/nothing nearby" gates.
    if (kind === 'enemiesNearbyBelow' || kind === 'alliesNearbyBelow') return nearbyCount < minCount;

    // default kinds pass at or above the threshold.
    return nearbyCount >= minCount;
  }

  /**
   * Dispatches one rule when its per-key frame cooldown has elapsed.
   * @param {Game_Actor|Game_Enemy} battler - The battler that owns the rule.
   * @param {RPG_BaseItem} source - The database row that declared the rule.
   * @param {number} tupleIndex - Zero-based index of this tuple on the source row.
   * @param {number} id - State id or skill id for this rule.
   * @param {string} condition - The condition kind string.
   * @param {number} cooldownFrames - Minimum frames that must elapse between dispatches for this key.
   * @param {any[]} tuple - The full authored tuple, forwarded to the subclass dispatch for rules
   * whose payload needs more than just `id`.
   */
  static _tryDispatchRule(battler, source, tupleIndex, id, condition, cooldownFrames, tuple)
  {
    // build the stable key used to track the last-dispatch frame for this rule on this battler.
    const ruleKey = this.buildRuleKey(source, tupleIndex, id, condition);

    // capture the current frame count as the reference point for cooldown evaluation.
    const now = Graphics.frameCount;

    // read the frame this rule last successfully dispatched on this battler.
    const lastFrame = battler.getAutoRuleLastFrame(ruleKey);

    // calculate how many frames have elapsed since the rule last fired.
    const elapsed = now - lastFrame;

    // the cooldown window has not yet elapsed — skip dispatch for this frame.
    if (lastFrame > 0 && elapsed < cooldownFrames) return;

    // attempt the terminal dispatch through the subclass implementation.
    const dispatched = this.dispatch(battler, id, tuple);

    // only stamp the cooldown when the dispatch actually succeeded.
    if (dispatched === true)
    {
      battler.setAutoRuleLastFrame(ruleKey, now);
    }
  }
}

export default AutoRuleManager;
//endregion AutoRuleManager
