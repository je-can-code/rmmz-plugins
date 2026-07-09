//region plugins/crit/crit-state-roll-threading.test.js
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { loadCriticalFactorsPluginVm } from './crit-vm.js';
import { clearRpgManagerCacheInVm } from '../../setup/shipped-plugin-vm.js';

describe('J-CriticalFactors rollAndApplyCritStates roll threading (out/crit/J-CriticalFactors.js)', () =>
{
  /** @type {object} */
  let sandbox;

  beforeAll(() =>
  {
    sandbox = { console };
    loadCriticalFactorsPluginVm(sandbox);
  });

  afterAll(() =>
  {
    sandbox = null;
  });

  beforeEach(() =>
  {
    clearRpgManagerCacheInVm(sandbox);
  });

  /**
   * Builds a duck-typed JABS_OnChanceEffect stand-in that records the roll arguments it was
   * called with and always reports success.
   * @returns {object}
   */
  function buildEffect()
  {
    const calls = [];
    return {
      skillId: 1,
      baseSkill: () => ({ note: '' }),
      shouldTrigger(rollForPositive, rollForNegative)
      {
        calls.push({ rollForPositive, rollForNegative });
        return true;
      },
      resolveProcCount(rollForPositive, rollForNegative)
      {
        calls.push({ rollForPositive, rollForNegative });
        return 1;
      },
      __calls: calls,
    };
  }

  /**
   * Builds a minimal Game_Action stub exposing rollAndApplyCritStates.
   * @param {object} attacker
   * @returns {object}
   */
  function buildAction(attacker)
  {
    const action = Object.create(sandbox.Game_Action.prototype);
    action.subject = () => attacker;
    return action;
  }

  it('applies to a separate recipient: attacker positive (+1 baseline), recipient negative', () =>
  {
    const effect = buildEffect();
    const attacker = { getPositiveRollsForSkill: () => 2, isForceCritProcs: () => false };
    const recipient = { addState: () => {}, getNegativeRolls: () => 4 };
    const action = buildAction(attacker);

    action.rollAndApplyCritStates(recipient, [ effect ]);

    expect(effect.__calls).toEqual([ { rollForPositive: 3, rollForNegative: 4 } ]);
  });

  it('collapses to self-both when the recipient is the attacker (self-targeting crit states)', () =>
  {
    const effect = buildEffect();
    const attacker = {
      getPositiveRollsForSkill: () => 2,
      getNegativeRolls: () => 5,
      addState: () => {},
      isForceCritProcs: () => false,
    };
    const action = buildAction(attacker);

    action.rollAndApplyCritStates(attacker, [ effect ]);

    expect(effect.__calls).toEqual([ { rollForPositive: 3, rollForNegative: 5 } ]);
  });

  it('wraps the positive-roller with a forced-success stand-in when <forceCritProcs> is set', () =>
  {
    const calls = [];
    const effect = {
      skillId: 1,
      baseSkill: () => ({ note: '' }),
      resolveProcCount(rollForPositive, rollForNegative, positiveRoller)
      {
        calls.push(positiveRoller);
        return 1;
      },
    };
    const attacker = {
      getPositiveRollsForSkill: () => 0,
      isForceCritProcs: () => true,
      isAccumulating: () => 'attacker-accumulating',
      getEncoreRepeats: () => 'attacker-encore',
    };
    const recipient = { addState: () => {}, getNegativeRolls: () => 0 };
    const action = buildAction(attacker);

    action.rollAndApplyCritStates(recipient, [ effect ]);

    const [ positiveRoller ] = calls;
    expect(positiveRoller.isVeryLucky()).toBe(true);
    expect(positiveRoller.isVeryCursed()).toBe(false);
    expect(positiveRoller.isAccumulating()).toBe('attacker-accumulating');
    expect(positiveRoller.getEncoreRepeats()).toBe('attacker-encore');
  });

  it('passes the real attacker through untouched when <forceCritProcs> is not set', () =>
  {
    const calls = [];
    const effect = {
      skillId: 1,
      baseSkill: () => ({ note: '' }),
      resolveProcCount(rollForPositive, rollForNegative, positiveRoller)
      {
        calls.push(positiveRoller);
        return 1;
      },
    };
    const attacker = { getPositiveRollsForSkill: () => 0, isForceCritProcs: () => false };
    const recipient = { addState: () => {}, getNegativeRolls: () => 0 };
    const action = buildAction(attacker);

    action.rollAndApplyCritStates(recipient, [ effect ]);

    expect(calls[0]).toBe(attacker);
  });
});
//endregion plugins/crit/crit-state-roll-threading.test.js
