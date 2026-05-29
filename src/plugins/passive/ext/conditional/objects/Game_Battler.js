//region Game_Battler
import ConditionalPassiveManager from '../managers/ConditionalPassiveManager.js';

/**
 * Extends {@link #initPassiveStatesMembers}.<br/>
 * Adds conditional passive reconcile timer storage.
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

  // initialize conditional passive members.
  this.initConditionalPassiveMembers();
};

/**
 * Initializes members used by the conditional passive extension.
 */
Game_Battler.prototype.initConditionalPassiveMembers = function()
{
  /**
   * A grouping of conditional passive runtime data.
   */
  this._j._passive._conditional ||= {};

  /**
   * Last resolved conditional passive state ids (sorted evaluation order).
   * @type {number[]}
   */
  if (!this._j._passive._conditional._snapshot)
  {
    this._j._passive._conditional._snapshot = [];
  }

  /**
   * Throttled reconcile timer for map-side condition drift.
   * @type {JABS_Timer}
   */
  if (!this._j._passive._conditional._timer)
  {
    const delay = J.PASSIVE.EXT.CONDITIONAL.Metadata.reconcileDelayFrames || 15;

    this._j._passive._conditional._timer = new JABS_Timer(delay);
  }
};

/**
 * @returns {number[]}
 */
Game_Battler.prototype.getConditionalPassiveSnapshot = function()
{
  this.initConditionalPassiveMembers();

  return this._j._passive._conditional._snapshot;
};

/**
 * @param {number[]} stateIds
 */
Game_Battler.prototype.setConditionalPassiveSnapshot = function(stateIds)
{
  this.initConditionalPassiveMembers();

  this._j._passive._conditional._snapshot = stateIds.slice();
};

/**
 * @returns {JABS_Timer}
 */
Game_Battler.prototype.conditionalPassiveReconcileTimer = function()
{
  this.initConditionalPassiveMembers();

  return this._j._passive._conditional._timer;
};

/**
 * Advances the reconcile timer and triggers a passive refresh when conditions may have drifted.
 */
Game_Battler.prototype.updateConditionalPassiveTimer = function()
{
  const timer = this.conditionalPassiveReconcileTimer();

  timer.update();

  if (timer.isTimerComplete() === false) return;

  timer.reset();

  ConditionalPassiveManager.reconcile(this);
};

/**
 * Extends {@link #refreshPassiveStates}.<br/>
 * Appends conditional passive state ids after the static passive rebuild completes.
 */
J.PASSIVE.EXT.CONDITIONAL.Aliased.Game_Battler.set(
  'refreshPassiveStates',
  Game_Battler.prototype.refreshPassiveStates
);
Game_Battler.prototype.refreshPassiveStates = function()
{
  // perform original logic (static + stackable passive sources).
  J.PASSIVE.EXT.CONDITIONAL.Aliased.Game_Battler.get('refreshPassiveStates')
    .call(this);

  // fold in conditional passives whose rules currently pass.
  ConditionalPassiveManager.appendActiveConditionalPassives(this);
};
//endregion Game_Battler