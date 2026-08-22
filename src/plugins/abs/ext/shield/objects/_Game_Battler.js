//region Game_Battler
import JABS_Shield from './../_models/JABS_Shield.js';
/**
 * Extends {@link #createJabsState}.<br/>
 * Also includes shield data.
 * @param {Game_Battler} target the battler being affected by the state.
 * @param {number} stateId The id of the state being applied.
 * @param {number} iconIndex The icon index of the state being applied.
 * @param {number} totalDuration The total duration in frames of the state being applied.
 * @param {number} stacks The number of stacks of the state being applied.
 * @param {Game_Battler} attacker The battler applying the state.
 * @param {RPG_Skill=} sourceSkill The skill that was executing when this state was applied, if any.
 * @returns {JABS_StateBuilder} The builder with all the parameters of the state being applied.
 */
J.ABS.EXT.SHIELD.Aliased.Game_Battler.set('createJabsState', Game_Battler.prototype.createJabsState);
Game_Battler.prototype.createJabsState = function(target, stateId, iconIndex, totalDuration, stacks, attacker, sourceSkill = null)
{
  // perform original logic.
  const builder = J.ABS.EXT.SHIELD.Aliased.Game_Battler.get('createJabsState')
    .call(this, target, stateId, iconIndex, totalDuration, stacks, attacker, sourceSkill);

  // determine the shield. the attacker rides along because it is both the `a` binding for the
  // shield point formulas and the source of the outgoing amplification- omitting it would make
  // the shield compute a different value here than it does on every later recalculation.
  const shield = JABS_Shield.fromStateId(stateId, target, attacker);

  // set the shield.
  builder.setShield(shield);

  // return the builder.
  return builder;
};

/**
 * Gets the array of states containing non-broken shields and their values, sorted in priority order.
 * @returns {JABS_State[]}
 */
Game_Battler.prototype.getShieldStates = function()
{
  // grab all of this battler's states.
  const jabsStates = $jabsEngine.getJabsStatesByUuid(this.getUuid());

  // convert them to a proper array.
  const states = Array.from(jabsStates.values());

  return states
    .filter(state =>
    {
      // require a shield model to be present.
      if (!state.shield)
      {
        return false;
      }

      // require the shield to not be broken.
      if (state.shield.isBroken())
      {
        return false;
      }

      // include this state in the results.
      return true;
    })
    .sort((a, b) =>
    {
      // destructure the shields for access.
      const aShield = a.shield;
      const bShield = b.shield;

      // compare priorities numerically, higher first.
      const aPri = aShield.getPriority() || 0;
      const bPri = bShield.getPriority() || 0;
      if (aPri !== bPri)
      {
        // dESC.
        return bPri - aPri;
      }

      // tie-breaker: FIFO by appliedAt (earlier first).
      // aSC.
      return aShield.getAppliedAt() - bShield.getAppliedAt();
    });
};

/**
 * Gets the highest priority shield state currently applied to this battler, or null if there are no shields.
 * @returns {JABS_State|null}
 */
Game_Battler.prototype.currentShieldState = function()
{
  // grab all the shield states currently applied.
  const shieldStates = this.getShieldStates();

  // if there are no shield states, then there are no shields.
  if (shieldStates.length === 0) return null;

  // return the top priority shield's value.
  return shieldStates.at(0);
};

/**
 * Gets the highest priority shield value currently applied to this battler, or 0 if there are no shields.
 * @returns {number}
 */
Game_Battler.prototype.currentShieldValue = function()
{
  // grab all the shield states currently applied.
  const shieldState = this.currentShieldState();

  // if there are no shield states, then there are no shields.
  if (shieldState === null) return 0;

  // return the shield's value.
  return shieldState
    .shield
    .getCurrent();
};

/**
 * Gets the highest priority shield cap currently applied to this battler, or 0 if there are no shields.
 * @returns {number}
 */
Game_Battler.prototype.currentShieldCap = function()
{
  // grab all the shield states currently applied.
  const shieldState = this.currentShieldState();

  // if there are no shield states, then there are no shields.
  if (shieldState === null) return 0;

  // return the shield's value.
  return shieldState
    .shield
    .getCap();
};

/**
 * Gets the highest priority shield stacks currently applied to this battler, or 0 if there are no shields.
 * @returns {number}
 */
Game_Battler.prototype.currentShieldStacks = function()
{
  // grab all the shield states currently applied.
  const shieldState = this.currentShieldState();

  // if there are no shield states, then there are no shields.
  if (shieldState === null) return 0;

  // return the number of stacks on this shield state.
  return shieldState.stackCount;
};

/**
 * An event hook fired when a shield is broken.
 * Stores the broken shield's cap on the battler so that break skills can
 * reference it as `s` inside their damage formulas.
 * @param {number} shieldBreakValue The cap of the shield that just broke.
 */
Game_Battler.prototype.onShieldBreak = function(shieldBreakValue = 0)
{
  // store the broken shield's cap so damage formulas fired from here can use it as 's'.
  this.lastShieldBreakValue = shieldBreakValue;

  // resolve the bearer's JABS battler.
  const caster = JABS_AiManager.getBattlerByUuid(this.getUuid());

  // check if we have a valid caster.
  if (!caster)
  {
    // clear the stored value before bailing out.
    this.lastShieldBreakValue = 0;
    return;
  }

  // identify all the sources from which shield break skills can be pulled from.
  const sources = this.shieldBreakSources();

  /**
   * A reducer function to grab all the shield break skills.
   * @param {number[]} accumulator The accumulator of skill ids.
   * @param {RPG_Base} source The source from which to pull shield break skills.
   */
  const reducer = (accumulator, source) =>
  {
    // grab all the skill ids.
    const skillIds = RPGManager.getArrayFromNotesByRegex(source, J.ABS.EXT.SHIELD.RegExp.Break);

    // concat them onto the accumulation.
    return accumulator.concat(...skillIds);
  };

  // grab all the shield break skills.
  const breakSkillIds = sources.reduce(reducer, []);

  // if no skillIds were found, then we can skip processing.
  if (breakSkillIds.length === 0)
  {
    // clear the stored value so non-break actions don't see a stale 's'.
    this.lastShieldBreakValue = 0;
    return;
  }

  // trigger all skills in succession while 's' holds the shield cap.
  breakSkillIds.forEach(skillId => $jabsEngine.forceMapAction(caster, skillId, true));

  // clear the stored value after all break skills have been fired.
  this.lastShieldBreakValue = 0;
};

/**
 * Gets all the sources from which shield break skills can be pulled from.
 * @returns {[RPG_Actor|RPG_Enemy|RPG_State]}
 */
Game_Battler.prototype.shieldBreakSources = function()
{
  return [
    this.databaseData(), ...this.states(),
  ];
};
//endregion Game_Battler