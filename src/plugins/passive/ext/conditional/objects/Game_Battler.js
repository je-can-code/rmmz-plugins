//region Game_Battler
import PassiveGateEvaluator from '../managers/PassiveGateEvaluator.js';
import PassiveStackCountEvaluator from '../managers/PassiveStackCountEvaluator.js';

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
};

/**
 * Returns the last map frame this battler moved.<br/>
 * Read by {@code sinceLastMoved} / {@code movedWithin} gate kinds.
 * @returns {number} {@link Graphics.frameCount} stamp, or 0 when never moved on the map.
 */
Game_Battler.prototype.getPassiveRuleLastMovedFrame = function()
{
  return this._j._passive._conditional._lastMovedFrame;
};

/**
 * Returns the last map frame this battler took damage.<br/>
 * Read by {@code sinceLastHit} / {@code hitWithin} gate kinds.
 * @returns {number} {@link Graphics.frameCount} stamp, or 0 when never hit on the map.
 */
Game_Battler.prototype.getPassiveRuleLastHitFrame = function()
{
  return this._j._passive._conditional._lastHitFrame;
};

/**
 * Returns the last map frame this battler executed a map skill.<br/>
 * Read by {@code sinceLastAttacked} / {@code attackedWithin} gate kinds.
 * @returns {number} {@link Graphics.frameCount} stamp, or 0 when never attacked on the map.
 */
Game_Battler.prototype.getPassiveRuleLastAttackedFrame = function()
{
  return this._j._passive._conditional._lastAttackedFrame;
};

/**
 * Stamps the current frame as the last time this battler moved on the map.<br/>
 * Called from {@link JABS_Battler#updatePassiveRuleMovementTracking} when coordinates change.
 */
Game_Battler.prototype.stampPassiveRuleMovedFrame = function()
{
  this._j._passive._conditional._lastMovedFrame = Graphics.frameCount;
};

/**
 * Stamps the current frame as the last time this battler took damage.<br/>
 * Called from the {@link #gainHp} alias when hp loss is applied.
 */
Game_Battler.prototype.stampPassiveRuleHitFrame = function()
{
  this._j._passive._conditional._lastHitFrame = Graphics.frameCount;
};

/**
 * Stamps the current frame as the last time this battler executed a map skill.<br/>
 * Called from {@link JABS_Battler#setLastUsedSkillId} after a real skill use.
 */
Game_Battler.prototype.stampPassiveRuleAttackedFrame = function()
{
  this._j._passive._conditional._lastAttackedFrame = Graphics.frameCount;
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
 * Returns true when no rules apply (unconditional passive) or when every tuple passes.
 * @param {RPG_BaseItem} baseItem Database row carrying passive and rule tags.
 * @param {number} stateId Passive state id being collected from this source.
 * @returns {boolean} Whether this source may contribute the given passive state right now.
 */
Game_Battler.prototype.evaluatePassiveGateRulesForSource = function(baseItem, stateId)
{
  const rules = this.collectPassiveGateRuleTuples(baseItem, stateId);

  // unconditional passives (no rules on the row) always pass.
  if (rules.length === 0) return true;

  // every applicable tuple must pass — per-source AND semantics.
  return rules.every(tuple =>
  {
    // source rules are [kind, param?]; state rules are [stateId, kind, param?].
    const kind = tuple.length === 2 ? tuple[0] : tuple[1];
    const param = tuple.length === 2 ? tuple[1] : tuple[2];

    return PassiveGateEvaluator.evaluate(this, kind, param);
  });
};

/**
 * Collects source-wide and state-specific gate tuples for one passive state id.<br/>
 * Source rules always apply; state rules are filtered to the requested state id.
 * @param {RPG_BaseItem} baseItem Database row carrying passive and rule tags.
 * @param {number} stateId Passive state id being collected from this source.
 * @returns {any[][]} Combined gate tuples in evaluation order.
 */
Game_Battler.prototype.collectPassiveGateRuleTuples = function(baseItem, stateId)
{
  const sourceRules = baseItem.passiveSourceRules || [];
  const stateRules = (baseItem.passiveStateRules || [])
    .filter(tuple => Number(tuple[0]) === stateId);

  // source-wide gates apply to every passive on the row; state gates add per-id conditions.
  return sourceRules.concat(stateRules);
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
  const matches = (baseItem.passiveStateCounts || [])
    .filter(tuple => Number(tuple[0]) === stateId);

  if (matches.length === 0) return null;

  // first matching scaler wins when authors accidentally duplicate tags.
  return matches[0];
};

/**
 * Builds a fingerprint of the current passive collection without mutating the tracker.<br/>
 * Re-runs the gated collectors so live rule context is reflected without applying states.
 * @returns {string} Stable JSON fingerprint of unique ids and stack entries.
 */
Game_Battler.prototype.buildPassiveCollectionFingerprint = function()
{
  const uniqueIds = [ ...this.getAllUniquePassiveStateIds() ].sort((left, right) => left - right);
  const stackEntries = [ ...this.getAllStackablePassiveStateIds().entries() ]
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
  const pending = this._j._passive._conditional._pendingFingerprint;

  // consume the stashed fingerprint when the drift-check cycle set one — saves a full
  // third collector pass since the pre-refresh fingerprint is still correct here.
  if (pending !== null)
  {
    this._j._passive._conditional._collectionFingerprint = pending;

    return;
  }

  // no stash means this refresh was triggered outside the reconcile cycle — recompute.
  this._j._passive._conditional._collectionFingerprint = this.buildPassiveCollectionFingerprint();
};

/**
 * Re-checks whether passive rule drift changed the collection; refreshes when it did.<br/>
 * Called from the throttled reconcile timer while the battler is active on the map.
 */
Game_Battler.prototype.reconcilePassiveRules = function()
{
  const nextFingerprint = this.buildPassiveCollectionFingerprint();
  const previousFingerprint = this._j._passive._conditional._collectionFingerprint;

  // no drift — skip the expensive passive rebuild.
  if (nextFingerprint === previousFingerprint) return;

  // stash the fingerprint before the rebuild so the post-refresh alias can apply it directly.
  // JS is single-threaded: the state that produced nextFingerprint cannot change before
  // refreshPassiveStates completes, so the stash is the correct post-refresh baseline.
  this._j._passive._conditional._pendingFingerprint = nextFingerprint;

  // rule context changed — rebuild passive tracker from gated sources.
  this.refreshPassiveStates();

  // clear the stash after the refresh alias has consumed it.
  this._j._passive._conditional._pendingFingerprint = null;
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
//endregion Game_Battler