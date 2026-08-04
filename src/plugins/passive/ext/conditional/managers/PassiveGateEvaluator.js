//region PassiveGateEvaluator
import PassiveRuleJabsAccess from '../helpers/PassiveRuleJabsAccess.js';
import PassiveRuleThreshold from '../helpers/PassiveRuleThreshold.js';

/**
 * Evaluates {@link passiveSourceRule}/{@link passiveStateRule} tuples against live battler context.<br/>
 * Every tuple on a source/state pair must pass (AND semantics); cross-source stacking is handled upstream in J-Passive.
 */
class PassiveGateEvaluator
{
  /**
   * Evaluates one gate rule kind against the battler's current map context.<br/>
   * Discrete kinds dispatch in the switch; threshold kinds fall through to {@link #evaluateThresholdKind}.
   * The params array mirrors the tag tuple slots after the kind: [threshold, scope?, range?] for
   * resource gates; a single scalar for most other gates.
   * @param {Game_Battler} battler The battler whose context we evaluate.
   * @param {string} kind Rule kind from a parsed note tuple.
   * @param {(number|string)[]=} params Remaining tuple slots after the kind.
   * @returns {boolean} Whether this single tuple passes right now.
   */
  // oxlint-disable-next-line complexity
  static evaluate(battler, kind, params = [])
  {
    // unpack the first param for gates that take a single scalar.
    const [param, scope, range] = params;

    switch (kind)
    {
      // proximity gates — optional radius as second param; defaults to plugin default-proximity-tiles.
      case 'alliesNearby':
        return PassiveRuleJabsAccess.nearbyAlliesExcludingSelf(battler, scope ? Number(scope) : null).length >= Number(param);
      case 'enemiesNearby':
        return PassiveRuleJabsAccess.nearbyEnemies(battler, scope ? Number(scope) : null).length >= Number(param);

      // inverse proximity gates — same slots, but pass while UNDER the count (e.g. "no enemies in melee range").
      case 'alliesNearbyBelow':
        return PassiveRuleJabsAccess.nearbyAlliesExcludingSelf(battler, scope ? Number(scope) : null).length < Number(param);
      case 'enemiesNearbyBelow':
        return PassiveRuleJabsAccess.nearbyEnemies(battler, scope ? Number(scope) : null).length < Number(param);

      // targeting gates — not proximity-scoped; counts opposing battlers with this battler as
      // their live AI target, regardless of tile distance.
      case 'enemiesTargetingMe':
        return PassiveRuleJabsAccess.enemiesTargetingMe(battler).length >= Number(param);
      case 'enemiesTargetingMeBelow':
        return PassiveRuleJabsAccess.enemiesTargetingMe(battler).length < Number(param);

      // resource threshold gates — [threshold, scope?, range?].
      // scope: self (default), anyAlly, allAllies, anyEnemy, allEnemies.
      // range: tile radius; defaults to plugin default-proximity-tiles when scope is not self.
      case 'hpAbove':
        return this.#evaluateResourceThreshold(battler, 'hp', 'above', Number(param), scope, range);
      case 'hpBelow':
        return this.#evaluateResourceThreshold(battler, 'hp', 'below', Number(param), scope, range);
      case 'mpAbove':
        return this.#evaluateResourceThreshold(battler, 'mp', 'above', Number(param), scope, range);
      case 'mpBelow':
        return this.#evaluateResourceThreshold(battler, 'mp', 'below', Number(param), scope, range);
      case 'tpAbove':
        return this.#evaluateResourceThreshold(battler, 'tp', 'above', Number(param), scope, range);
      case 'tpBelow':
        return this.#evaluateResourceThreshold(battler, 'tp', 'below', Number(param), scope, range);
      case 'anyAbove':
        return this.#evaluateAnyResourceThreshold(battler, 'above', Number(param), scope, range);
      case 'anyBelow':
        return this.#evaluateAnyResourceThreshold(battler, 'below', Number(param), scope, range);
      case 'allAbove':
        return this.#evaluateAllResourcesThreshold(battler, 'above', Number(param), scope, range);
      case 'allBelow':
        return this.#evaluateAllResourcesThreshold(battler, 'below', Number(param), scope, range);

      // discrete state and cooldown gates.
      case 'hasState':
        return battler.isStateAffected(Number(param));
      case 'negativeStateCount':
        return this.countNegativeStates(battler) >= Number(param);
      case 'slotOnCooldown':
        return this.#isSlotOnCooldown(battler, param) === true;
      case 'slotOffCooldown':
        return this.#isSlotOnCooldown(battler, param) === false;
      case 'allOnCooldown':
        return this.#areAllCombatSlotsOnCooldown(battler) === true;
      case 'allOffCooldown':
        return this.#areAllCombatSlotsReady(battler) === true;

      // timing gates — frames since last stamp must meet or exceed param.
      case 'sinceLastMoved':
        return this.#framesSince(battler.getPassiveRuleLastMovedFrame()) >= Number(param);
      case 'sinceLastHit':
        return this.#framesSince(battler.getPassiveRuleLastHitFrame()) >= Number(param);
      case 'sinceLastAttacked':
        return this.#framesSince(battler.getPassiveRuleLastAttackedFrame()) >= Number(param);

      // timing gates — frames since last stamp must be within param (inclusive).
      case 'movedWithin':
        return this.#framesSince(battler.getPassiveRuleLastMovedFrame()) <= Number(param);
      case 'hitWithin':
        return this.#framesSince(battler.getPassiveRuleLastHitFrame()) <= Number(param);
      case 'attackedWithin':
        return this.#framesSince(battler.getPassiveRuleLastAttackedFrame()) <= Number(param);

      // timing gates — heal received within param frames.
      case 'onHealHp':
        return this.#framesSince(battler.getPassiveRuleLastHpHealFrame()) <= Number(param);
      case 'onHealMp':
        return this.#framesSince(battler.getPassiveRuleLastMpHealFrame()) <= Number(param);
      case 'onHealTp':
        return this.#framesSince(battler.getPassiveRuleLastTpHealFrame()) <= Number(param);

      default:
        // hpAbove, criBelow, allAlliesHpAbove, etc. fall through to threshold parsing.
        return this.#evaluateThresholdKind(battler, kind, param);
    }
  }

  /**
   * Evaluates {@code *Above/*Below} and {@code allAllies*} threshold kinds.<br/>
   * Unknown kinds fail closed so tag typos do not silently grant passives.
   * @param {Game_Battler} battler The battler whose values we compare.
   * @param {string} kind Full threshold kind from the note tuple.
   * @param {number|string|null} param Tag threshold integer.
   * @returns {boolean} Whether the threshold gate passes.
   */
  static #evaluateThresholdKind(battler, kind, param)
  {
    const allAllies = PassiveRuleThreshold.parseAllAlliesThresholdKind(kind);

    if (allAllies)
    {
      // every allied battler (including self) must satisfy the same threshold.
      return PassiveRuleJabsAccess.allAlliedBattlersIncludingSelf(battler)
        .every(allyBattler =>
          PassiveRuleThreshold.compare(allyBattler, allAllies.key, allAllies.direction, Number(param)));
    }

    const threshold = PassiveRuleThreshold.parseThresholdKind(kind);

    // unknown kinds fail closed so typos do not silently grant passives.
    if (!threshold) return false;

    return PassiveRuleThreshold.compare(battler, threshold.key, threshold.direction, Number(param));
  }

  /**
   * Counts negative states currently affecting this battler.<br/>
   * Negative classification comes from {@link RPG_State#isNegativeType} / the {@code <type:negative>} tag.
   * @param {Game_Battler} battler The battler whose active states we inspect.
   * @returns {number} Count of states flagged negative by J-ABS.
   */
  static countNegativeStates(battler)
  {
    return battler.allStates()
      .filter(state => state && state.isNegativeType())
      .length;
  }

  /**
   * Whether one JABS skill slot is currently on cooldown for this battler.<br/>
   * Used by {@code slotOnCooldown} / {@code slotOffCooldown} gate kinds.
   * @param {Game_Battler} battler The battler whose slot we inspect.
   * @param {string|number} slotParam Author tag value (mainhand, skill1, raw button key, etc.).
   * @returns {boolean} True when the slot is cooling down; false when ready or off-map.
   */
  static #isSlotOnCooldown(battler, slotParam)
  {
    const jabsBattler = PassiveRuleJabsAccess.getJabsBattler(battler);

    // off-map battlers treat slots as never on cooldown for gate purposes.
    if (!jabsBattler) return false;

    const slotKey = PassiveRuleJabsAccess.resolveSlotKey(slotParam);

    // JABS reports ready === false while the slot is still cooling down.
    return jabsBattler.isSkillTypeCooldownReady(slotKey) === false;
  }

  /**
   * Whether every assigned combat skill slot is on cooldown simultaneously.<br/>
   * Only secondary slots (CombatSkill1–4) with an assigned skill are checked —
   * mainhand, offhand, tool, and dodge have no meaningful player-managed cooldowns
   * and must not pollute the result. Empty secondary slots are skipped for the same reason.<br/>
   * Used by {@code allOnCooldown} source-wide gate kind.
   * @param {Game_Battler} battler The battler whose slot manager we inspect.
   * @returns {boolean} True only when every assigned combat slot is still cooling down.
   */
  static #areAllCombatSlotsOnCooldown(battler)
  {
    const jabsBattler = PassiveRuleJabsAccess.getJabsBattler(battler);

    if (!jabsBattler) return false;

    const slotManager = jabsBattler.getBattler().getSkillSlotManager();

    if (!slotManager) return false;

    // only assigned secondary (combat) slots have cooldowns worth checking.
    const assignedCombatSlots = slotManager.getAllSecondarySlots()
      .filter(slot => slot.isEmpty() === false);

    // no assigned combat skills means nothing is on cooldown.
    if (assignedCombatSlots.length === 0) return false;

    return assignedCombatSlots
      .every(slot => jabsBattler.isSkillTypeCooldownReady(slot.key) === false);
  }

  /**
   * Whether every assigned combat skill slot is ready (off cooldown).<br/>
   * Only secondary slots (CombatSkill1–4) with an assigned skill are checked —
   * mainhand, offhand, tool, and dodge are excluded for the same reason as
   * {@link #areAllCombatSlotsOnCooldown}. Empty secondary slots are skipped.<br/>
   * Used by {@code allOffCooldown} source-wide gate kind.
   * @param {Game_Battler} battler The battler whose slot manager we inspect.
   * @returns {boolean} True only when every assigned combat slot is ready to fire.
   */
  static #areAllCombatSlotsReady(battler)
  {
    const jabsBattler = PassiveRuleJabsAccess.getJabsBattler(battler);

    if (!jabsBattler) return false;

    const slotManager = jabsBattler.getBattler().getSkillSlotManager();

    if (!slotManager) return false;

    // only assigned secondary (combat) slots have cooldowns worth checking.
    const assignedCombatSlots = slotManager.getAllSecondarySlots()
      .filter(slot => slot.isEmpty() === false);

    // no assigned combat skills means nothing to wait for — treat as ready.
    if (assignedCombatSlots.length === 0) return true;

    return assignedCombatSlots
      .every(slot => jabsBattler.isSkillTypeCooldownReady(slot.key) === true);
  }

  /**
   * Evaluates a single-resource threshold gate ({@code hpAbove}, {@code mpBelow}, etc.)
   * against the resolved scope of battlers.<br/>
   * Scope {@code anyAlly}/{@code anyEnemy} passes when at least one battler in range satisfies
   * the threshold; {@code allAllies}/{@code allEnemies} requires every battler to satisfy it.
   * Self scope (default) evaluates the evaluating battler only.
   * @param {Game_Battler} battler The evaluating battler.
   * @param {string} resource One of {@code hp}, {@code mp}, {@code tp}.
   * @param {string} direction {@code 'above'} or {@code 'below'}.
   * @param {number} threshold Tag threshold integer (0–100 percent).
   * @param {string} [scope] {@code self} (default), {@code anyAlly}, {@code allAllies}, {@code anyEnemy}, {@code allEnemies}.
   * @param {number|string} [range] Tile radius for ally/enemy scopes; defaults to plugin proximity param.
   * @returns {boolean} Whether the gate passes.
   */
  static #evaluateResourceThreshold(battler, resource, direction, threshold, scope, range)
  {
    const resolvedScope = scope ?? 'self';
    const resolvedRange = range !== undefined
      ? Number(range)
      : PassiveRuleJabsAccess.defaultProximity();

    const targets = this.#resolveScopedBattlers(battler, resolvedScope, resolvedRange);

    if (resolvedScope === 'anyAlly' || resolvedScope === 'anyEnemy')
    {
      return targets.some(target => PassiveRuleThreshold.compare(target, resource, direction, threshold));
    }

    // self, allAllies, allEnemies — every target must satisfy the threshold.
    return targets.every(target => PassiveRuleThreshold.compare(target, resource, direction, threshold));
  }

  /**
   * Evaluates {@code anyAbove}/{@code anyBelow} — passes when any of HP, MP, or TP
   * satisfies the threshold across the resolved scope.
   * @param {Game_Battler} battler The evaluating battler.
   * @param {string} direction {@code 'above'} or {@code 'below'}.
   * @param {number} threshold Threshold percent (0–100).
   * @param {string} [scope] Scope string; defaults to {@code self}.
   * @param {number|string} [range] Tile radius; defaults to plugin proximity param.
   * @returns {boolean} Whether at least one resource on any in-scope target satisfies the threshold.
   */
  static #evaluateAnyResourceThreshold(battler, direction, threshold, scope, range)
  {
    const resolvedScope = scope ?? 'self';
    const resolvedRange = range !== undefined
      ? Number(range)
      : PassiveRuleJabsAccess.defaultProximity();

    const targets = this.#resolveScopedBattlers(battler, resolvedScope, resolvedRange);

    // any resource on any target passes — widest possible gate.
    return targets.some(target =>
      PassiveRuleThreshold.CURRENT_RESOURCE_KEYS
        .some(key => PassiveRuleThreshold.compare(target, key, direction, threshold)));
  }

  /**
   * Evaluates {@code allAbove}/{@code allBelow} — passes when all of HP, MP, and TP
   * satisfy the threshold across the resolved scope.
   * @param {Game_Battler} battler The evaluating battler.
   * @param {string} direction {@code 'above'} or {@code 'below'}.
   * @param {number} threshold Threshold percent (0–100).
   * @param {string} [scope] Scope string; defaults to {@code self}.
   * @param {number|string} [range] Tile radius; defaults to plugin proximity param.
   * @returns {boolean} Whether every resource on every in-scope target satisfies the threshold.
   */
  static #evaluateAllResourcesThreshold(battler, direction, threshold, scope, range)
  {
    const resolvedScope = scope ?? 'self';
    const resolvedRange = range !== undefined
      ? Number(range)
      : PassiveRuleJabsAccess.defaultProximity();

    const targets = this.#resolveScopedBattlers(battler, resolvedScope, resolvedRange);

    // every resource on every target must pass — strictest possible gate.
    return targets.every(target =>
      PassiveRuleThreshold.CURRENT_RESOURCE_KEYS
        .every(key => PassiveRuleThreshold.compare(target, key, direction, threshold)));
  }

  /**
   * Resolves the set of battlers to test for a scoped resource threshold gate.<br/>
   * Scope controls who is evaluated; range limits the neighbourhood for ally/enemy scopes.
   * @param {Game_Battler} battler The evaluating battler.
   * @param {string} scope One of {@code self}, {@code anyAlly}, {@code allAllies}, {@code anyEnemy}, {@code allEnemies}.
   * @param {number} range Tile radius for ally/enemy scopes.
   * @returns {Game_Battler[]} The battlers to test against the threshold.
   */
  static #resolveScopedBattlers(battler, scope, range)
  {
    switch (scope)
    {
      case 'anyAlly':
      case 'allAllies':
        // allied battlers within range, excluding self — self is handled by the default self scope.
        return PassiveRuleJabsAccess.alliedBattlersWithinRange(battler, range)
          .map(jabs => jabs.getBattler())
          .filter(b => !!b);

      case 'anyEnemy':
      case 'allEnemies':
        return PassiveRuleJabsAccess.opposingBattlersWithinRange(battler, range)
          .map(jabs => jabs.getBattler())
          .filter(b => !!b);

      case 'self':
      default:
        return [ battler ];
    }
  }

  /**
   * Frames elapsed since a passive-rule timestamp was stamped.<br/>
   * Never-stamped events behave as "since forever" for sinceLast* kinds.
   * @param {number} stampFrame {@link Graphics.frameCount} when the event last occurred (0 = never).
   * @returns {number} Elapsed frames since the stamp.
   */
  static #framesSince(stampFrame)
  {
    // never stamped means "since forever" for sinceLast* and a large window for *Within rules.
    if (stampFrame <= 0) return Graphics.frameCount;

    return Graphics.frameCount - stampFrame;
  }
}

export default PassiveGateEvaluator;
//endregion PassiveGateEvaluator