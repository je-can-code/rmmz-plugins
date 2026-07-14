//region plugins/extend/game-action-state-roll-threading.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { installExtendHostGlobals, setPluginContextToJBase, setPluginContextToJExtend } from './fixtures/install-extend-host-globals.js';

describe('J-SkillExtend Game_Action state roll threading (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installExtendHostGlobals();

    setPluginContextToJBase();
    await import('../../../src/plugins/_base/_metadata/initialization.js');

    ({ default: globalThis.RPGManager } = await import('../../../src/plugins/_base/managers/RPGManager.js'));
    ({ default: globalThis.JCache } = await import('../../../src/plugins/_base/core/JCache.js'));

    setPluginContextToJExtend();
    await import('../../../src/plugins/extend/core/_metadata/initialization.js');

    // patches globalThis.Game_Action.prototype directly, no vm involved.
    await import('../../../src/plugins/extend/core/objects/Game_Action.js');
  });

  beforeEach(() =>
  {
    globalThis.RPGManager.clearCache();
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
    const action = Object.create(globalThis.Game_Action.prototype);
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
    // Arrange
    const effect = buildEffect();
    const action = buildAction(attacker);

    // Act
    action.applyStates(buildTarget(2), [ effect ]);

    // Assert
    expect(effect.__calls).toEqual([ { rollForPositive: 4, rollForNegative: 2 } ]);
  });

  it('loseStates: attacker positive (+1 baseline), target negative', () =>
  {
    // Arrange
    const effect = buildEffect();
    const action = buildAction(attacker);

    // Act
    action.loseStates(buildTarget(1), [ effect ]);

    // Assert
    expect(effect.__calls).toEqual([ { rollForPositive: 4, rollForNegative: 1 } ]);
  });

  it('stripStates: attacker positive (+1 baseline), target negative', () =>
  {
    // Arrange
    const effect = buildEffect();
    const action = buildAction(attacker);

    // Act
    action.stripStates(buildTarget(5), [ effect ]);

    // Assert
    expect(effect.__calls).toEqual([ { rollForPositive: 4, rollForNegative: 5 } ]);
  });

  it('removeStates: attacker positive (+1 baseline), target negative', () =>
  {
    // Arrange
    const effect = buildEffect();
    const action = buildAction(attacker);

    // Act
    action.removeStates(buildTarget(0), [ effect ]);

    // Assert
    expect(effect.__calls).toEqual([ { rollForPositive: 4, rollForNegative: 0 } ]);
  });
});
//endregion plugins/extend/game-action-state-roll-threading.test.js
