//region plugins/extend/game-action-state-roll-threading.test.js
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { loadSkillExtendPluginVm } from './extend-vm.js';
import { clearRpgManagerCacheInVm } from '../../setup/shipped-plugin-vm.js';

describe('J-SkillExtend Game_Action state roll threading (out/extend/J-SkillExtend.js)', () =>
{
  /** @type {object} */
  let sandbox;

  beforeAll(() =>
  {
    sandbox = { console };
    loadSkillExtendPluginVm(sandbox);
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
   * Builds a minimal Game_Action stub exposing the four state-effect methods under test.
   * @param {object} attacker
   * @returns {object}
   */
  function buildAction(attacker)
  {
    const action = Object.create(sandbox.Game_Action.prototype);
    action.subject = () => attacker;
    action.loseState = () => {};
    action.stripState = () => {};
    return action;
  }

  /**
   * Builds a minimal target stand-in with controllable negative rolls.
   * @param {number} negativeRolls
   * @returns {object}
   */
  function buildTarget(negativeRolls = 0)
  {
    return {
      addState: () => {},
      removeState: () => {},
      getNegativeRolls: () => negativeRolls,
    };
  }

  const attacker = {
    getPositiveRollsForSkill: () => 3,
    isVeryLucky: () => false,
    isVeryCursed: () => false,
    isAccumulating: () => false,
    getEncoreRepeats: () => 0,
  };

  it('applyStates: attacker positive (+1 baseline), target negative', () =>
  {
    const effect = buildEffect();
    const action = buildAction(attacker);

    action.applyStates(buildTarget(2), [ effect ]);

    expect(effect.__calls).toEqual([ { rollForPositive: 4, rollForNegative: 2 } ]);
  });

  it('loseStates: attacker positive (+1 baseline), target negative', () =>
  {
    const effect = buildEffect();
    const action = buildAction(attacker);

    action.loseStates(buildTarget(1), [ effect ]);

    expect(effect.__calls).toEqual([ { rollForPositive: 4, rollForNegative: 1 } ]);
  });

  it('stripStates: attacker positive (+1 baseline), target negative', () =>
  {
    const effect = buildEffect();
    const action = buildAction(attacker);

    action.stripStates(buildTarget(5), [ effect ]);

    expect(effect.__calls).toEqual([ { rollForPositive: 4, rollForNegative: 5 } ]);
  });

  it('removeStates: attacker positive (+1 baseline), target negative', () =>
  {
    const effect = buildEffect();
    const action = buildAction(attacker);

    action.removeStates(buildTarget(0), [ effect ]);

    expect(effect.__calls).toEqual([ { rollForPositive: 4, rollForNegative: 0 } ]);
  });
});
//endregion plugins/extend/game-action-state-roll-threading.test.js
