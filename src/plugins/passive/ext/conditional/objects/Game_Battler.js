//region Game_Battler
import AutoApplyStateManager from '../managers/AutoApplyStateManager.js';
import AutoExecuteSkillManager from '../managers/AutoExecuteSkillManager.js';
import AutoInflictStateManager from '../managers/AutoInflictStateManager.js';
import AutoModifyCooldownManager from '../managers/AutoModifyCooldownManager.js';
import PassiveGateEvaluator from '../managers/PassiveGateEvaluator.js';
import PassiveStackCountEvaluator from '../managers/PassiveStackCountEvaluator.js';
import PassiveRuleJabsAccess from '../helpers/PassiveRuleJabsAccess.js';

/**
 * Extends {@link #initPassiveStatesMembers}.<br/>
 * Adds passive rule tracking frames and reconcile timer storage.
 */
J.PASSIVE.EXT.CONDITIONAL.Aliased.Game_Battler.set(
  'initPassiveStatesMembers',
  Game_Battler.prototype.initPassiveStatesMembers
);
Game_Battler.prototype.initPassiveStatesMembers = function()
{
  // perform original logic.
  J.PASSIVE.EXT.CONDITIONAL.Aliased.Game_Battler.get('initPassiveStatesMembers')
    .call(this);

  // layer conditional rule runtime members on top of passive core storage.
  this.initPassiveRuleMembers();
};

/**
 * Initializes members used by passive rule evaluation and drift reconciliation.<br/>
 * Stored under {@code _j._passive._conditional} alongside passive core's state tracker.
 */
Game_Battler.prototype.initPassiveRuleMembers = function()
{
  /**
   * A grouping of passive rule runtime data.
   */
  this._j._passive._conditional = {};

  /**
   * Cached passive collection fingerprint for cheap drift checks on the map.
   * @type {string}
   */
  this._j._passive._conditional._collectionFingerprint = String.empty;

  /**
   * Fingerprint computed by the current drift check, held briefly so the post-refresh
   * alias can apply it directly instead of re-running both collectors a third time.
   * Null outside of an active reconcilePassiveRules call.
   * @type {string|null}
   */
  this._j._passive._conditional._pendingFingerprint = null;

  /**
   * Throttled reconcile timer for map-side rule drift.
   * @type {JABS_Timer}
   */
  const delay = J.PASSIVE.EXT.CONDITIONAL.Metadata.reconcileDelayFrames || 15;

  this._j._passive._conditional._timer = new JABS_Timer(delay);

  /**
   * Last map frame this battler moved.
   * @type {number}
   */
  this._j._passive._conditional._lastMovedFrame = 0;

  /**
   * Last map frame this battler took damage.
   * @type {number}
   */
  this._j._passive._conditional._lastHitFrame = 0;

  /**
   * Last map frame this battler executed a map skill.
   * @type {number}
   */
  this._j._passive._conditional._lastAttackedFrame = 0;

  /**
   * Last known real X coordinate of the map character; seeded on first JABS update.
   * @type {number|null}
   */
  this._j._passive._conditional._lastTrackedX = null;

  /**
   * Last known real Y coordinate of the map character; seeded on first JABS update.
   * @type {number|null}
   */
  this._j._passive._conditional._lastTrackedY = null;

  /**
   * Last map frame this battler received positive HP recovery.
   * @type {number}
   */
  this._j._passive._conditional._lastHpHealFrame = 0;

  /**
   * Last map frame this battler received positive MP recovery.
   * @type {number}
   */
  this._j._passive._conditional._lastMpHealFrame = 0;

  /**
   * Last map frame this battler received positive TP recovery.
   * @type {number}
   */
  this._j._passive._conditional._lastTpHealFrame = 0;

  /**
   * Per-rule cooldown stamps shared across all {@link AutoRuleManager} subclasses (rule key → frame).
   * @type {Map<string, number>}
   */
  this._j._passive._conditional._autoRuleLastFrame = new Map();

  /**
   * Per-rule whole-tile credit shared across all {@link AutoRuleManager} subclasses (rule key → tiles).
   * @type {Map<string, number>}
   */
  this._j._passive._conditional._autoRuleTileCredit = new Map();
};

/**
 * Reads the last map frame an auto rule key fired.
 * @param {string} ruleKey Stable key from {@link AutoRuleManager.buildRuleKey}.
 * @returns {number}
 */
Game_Battler.prototype.getAutoRuleLastFrame = function(ruleKey)
{
  return this.autoRuleLastFrame().get(ruleKey) || 0;
};

/**
 * Stamps the last map frame an auto rule key fired.
 * @param {string} ruleKey Stable key from {@link AutoRuleManager.buildRuleKey}.
 * @param {number} frame {@link Graphics.frameCount} when the rule last fired.
 */
Game_Battler.prototype.setAutoRuleLastFrame = function(ruleKey, frame)
{
  this.autoRuleLastFrame().set(ruleKey, frame);
};

/**
 * Reads accumulated whole-tile credit for one {@code move} auto rule key.
 * @param {string} ruleKey Stable key from {@link AutoRuleManager.buildRuleKey}.
 * @returns {number}
 */
Game_Battler.prototype.getAutoRuleTileCredit = function(ruleKey)
{
  return this.autoRuleTileCredit().get(ruleKey) || 0;
};

/**
 * Stores accumulated whole-tile credit for one {@code move} auto rule key.
 * @param {string} ruleKey Stable key from {@link AutoRuleManager.buildRuleKey}.
 * @param {number} tiles Whole tiles credited toward the next dispatch.
 */
Game_Battler.prototype.setAutoRuleTileCredit = function(ruleKey, tiles)
{
  this.autoRuleTileCredit().set(ruleKey, tiles);
};

/**
 * Returns the last map frame this battler moved.<br/>
 * Read by {@code sinceLastMoved} / {@code movedWithin} gate kinds.
 * @returns {number} {@link Graphics.frameCount} stamp, or 0 when never moved on the map.
 */
Game_Battler.prototype.getPassiveRuleLastMovedFrame = function()
{
  return this.lastMovedFrame();
};

/**
 * Returns the last map frame this battler took damage.<br/>
 * Read by {@code sinceLastHit} / {@code hitWithin} gate kinds.
 * @returns {number} {@link Graphics.frameCount} stamp, or 0 when never hit on the map.
 */
Game_Battler.prototype.getPassiveRuleLastHitFrame = function()
{
  return this.lastHitFrame();
};

/**
 * Returns the last map frame this battler executed a map skill.<br/>
 * Read by {@code sinceLastAttacked} / {@code attackedWithin} gate kinds.
 * @returns {number} {@link Graphics.frameCount} stamp, or 0 when never attacked on the map.
 */
Game_Battler.prototype.getPassiveRuleLastAttackedFrame = function()
{
  return this.lastAttackedFrame();
};

/**
 * Stamps the current frame as the last time this battler moved on the map.<br/>
 * Called from {@link JABS_Battler#updatePassiveRuleMovementTracking} when coordinates change.
 */
Game_Battler.prototype.stampPassiveRuleMovedFrame = function()
{
  this.setLastMovedFrame(Graphics.frameCount);
};

/**
 * Stamps the current frame as the last time this battler took damage.<br/>
 * Called from the {@link #gainHp} alias when hp loss is applied.
 */
Game_Battler.prototype.stampPassiveRuleHitFrame = function()
{
  this.setLastHitFrame(Graphics.frameCount);
};

/**
 * Stamps the current frame as the last time this battler executed a map skill.<br/>
 * Called from {@link JABS_Battler#setLastUsedSkillId} after a real skill use.
 */
Game_Battler.prototype.stampPassiveRuleAttackedFrame = function()
{
  this.setLastAttackedFrame(Graphics.frameCount);
};

/**
 * Returns the last frame this battler received positive HP recovery.<br/>
 * Read by the {@code onHealHp} gate kind.
 * @returns {number} {@link Graphics.frameCount} stamp, or 0 when never healed.
 */
Game_Battler.prototype.getPassiveRuleLastHpHealFrame = function()
{
  return this.lastHpHealFrame();
};

/**
 * Returns the last frame this battler received positive MP recovery.<br/>
 * Read by the {@code onHealMp} gate kind.
 * @returns {number} {@link Graphics.frameCount} stamp, or 0 when never healed.
 */
Game_Battler.prototype.getPassiveRuleLastMpHealFrame = function()
{
  return this.lastMpHealFrame();
};

/**
 * Returns the last frame this battler received positive TP recovery.<br/>
 * Read by the {@code onHealTp} gate kind.
 * @returns {number} {@link Graphics.frameCount} stamp, or 0 when never healed.
 */
Game_Battler.prototype.getPassiveRuleLastTpHealFrame = function()
{
  return this.lastTpHealFrame();
};

/**
 * Stamps the current frame as the last time this battler received HP healing.
 */
Game_Battler.prototype.stampPassiveRuleHpHealFrame = function()
{
  this.setLastHpHealFrame(Graphics.frameCount);
};

/**
 * Stamps the current frame as the last time this battler received MP healing.
 */
Game_Battler.prototype.stampPassiveRuleMpHealFrame = function()
{
  this.setLastMpHealFrame(Graphics.frameCount);
};

/**
 * Stamps the current frame as the last time this battler received TP healing.
 */
Game_Battler.prototype.stampPassiveRuleTpHealFrame = function()
{
  this.setLastTpHealFrame(Graphics.frameCount);
};

/**
 * Extends {@link #gainHp}.<br/>
 * Records damage timestamps for {@link passiveStateRule} kinds that care about hit windows.
 */
J.PASSIVE.EXT.CONDITIONAL.Aliased.Game_Battler.set('gainHp', Game_Battler.prototype.gainHp);
Game_Battler.prototype.gainHp = function(value)
{
  // negative hp gain is damage — stamp before core applies the change.
  if (value < 0)
  {
    this.stampPassiveRuleHitFrame();
  }

  // perform original logic.
  J.PASSIVE.EXT.CONDITIONAL.Aliased.Game_Battler.get('gainHp')
    .call(this, value);

  if (value < 0)
  {
    AutoApplyStateManager.scheduleDamageTriggers(this, 'hpDmg');
    AutoExecuteSkillManager.scheduleDamageTriggers(this, 'hpDmg');
  }
};

/**
 * Extends {@link #gainMp}.<br/>
 * Fires mpDmg auto-apply rules when MP is reduced.
 */
J.PASSIVE.EXT.CONDITIONAL.Aliased.Game_Battler.set('gainMp', Game_Battler.prototype.gainMp);
Game_Battler.prototype.gainMp = function(value)
{
  // perform original logic.
  J.PASSIVE.EXT.CONDITIONAL.Aliased.Game_Battler.get('gainMp')
    .call(this, value);

  // schedule mp + any-damage auto-apply rules after the resource change lands.
  if (value < 0)
  {
    AutoApplyStateManager.scheduleDamageTriggers(this, 'mpDmg');
    AutoExecuteSkillManager.scheduleDamageTriggers(this, 'mpDmg');
  }
};

/**
 * Extends {@link #gainTp}.<br/>
 * Fires tpDmg auto-apply rules when TP is reduced.
 */
J.PASSIVE.EXT.CONDITIONAL.Aliased.Game_Battler.set('gainTp', Game_Battler.prototype.gainTp);
Game_Battler.prototype.gainTp = function(value)
{
  // perform original logic.
  J.PASSIVE.EXT.CONDITIONAL.Aliased.Game_Battler.get('gainTp')
    .call(this, value);

  // schedule tp + any-damage auto-apply rules after the resource change lands.
  if (value < 0)
  {
    AutoApplyStateManager.scheduleDamageTriggers(this, 'tpDmg');
    AutoExecuteSkillManager.scheduleDamageTriggers(this, 'tpDmg');
  }
};

/**
 * Extends {@link #onHeal}.<br/>
 * Stamps the appropriate heal-frame counter so {@link PassiveGateEvaluator} can check
 * whether a heal occurred recently enough for an {@code onHealHp/Mp/Tp} gate to pass.
 */
J.PASSIVE.EXT.CONDITIONAL.Aliased.Game_Battler.set('onHeal', Game_Battler.prototype.onHeal);
Game_Battler.prototype.onHeal = function(resource, amount)
{
  // perform original logic.
  J.PASSIVE.EXT.CONDITIONAL.Aliased.Game_Battler.get('onHeal').call(this, resource, amount);

  // stamp the appropriate resource heal frame so gate evaluators can check recency.
  if (resource === J.BASE.Resource.HP)
  {
    this.stampPassiveRuleHpHealFrame();
    AutoApplyStateManager.scheduleHealTriggers(this, 'onHealHp');
    AutoExecuteSkillManager.scheduleHealTriggers(this, 'onHealHp');
  }
  else if (resource === J.BASE.Resource.MP)
  {
    this.stampPassiveRuleMpHealFrame();
    AutoApplyStateManager.scheduleHealTriggers(this, 'onHealMp');
    AutoExecuteSkillManager.scheduleHealTriggers(this, 'onHealMp');
  }
  else if (resource === J.BASE.Resource.TP)
  {
    this.stampPassiveRuleTpHealFrame();
    AutoApplyStateManager.scheduleHealTriggers(this, 'onHealTp');
    AutoExecuteSkillManager.scheduleHealTriggers(this, 'onHealTp');
  }

  // notify nearby allies that one of their own was healed- each ally's own onAllyHeal rules
  // fire against themselves (self-dispatch), same mechanism as onHealHp/Mp/Tp above, just
  // evaluated on every ally in proximity instead of on this battler.
  PassiveRuleJabsAccess.nearbyAlliesExcludingSelf(this).forEach(jabsAlly =>
  {
    const allyBattler = jabsAlly.getBattler();

    if (!allyBattler) return;

    AutoApplyStateManager.scheduleHealTriggers(allyBattler, 'onAllyHeal');
    AutoExecuteSkillManager.scheduleHealTriggers(allyBattler, 'onAllyHeal');
  });
};

/**
 * Extends {@link #canIncludePassiveStateFromSource}.<br/>
 * Applies passiveSourceRule and passiveStateRule gates for this source/state pair.
 */
J.PASSIVE.EXT.CONDITIONAL.Aliased.Game_Battler.set(
  'canIncludePassiveStateFromSource',
  Game_Battler.prototype.canIncludePassiveStateFromSource
);
Game_Battler.prototype.canIncludePassiveStateFromSource = function(baseItem, stateId)
{
  // honor any upstream extension that already vetoed this source/state pair.
  // perform original logic.
  if (J.PASSIVE.EXT.CONDITIONAL.Aliased.Game_Battler.get('canIncludePassiveStateFromSource')
    .call(this, baseItem, stateId) === false)
  {
    return false;
  }

  // evaluate every gate tuple that applies to this passive state on this row.
  return this.evaluatePassiveGateRulesForSource(baseItem, stateId);
};

/**
 * Extends {@link #getPassiveStackContributionFromSource}.<br/>
 * Applies passiveStateCount scaling when declared for this source/state pair.
 */
J.PASSIVE.EXT.CONDITIONAL.Aliased.Game_Battler.set(
  'getPassiveStackContributionFromSource',
  Game_Battler.prototype.getPassiveStackContributionFromSource
);
Game_Battler.prototype.getPassiveStackContributionFromSource = function(baseItem, stateId)
{
  const countTuple = this.findPassiveStateCountTuple(baseItem, stateId);

  // no scaler on this row — defer to passive core default (+1 stack).
  if (countTuple === null)
  {
    // perform original logic.
    return J.PASSIVE.EXT.CONDITIONAL.Aliased.Game_Battler.get('getPassiveStackContributionFromSource')
      .call(this, baseItem, stateId);
  }

  return PassiveStackCountEvaluator.evaluateTuple(this, countTuple);
};

/**
 * Evaluates every gate rule on a source that applies to the given passive state id.<br/>
 * Source rules ({@code [kind, param?]}) and state rules ({@code [stateId, kind, param?]}) are
 * evaluated separately with explicit destructuring — no length heuristics.<br/>
 * All rules AND together; any failure short-circuits and excludes the passive.
 * @param {RPG_BaseItem} baseItem Database row carrying passive and rule tags.
 * @param {number} stateId Passive state id being evaluated for this source.
 * @returns {boolean} Whether this source may contribute the given passive state right now.
 */
Game_Battler.prototype.evaluatePassiveGateRulesForSource = function(baseItem, stateId)
{
  // source rules gate every passive on this row; shape is [kind, ...params].
  const sourceRules = baseItem.passiveSourceRules;
  const passesSourceRules = sourceRules.every(([kind, ...params]) =>
    PassiveGateEvaluator.evaluate(this, kind, ...params));

  // bail early — no need to check state rules if a source rule already failed.
  if (passesSourceRules === false) return false;

  // state rules target a specific passive id; shape is [stateId, kind, ...params].
  const stateRules = baseItem.passiveStateRules
    .filter(([ruleStateId]) => Number(ruleStateId) === stateId);
  const passesStateRules = stateRules.every(([, kind, ...params]) =>
    PassiveGateEvaluator.evaluate(this, kind, ...params));

  return passesStateRules;
};

/**
 * Finds the first passiveStateCount tuple targeting a passive state id on this source.<br/>
 * When authors duplicate tags, the first match wins.
 * @param {RPG_BaseItem} baseItem Database row carrying passive and rule tags.
 * @param {number} stateId Passive state id whose stack scaler we want.
 * @returns {any[]|null} Parsed {@code [stateId, kind, param]} tuple, or null when none.
 */
Game_Battler.prototype.findPassiveStateCountTuple = function(baseItem, stateId)
{
  const matches = baseItem.passiveStateCounts
    .filter(tuple => Number(tuple[0]) === stateId);

  if (matches.length === 0) return null;

  // first matching scaler wins when authors accidentally duplicate tags.
  return matches[0];
};

/**
 * Builds a fingerprint of the current passive collection without mutating the tracker.<br/>
 * Uses the pre-filtered {@link #passiveCapableSources} list from the last refresh rather than
 * re-invoking the full collectors — sources like weapon combat skills that carry no passive tags
 * are already excluded, so only the relevant subset is evaluated against live gate rules.
 * @returns {string} Stable JSON fingerprint of unique ids and stack entries.
 */
Game_Battler.prototype.buildPassiveCollectionFingerprint = function()
{
  // use the pre-filtered source list built during the last refresh.
  const sources = this.passiveCapableSources();

  const uniqueIds = [];

  /** @type {Map<number, number>} */
  const stackMap = new Map();

  sources.forEach(source =>
  {
    // build the unique id list for this source; concat avoids mutating the cached getter arrays.
    let uniqueSourceIds = source.uniquePassiveStateIds;

    if (source.isEquipItem())
    {
      uniqueSourceIds = uniqueSourceIds.concat(source.uniqueEquippedPassiveStateIds);
    }

    uniqueSourceIds.forEach(id =>
    {
      if (this.canIncludePassiveStateFromSource(source, id))
      {
        uniqueIds.push(id);
      }
    });

    // build the stackable id list for this source in the same non-mutating way.
    let stackableSourceIds = source.passiveStateIds;

    if (source.isEquipItem())
    {
      stackableSourceIds = stackableSourceIds.concat(source.equippedPassiveStateIds);
    }

    stackableSourceIds.forEach(id =>
    {
      if (this.canIncludePassiveStateFromSource(source, id) === false) return;

      const contribution = this.getPassiveStackContributionFromSource(source, id);

      if (contribution <= 0) return;

      // accumulate stack contributions across all sources that grant this id.
      const running = stackMap.has(id) ? stackMap.get(id) : 0;
      stackMap.set(id, running + contribution);
    });
  });

  uniqueIds.sort((left, right) => left - right);

  const stackEntries = [ ...stackMap.entries() ]
    .sort((left, right) => left[0] - right[0]);

  return JSON.stringify({
    uniqueIds,
    stackEntries,
  });
};

/**
 * Stores the latest passive collection fingerprint after a refresh pass.<br/>
 * When called from within a {@link reconcilePassiveRules} cycle the pending fingerprint is
 * reused directly — the drift check already ran both collectors, so running them a third
 * time would be redundant.  Outside that cycle (e.g. equip/unequip) both collectors run
 * fresh to produce an accurate baseline.
 */
Game_Battler.prototype.updatePassiveRuleCollectionFingerprint = function()
{
  const pending = this.pendingFingerprint();

  // consume the stashed fingerprint when the drift-check cycle set one — saves a full
  // third collector pass since the pre-refresh fingerprint is still correct here.
  if (pending !== null)
  {
    this.setCollectionFingerprint(pending);

    return;
  }

  // no stash means this refresh was triggered outside the reconcile cycle — recompute.
  this.setCollectionFingerprint(this.buildPassiveCollectionFingerprint());
};

/**
 * Re-checks whether passive rule drift changed the collection; refreshes when it did.<br/>
 * Called from the throttled reconcile timer while the battler is active on the map.
 */
Game_Battler.prototype.reconcilePassiveRules = function()
{
  const nextFingerprint = this.buildPassiveCollectionFingerprint();
  const previousFingerprint = this.collectionFingerprint();

  // no drift — skip the expensive passive rebuild.
  if (nextFingerprint === previousFingerprint) return;

  // stash the fingerprint before the rebuild so the post-refresh alias can apply it directly.
  // JS is single-threaded: the state that produced nextFingerprint cannot change before
  // refreshPassiveStates completes, so the stash is the correct post-refresh baseline.
  this.setPendingFingerprint(nextFingerprint);

  // rule context changed — rebuild passive tracker from gated sources.
  this.refreshPassiveStates();

  // clear the stash after the refresh alias has consumed it.
  this.setPendingFingerprint(null);
};

/**
 * Returns the throttled reconcile timer used while this battler is active on the map.<br/>
 * Interval comes from {@link reconcile-delay-frames} plugin param.
 * @returns {JABS_Timer} Repeating timer owned by this battler's conditional storage.
 */
Game_Battler.prototype.passiveRuleReconcileTimer = function()
{
  return this._j._passive._conditional._timer;
};

/**
 * Advances the reconcile timer and triggers a passive refresh when rule drift is detected.<br/>
 * Reset-after-fire pattern keeps reconcile work off every single map frame.
 */
Game_Battler.prototype.updatePassiveRuleReconcileTimer = function()
{
  const timer = this.passiveRuleReconcileTimer();

  timer.update();

  if (timer.isTimerComplete() === false) return;

  timer.reset();

  this.reconcilePassiveRules();
};

/**
 * Extends {@link #refreshPassiveStates}.<br/>
 * Updates the cached collection fingerprint after passive core rebuilds the tracker.
 */
J.PASSIVE.EXT.CONDITIONAL.Aliased.Game_Battler.set(
  'refreshPassiveStates',
  Game_Battler.prototype.refreshPassiveStates
);
Game_Battler.prototype.refreshPassiveStates = function()
{
  // perform original logic.
  J.PASSIVE.EXT.CONDITIONAL.Aliased.Game_Battler.get('refreshPassiveStates')
    .call(this);

  // snapshot the post-refresh collection so drift checks have a baseline.
  this.updatePassiveRuleCollectionFingerprint();
};

/**
 * Manually triggers auto-execute skill rules for the given condition kind on this battler.<br/>
 * Delegates to {@link AutoExecuteSkillManager.tryDispatch}, which applies the depth guard to
 * prevent infinite re-entry when a forced skill itself triggers further auto-executes.
 * @param {string} conditionKind - The condition kind to evaluate (e.g. 'time', 'stand').
 */
Game_Battler.prototype.tryAutoExecuteSkills = function(conditionKind)
{
  AutoExecuteSkillManager.tryDispatch(this, conditionKind);
};

/**
 * Extends {@link #onStateAdded}.<br/>
 * Fires anyStateAdded plus posi/nega polarity auto-apply when a combat state lands.
 */
J.PASSIVE.EXT.CONDITIONAL.Aliased.Game_Battler.set('onStateAdded', Game_Battler.prototype.onStateAdded);
Game_Battler.prototype.onStateAdded = function(stateId)
{
  // perform original logic.
  J.PASSIVE.EXT.CONDITIONAL.Aliased.Game_Battler.get('onStateAdded')
    .call(this, stateId);

  AutoApplyStateManager.scheduleStateAddedTriggers(this, stateId);
  AutoExecuteSkillManager.scheduleStateAddedTriggers(this, stateId);
};

/**
 * Extends {@link #onJabsStateInflicted}.<br/>
 * Fires autoInflictState rules on the inflicting battler, applying the configured payload state
 * onto this battler (the one just afflicted)- not the inflictor, and not anything nearby. Also
 * fires the inflicting battler's autoModifyCooldowns rules against themselves- unlike
 * autoInflictState, that effect lands back on the inflictor, not on this newly-afflicted target.
 */
J.PASSIVE.EXT.CONDITIONAL.Aliased.Game_Battler.set(
  'onJabsStateInflicted',
  Game_Battler.prototype.onJabsStateInflicted
);
Game_Battler.prototype.onJabsStateInflicted = function(stateId, attacker)
{
  // perform original logic (a no-op today, but future extensions may alias further).
  J.PASSIVE.EXT.CONDITIONAL.Aliased.Game_Battler.get('onJabsStateInflicted')
    .call(this, stateId, attacker);

  // evaluate the inflicting battler's own autoInflictState rules against this newly-afflicted target.
  AutoInflictStateManager.scheduleInflictedStateTriggers(attacker, this, stateId);

  // evaluate the inflicting battler's own autoModifyCooldowns rules against themselves.
  AutoModifyCooldownManager.scheduleSelfStateInflictedTriggers(attacker, stateId);
};

//region properties
/**
 * Gets the auto rule last frame.
 * @returns {*} The autoRuleLastFrame.
 */
Game_Battler.prototype.autoRuleLastFrame = function()
{
  // hand back the auto rule last frame.
  return this._j._passive._conditional._autoRuleLastFrame;
};

/**
 * Gets the auto rule tile credit.
 * @returns {*} The autoRuleTileCredit.
 */
Game_Battler.prototype.autoRuleTileCredit = function()
{
  // hand back the auto rule tile credit.
  return this._j._passive._conditional._autoRuleTileCredit;
};

/**
 * Gets the last moved frame.
 * @returns {*} The lastMovedFrame.
 */
Game_Battler.prototype.lastMovedFrame = function()
{
  // hand back the last moved frame.
  return this._j._passive._conditional._lastMovedFrame;
};

/**
 * Sets the last moved frame.
 * @param {*} newLastMovedFrame The new lastMovedFrame.
 */
Game_Battler.prototype.setLastMovedFrame = function(newLastMovedFrame)
{
  // assign the last moved frame.
  this._j._passive._conditional._lastMovedFrame = newLastMovedFrame;
};

/**
 * Gets the last hit frame.
 * @returns {*} The lastHitFrame.
 */
Game_Battler.prototype.lastHitFrame = function()
{
  // hand back the last hit frame.
  return this._j._passive._conditional._lastHitFrame;
};

/**
 * Sets the last hit frame.
 * @param {*} newLastHitFrame The new lastHitFrame.
 */
Game_Battler.prototype.setLastHitFrame = function(newLastHitFrame)
{
  // assign the last hit frame.
  this._j._passive._conditional._lastHitFrame = newLastHitFrame;
};

/**
 * Gets the last attacked frame.
 * @returns {*} The lastAttackedFrame.
 */
Game_Battler.prototype.lastAttackedFrame = function()
{
  // hand back the last attacked frame.
  return this._j._passive._conditional._lastAttackedFrame;
};

/**
 * Sets the last attacked frame.
 * @param {*} newLastAttackedFrame The new lastAttackedFrame.
 */
Game_Battler.prototype.setLastAttackedFrame = function(newLastAttackedFrame)
{
  // assign the last attacked frame.
  this._j._passive._conditional._lastAttackedFrame = newLastAttackedFrame;
};

/**
 * Gets the last hp heal frame.
 * @returns {*} The lastHpHealFrame.
 */
Game_Battler.prototype.lastHpHealFrame = function()
{
  // hand back the last hp heal frame.
  return this._j._passive._conditional._lastHpHealFrame;
};

/**
 * Sets the last hp heal frame.
 * @param {*} newLastHpHealFrame The new lastHpHealFrame.
 */
Game_Battler.prototype.setLastHpHealFrame = function(newLastHpHealFrame)
{
  // assign the last hp heal frame.
  this._j._passive._conditional._lastHpHealFrame = newLastHpHealFrame;
};

/**
 * Gets the last mp heal frame.
 * @returns {*} The lastMpHealFrame.
 */
Game_Battler.prototype.lastMpHealFrame = function()
{
  // hand back the last mp heal frame.
  return this._j._passive._conditional._lastMpHealFrame;
};

/**
 * Sets the last mp heal frame.
 * @param {*} newLastMpHealFrame The new lastMpHealFrame.
 */
Game_Battler.prototype.setLastMpHealFrame = function(newLastMpHealFrame)
{
  // assign the last mp heal frame.
  this._j._passive._conditional._lastMpHealFrame = newLastMpHealFrame;
};

/**
 * Gets the last tp heal frame.
 * @returns {*} The lastTpHealFrame.
 */
Game_Battler.prototype.lastTpHealFrame = function()
{
  // hand back the last tp heal frame.
  return this._j._passive._conditional._lastTpHealFrame;
};

/**
 * Sets the last tp heal frame.
 * @param {*} newLastTpHealFrame The new lastTpHealFrame.
 */
Game_Battler.prototype.setLastTpHealFrame = function(newLastTpHealFrame)
{
  // assign the last tp heal frame.
  this._j._passive._conditional._lastTpHealFrame = newLastTpHealFrame;
};

/**
 * Gets the pending fingerprint.
 * @returns {*} The pendingFingerprint.
 */
Game_Battler.prototype.pendingFingerprint = function()
{
  // hand back the pending fingerprint.
  return this._j._passive._conditional._pendingFingerprint;
};

/**
 * Sets the pending fingerprint.
 * @param {*} newPendingFingerprint The new pendingFingerprint.
 */
Game_Battler.prototype.setPendingFingerprint = function(newPendingFingerprint)
{
  // assign the pending fingerprint.
  this._j._passive._conditional._pendingFingerprint = newPendingFingerprint;
};

/**
 * Gets the collection fingerprint.
 * @returns {*} The collectionFingerprint.
 */
Game_Battler.prototype.collectionFingerprint = function()
{
  // hand back the collection fingerprint.
  return this._j._passive._conditional._collectionFingerprint;
};

/**
 * Sets the collection fingerprint.
 * @param {*} newCollectionFingerprint The new collectionFingerprint.
 */
Game_Battler.prototype.setCollectionFingerprint = function(newCollectionFingerprint)
{
  // assign the collection fingerprint.
  this._j._passive._conditional._collectionFingerprint = newCollectionFingerprint;
};
//endregion properties
//endregion Game_Battler