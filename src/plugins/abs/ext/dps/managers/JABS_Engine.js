//region JABS_Engine
import JabsDpsTracker from './JabsDpsTracker.js';

//region initialize
/**
 * Extends {@link JABS_Engine.prototype.initialize}.<br/>
 * Also seeds the damage tracker that measures what the party is putting out.
 *
 * The tracker survives a map transfer for the same reason the food chain plans do- a fight can be
 * walked out of and back into, and a reading that resets at the map edge would be a reading about
 * the map edge.
 * @param {boolean} isMapTransfer Whether or not this initialization is from a map transfer.
 */
J.ABS.EXT.DPS.Aliased.JABS_Engine.set('initialize', JABS_Engine.prototype.initialize);
JABS_Engine.prototype.initialize = function(isMapTransfer = true)
{
  // perform original logic.
  J.ABS.EXT.DPS.Aliased.JABS_Engine.get('initialize')
    .call(this, isMapTransfer);

  // the window length is fixed for the session; the tracker measures in frames, not seconds.
  const { rollingWindowFrames } = J.ABS.EXT.DPS.Metadata;

  /**
   * The tracker measuring per-battler damage output across the current and previous encounters.
   * @type {JabsDpsTracker}
   */
  this._dpsTracker = isMapTransfer
    ? this._dpsTracker ?? new JabsDpsTracker(rollingWindowFrames)
    : new JabsDpsTracker(rollingWindowFrames);
};
//endregion initialize

//region dpsTracker
/**
 * Gets the tracker measuring per-battler damage output.
 * @returns {JabsDpsTracker}
 */
JABS_Engine.prototype.dpsTracker = function()
{
  return this._dpsTracker;
};
//endregion dpsTracker

//region update
/**
 * Extends {@link JABS_Engine.prototype.update}.<br/>
 * Also advances the damage tracker's combat clock.
 *
 * Hooked here rather than onto the map scene so the measurement runs whether or not the readout is
 * installed- the numbers are the plugin, and the window is only one way of looking at them.
 */
J.ABS.EXT.DPS.Aliased.JABS_Engine.set('update', JABS_Engine.prototype.update);
JABS_Engine.prototype.update = function()
{
  // perform original logic.
  J.ABS.EXT.DPS.Aliased.JABS_Engine.get('update')
    .call(this);

  // advance the combat clock and close out any encounter that just ended.
  this.dpsTracker()
    .update();
};
//endregion update

//region postExecuteSkillEffects
/**
 * Extends {@link JABS_Engine.prototype.postExecuteSkillEffects}.<br/>
 * Also offers the landed hit to the damage tracker.
 * @param {JABS_Action} action The action being executed.
 * @param {JABS_Battler} target The target the skill effects were applied against.
 */
J.ABS.EXT.DPS.Aliased.JABS_Engine.set('postExecuteSkillEffects', JABS_Engine.prototype.postExecuteSkillEffects);
JABS_Engine.prototype.postExecuteSkillEffects = function(action, target)
{
  // perform original logic, which is what puts the result on the target.
  J.ABS.EXT.DPS.Aliased.JABS_Engine.get('postExecuteSkillEffects')
    .call(this, action, target);

  // whether this hit belongs in the record is the tracker's judgement to make.
  this.dpsTracker()
    .handleSkillEffect(action, target);
};
//endregion postExecuteSkillEffects
//endregion JABS_Engine