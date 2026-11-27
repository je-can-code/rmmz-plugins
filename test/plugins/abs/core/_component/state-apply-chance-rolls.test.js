//region plugins/abs/core/_component/state-apply-chance-rolls.test.js
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  installAbsHostGlobals,
  setPluginContextToJAbs,
  setPluginContextToJBase,
} from '../../_component/fixtures/install-abs-host-globals.js';

/**
 * Builds a minimal caster stand-in exposing only its LUK, its own rolls and the flags its count reads.
 * @param {number} positiveRolls
 * @returns {object}
 */
function buildCaster(positiveRolls = 0)
{
  return {
    luk: 0,
    getPositiveRollsForSkill: () => positiveRolls,
    getNegativeRollsForSkill: () => 0,
    isVeryLucky: () => false,
    isVeryCursed: () => false,
    isAccumulating: () => false,
    getEncoreRepeats: () => 0,
  };
}

/**
 * Builds a minimal target stand-in exposing only what these two effects touch. Every state reads as a blessing
 * unless the overrides say harm.
 * @param {object} [overrides]
 * @returns {object}
 */
function buildTarget(overrides = {})
{
  return {
    luk: 0,
    getNegativeRolls: () => overrides.negativeRolls ?? 0,
    stateRate: () => overrides.stateRate ?? 1,
    stateTypeResistRate: () => overrides.stateTypeResistRate ?? 1,
    state: () => ({ isNegativeType: () => overrides.isHarm ?? false, isImmuneToFate: () => overrides.isImmuneToFate ?? false }),
    removeState: () => {},
  };
}

/**
 * Builds a minimal Game_Action stub, borrowing the real resolveApplyStateProcCount/itemEffectRemoveState
 * straight off the real prototype.
 * @param {object} [overrides]
 * @returns {object}
 */
function buildAction(overrides = {})
{
  const action = Object.create(globalThis.Game_Action.prototype);
  const subject = overrides.attacker ?? buildCaster();
  action.subject = () => subject;
  action.item = () => ({});
  action.makeSuccess = () => {};
  action.isForOpponent = () => true;
  return action;
}

/**
 * Stubs the fate an action brings against one target, so a roll site can be seen forwarding it untouched.
 * Any other target gets an empty pair, so a site asking about the wrong battler shows up as zeros.
 * @param {object} action The action whose fate is stubbed.
 * @param {object} aimedAt The only target the stubbed fate answers for.
 * @param {number[]} rolls The positive and negative rolls to answer with.
 */
function stubFateRollsAgainst(action, aimedAt, rolls)
{
  action.fateRollsAgainst = target => (target === aimedAt ? rolls : [ 0, 0 ]);
}

/**
 * Stubs RPGManager.chanceIn100 to record every argument and return a fixed outcome.
 * @param {boolean} outcome
 * @returns {{percent: number, rollForPositive: number, rollForNegative: number}[]}
 */
function stubChanceIn100(outcome)
{
  const calls = [];
  globalThis.RPGManager.chanceIn100 = function(percent, rollForPositive, rollForNegative)
  {
    calls.push({ percent, rollForPositive, rollForNegative });
    return outcome;
  };
  return calls;
}

describe('J-ABS state application/removal roll threading (direct src import)', () =>
{
  /** @type {Function} */
  let originalChanceIn100;

  beforeAll(async () =>
  {
    vi.resetModules();

    installAbsHostGlobals();

    setPluginContextToJBase();
    await import('../../../../../src/plugins/_base/core/_metadata/initialization.js');

    ({ default: globalThis.RPGManager } = await import('../../../../../src/plugins/_base/core/managers/RPGManager.js'));

    setPluginContextToJAbs();
    await import('../../../../../src/plugins/abs/core/_metadata/initialization.js');

    // patches globalThis.Game_Action.prototype directly, no vm involved.
    await import('../../../../../src/plugins/abs/core/objects/Game_Action.js');
  });

  beforeEach(() =>
  {
    originalChanceIn100 = globalThis.RPGManager.chanceIn100;
  });

  afterEach(() =>
  {
    globalThis.RPGManager.chanceIn100 = originalChanceIn100;
  });

  describe('resolveApplyStateProcCount', () =>
  {
    it('rolls with the fate the action brings against the target it is aimed at', () =>
    {
      // Arrange
      const calls = stubChanceIn100(true);
      const action = buildAction();
      const target = buildTarget();
      stubFateRollsAgainst(action, target, [ 5, 2 ]);

      // Act
      action.resolveApplyStateProcCount(target, 5, 1.0, false);

      // Assert
      expect(calls[0].rollForPositive).toBe(5);
      expect(calls[0].rollForNegative).toBe(2);
    });

    it('rolls the computed d100 chance', () =>
    {
      // Arrange- 0.4 base, as 40%, x 0.5 stateRate x 1 stateTypeResist x 1 luk = 20.
      const calls = stubChanceIn100(true);
      const action = buildAction();

      // Act
      action.resolveApplyStateProcCount(buildTarget({ stateRate: 0.5 }), 5, 0.4, false);

      // Assert
      expect(calls[0].percent).toBe(20);
    });
  });

  describe('itemEffectRemoveState', () =>
  {
    it('rolls with the fate the action brings against the target it is aimed at', () =>
    {
      // Arrange
      const calls = stubChanceIn100(true);
      const action = buildAction();
      const target = buildTarget();
      stubFateRollsAgainst(action, target, [ 3, 6 ]);

      // Act
      action.itemEffectRemoveState(target, { value1: 1.0, dataId: 5 });

      // Assert
      expect(calls[0].rollForPositive).toBe(3);
      expect(calls[0].rollForNegative).toBe(6);
    });

    it('converts the fractional value1 into a d100 roll', () =>
    {
      // Arrange
      const calls = stubChanceIn100(true);
      const action = buildAction();
      const target = buildTarget();

      // Act
      action.itemEffectRemoveState(target, { value1: 0.75, dataId: 5 });

      // Assert
      expect(calls[0].percent).toBe(75);
    });

    it('takes a state immune to fate off on one plain roll, never asking for this action\'s fate', () =>
    {
      // Arrange- the action's fate would answer, and must not be asked.
      const calls = stubChanceIn100(true);
      const action = buildAction();
      const target = buildTarget({ isImmuneToFate: true });
      target.removeState = vi.fn();
      action.fateRollsAgainst = vi.fn(() => [ 9, 9 ]);

      // Act
      action.itemEffectRemoveState(target, { value1: 0.3, dataId: 5 });

      // Assert
      expect(calls).toEqual([ { percent: 30, rollForPositive: undefined, rollForNegative: undefined } ]);
      expect(action.fateRollsAgainst).not.toHaveBeenCalled();
      expect(target.removeState).toHaveBeenCalledWith(5);
    });

    it('lets the roller chanceRollerAgainst names for the target settle the roll', () =>
    {
      // Arrange- a very lucky stand-in for this target only; with the dice failing, only its override can land it.
      stubChanceIn100(false);
      const action = buildAction();
      const target = buildTarget();
      target.removeState = vi.fn();
      const standIn = { isVeryLucky: () => true, isVeryCursed: () => false };
      action.chanceRollerAgainst = aimedAt => (aimedAt === target ? standIn : action.subject());

      // Act
      action.itemEffectRemoveState(target, { value1: 0.1, dataId: 5 });

      // Assert
      expect(target.removeState).toHaveBeenCalledWith(5);
    });

    it('removes the state only when the roll succeeds', () =>
    {
      // Arrange
      stubChanceIn100(false);
      const action = buildAction();
      const target = buildTarget();
      target.removeState = () => { throw new Error('should not be called on a failed roll'); };

      // Act
      const act = () => action.itemEffectRemoveState(target, { value1: 1.0, dataId: 5 });

      // Assert
      expect(act).not.toThrow();
    });
  });
});
//endregion plugins/abs/core/_component/state-apply-chance-rolls.test.js
