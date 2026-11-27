//region plugins/_base/_component/fixtures/install-jabs-fate.js
import JABS_Fate from '../../../../../../src/plugins/abs/core/managers/JABS_Fate.js';

/**
 * Installs the real {@link JABS_Fate} as the bare global a ship that depends on J-ABS reaches for. The class imports
 * nothing and does nothing at import time, so any realm can host it: the math a consumer's test exercises is the
 * shipped math, never a copy of it. It reads `RPGManager` as a bare global at call time, so install that too.
 *
 * @param {object} [sandbox] The host-globals object to assign onto; defaults to `globalThis`.
 */
export function installJabsFate(sandbox = globalThis)
{
  sandbox.JABS_Fate = JABS_Fate;
}

/**
 * Installs J-ABS's two state-roll entries onto a realm's `Game_Action` when that realm never loads J-ABS's own
 * `Game_Action.js`- J-SkillExtend's and J-CriticalFactors' realms, for instance. All three are the same short
 * forwards J-ABS ships, so every rule they answer with still comes from the real {@link JABS_Fate}. Also installs that
 * class.
 *
 * Never call this in a realm that imports J-ABS's own `Game_Action.js`; that file already defines all three.
 *
 * @param {object} [sandbox] The host-globals object whose `Game_Action` receives the entries; defaults to `globalThis`.
 */
export function installJabsFateActionForwards(sandbox = globalThis)
{
  installJabsFate(sandbox);

  const actionPrototype = sandbox.Game_Action.prototype;

  /**
   * The rolls this action brings against a target, exactly as J-ABS's own Game_Action#fateRollsAgainst answers.
   * @param {object} target The battler this action is aimed at.
   * @returns {number[]}
   */
  actionPrototype.fateRollsAgainst = function(target)
  {
    return sandbox.JABS_Fate.actionRollsAgainst(this, target);
  };

  /**
   * The battler whose fate overrides settle this action's chance rolls, exactly as J-ABS's own
   * Game_Action#chanceRollerAgainst answers: the subject. Install this before importing a plugin that aliases it.
   * @param {object} _target The battler the roll is aimed at.
   * @returns {object}
   */
  // eslint-disable-next-line no-unused-vars
  actionPrototype.chanceRollerAgainst = function(_target)
  {
    return this.subject();
  };

  /**
   * How many times a state lands on a target for this action, exactly as J-ABS's own
   * Game_Action#resolveStateProcCountAgainst answers.
   * @param {object} target The battler the state is aimed at.
   * @param {number} stateId The id of the state being applied.
   * @param {number} percent The authored chance, as a percent from 0 to 100.
   * @param {object|null} [positiveRoller] Whose fate overrides, Accumulate Mode and Encore count the landings; null
   * leaves it to chanceRollerAgainst.
   * @returns {number}
   */
  actionPrototype.resolveStateProcCountAgainst = function(target, stateId, percent, positiveRoller = null)
  {
    const roller = positiveRoller ?? this.chanceRollerAgainst(target);
    return sandbox.JABS_Fate.resolveActionStateProcCount(this, target, stateId, percent, roller);
  };
}

/**
 * Builds a plain battler stand-in carrying every primitive {@link JABS_Fate} reads, each one neutral by default: no
 * resistance, no luck gap against another default stand-in, no lucky or cursed rolls, no fate overrides, no
 * Accumulate Mode or Encore, and every state it is asked about reading as help. Override any of them by name; every
 * override replaces the member wholesale, so pass functions for the methods and a number for `luk`.
 *
 * The battler-wide rolls and the skill-scoped rolls are separate members on purpose. A test of a roll made with no
 * skill should give them different values, or it cannot tell which pair the roll read.
 *
 * @param {object} [overrides] Members to replace on the stand-in.
 * @returns {object}
 */
export function buildFateBattlerStub(overrides = {})
{
  return {
    luk: 0,
    stateRate: () => 1,
    stateTypeResistRate: () => 1,
    state: stateId => ({ id: stateId, isNegativeType: () => false }),
    getPositiveRolls: () => 0,
    getNegativeRolls: () => 0,
    getPositiveRollsForSkill: () => 0,
    getNegativeRollsForSkill: () => 0,
    isVeryLucky: () => false,
    isVeryCursed: () => false,
    isAccumulating: () => false,
    getEncoreRepeats: () => 0,
    ...overrides,
  };
}
//endregion plugins/_base/_component/fixtures/install-jabs-fate.js
