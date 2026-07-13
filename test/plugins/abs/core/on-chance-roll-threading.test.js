//region plugins/abs/core/on-chance-roll-threading.test.js
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  installAbsHostGlobals,
  setPluginContextToJAbs,
  setPluginContextToJBase,
} from '../fixtures/install-abs-host-globals.js';

/**
 * Builds a duck-typed JABS_OnChanceEffect stand-in that records the roll arguments it was
 * called with and always reports success.
 * @param {number} [skillId]
 * @returns {object}
 */
function buildEffect(skillId = 1)
{
  const calls = [];
  return {
    skillId,
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

describe('J-ABS on-chance-effect roll threading (direct src import)', () =>
{
  /** @type {Function} */
  let originalChanceIn100;

  beforeAll(async () =>
  {
    vi.resetModules();

    installAbsHostGlobals();

    setPluginContextToJBase();
    await import('../../../../src/plugins/_base/_metadata/initialization.js');

    ({ default: globalThis.RPGManager } = await import('../../../../src/plugins/_base/managers/RPGManager.js'));
    await import('../../../../src/plugins/_base/objects/Game_BattlerBase.js');
    await import('../../../../src/plugins/_base/objects/Game_Battler.js');

    setPluginContextToJAbs();
    await import('../../../../src/plugins/abs/core/_metadata/initialization.js');

    // patches globalThis.Game_Battler.prototype directly, no vm involved.
    await import('../../../../src/plugins/abs/core/objects/Game_Battler.js');

    // real classes, not prototype patches.
    ({ default: globalThis.JABS_Battler } = await import('../../../../src/plugins/abs/core/models/JABS_Battler.js'));
    ({ default: globalThis.JABS_Engine } = await import('../../../../src/plugins/abs/core/managers/JABS_Engine.js'));
    ({ default: globalThis.JABS_Button } = await import('../../../../src/plugins/abs/ext/input/_models/JABS_Button.js'));
  });

  beforeEach(() =>
  {
    originalChanceIn100 = globalThis.RPGManager.chanceIn100;
    globalThis.$jabsEngine = globalThis.$jabsEngine || {};
    globalThis.$jabsEngine.__forceMapActionCalls = [];
    globalThis.$jabsEngine.forceMapAction = function(caster, skillId, isRetaliation, targetX, targetY)
    {
      globalThis.$jabsEngine.__forceMapActionCalls.push({ skillId, targetX, targetY });
    };
  });

  afterEach(() =>
  {
    globalThis.RPGManager.chanceIn100 = originalChanceIn100;
  });

  describe('Game_Battler.processOnEvadeStateSelf', () =>
  {
    it('the evader is both the positive and negative roller', () =>
    {
      // Arrange
      const effect = buildEffect();
      const evader = {
        getPositiveRollsForSkill: () => 3,
        getNegativeRollsForSkill: () => 2,
        onEvadeApplySelfEffects: () => [ effect ],
        addState: () => {},
        processOnEvadeStateSelf: globalThis.Game_Battler.prototype.processOnEvadeStateSelf,
      };

      // Act
      evader.processOnEvadeStateSelf();

      // Assert
      expect(effect.__calls).toEqual([ { rollForPositive: 4, rollForNegative: 2 } ]);
    });
  });

  describe('Game_Battler.processOnEvadeStateAttacker', () =>
  {
    it('the evader rolls positive, the punished attacker rolls negative', () =>
    {
      // Arrange
      const effect = buildEffect();
      const evader = {
        getPositiveRollsForSkill: () => 1,
        onEvadeApplyAttackerEffects: () => [ effect ],
        processOnEvadeStateAttacker: globalThis.Game_Battler.prototype.processOnEvadeStateAttacker,
      };
      const attacker = {
        getNegativeRolls: () => 5,
        addState: () => {},
      };

      // Act
      evader.processOnEvadeStateAttacker(attacker);

      // Assert
      expect(effect.__calls).toEqual([ { rollForPositive: 2, rollForNegative: 5 } ]);
    });
  });

  describe('JABS_Battler.handleOnEvadeSkills', () =>
  {
    it('the evader is both the roller and the recipient of the trigger roll', () =>
    {
      // Arrange
      const effect = buildEffect(42);
      const gameBattler = {
        onEvadeExecuteEffects: () => [ effect ],
        getPositiveRollsForSkill: () => 2,
        getNegativeRollsForSkill: () => 1,
      };
      const evader = {
        getBattler: () => gameBattler,
        handleOnEvadeSkills: globalThis.JABS_Battler.prototype.handleOnEvadeSkills,
      };

      // Act
      evader.handleOnEvadeSkills(null);

      // Assert
      expect(effect.__calls).toEqual([ { rollForPositive: 3, rollForNegative: 1 } ]);
      expect(globalThis.$jabsEngine.__forceMapActionCalls).toEqual([
        { skillId: 42, targetX: undefined, targetY: undefined },
      ]);
    });
  });

  describe('JABS_Engine.executeRetaliationSkills', () =>
  {
    /**
     * Builds a duck-typed "engine" exposing only the method under test.
     * @returns {object}
     */
    function buildEngine()
    {
      return {
        executeRetaliationSkills: globalThis.JABS_Engine.prototype.executeRetaliationSkills,
        canExecuteMapActions: () => false,
        executeMapActions: () => {},
      };
    }

    it('the retaliator is both the roller and the recipient of the "do I retaliate" roll', () =>
    {
      // Arrange
      const effect = buildEffect(7);
      effect.matchesHitType = () => true;
      const gameBattler = {
        result: () => ({ hpDamage: 0, mpDamage: 0, tpDamage: 0 }),
        getPositiveRollsForSkill: () => 4,
        getNegativeRollsForSkill: () => 0,
      };
      const retaliator = {
        getBattler: () => gameBattler,
        createJabsActionFromSkill: () => [],
        distanceToDesignatedTarget: () => 0,
      };
      const triggeringAction = {
        getBaseSkill: () => ({ hitType: null }),
        getCaster: () => ({ getX: () => 0, getY: () => 0 }),
      };

      // Act
      buildEngine().executeRetaliationSkills(retaliator, [ effect ], triggeringAction);

      // Assert
      expect(effect.__calls).toEqual([ { rollForPositive: 5, rollForNegative: 0 } ]);
    });
  });

  describe('JABS_Engine.handleAutoCounter', () =>
  {
    /**
     * Builds a duck-typed "engine" exposing only what handleAutoCounter touches.
     * @returns {object}
     */
    function buildEngine()
    {
      return {
        handleAutoCounter: globalThis.JABS_Engine.prototype.handleAutoCounter,
        canAutoCounter: () => true,
        doAutoCounter: () => {},
      };
    }

    it('feeds the counter-user\'s own positive and negative rolls into the same roll', () =>
    {
      // Arrange
      const calls = [];
      globalThis.RPGManager.chanceIn100 = function(percent, rollForPositive, rollForNegative)
      {
        calls.push({ percent, rollForPositive, rollForNegative });
        return true;
      };
      const gameBattler = {
        cnt: 0.1,
        getPositiveRolls: () => 2,
        getNegativeRolls: () => 1,
        isVeryLucky: () => false,
        isVeryCursed: () => false,
      };
      const battler = { getBattler: () => gameBattler };

      // Act
      buildEngine().handleAutoCounter(battler);

      // Assert
      expect(calls).toEqual([ { percent: 10, rollForPositive: 3, rollForNegative: 1 } ]);
    });
  });
});
//endregion plugins/abs/core/on-chance-roll-threading.test.js
