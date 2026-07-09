//region plugins/abs/core/on-chance-roll-threading.test.js
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { clearRpgManagerCacheInVm } from '../../../setup/shipped-plugin-vm.js';
import { loadAbsPluginVm } from '../abs-vm.js';

describe('J-ABS on-chance-effect roll threading (out/abs/J-ABS.js)', () =>
{
  /** @type {object} */
  let sandbox;

  /** @type {Function} */
  let originalChanceIn100;

  beforeAll(() =>
  {
    sandbox = { console };
    loadAbsPluginVm(sandbox);
  });

  afterAll(() =>
  {
    sandbox = null;
  });

  beforeEach(() =>
  {
    clearRpgManagerCacheInVm(sandbox);
    originalChanceIn100 = sandbox.RPGManager.chanceIn100;
    sandbox.$jabsEngine = sandbox.$jabsEngine || {};
    sandbox.$jabsEngine.__forceMapActionCalls = [];
    sandbox.$jabsEngine.forceMapAction = function(caster, skillId, isRetaliation, targetX, targetY)
    {
      sandbox.$jabsEngine.__forceMapActionCalls.push({ skillId, targetX, targetY });
    };
  });

  afterEach(() =>
  {
    sandbox.RPGManager.chanceIn100 = originalChanceIn100;
  });

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

  describe('Game_Battler.processOnEvadeStateSelf', () =>
  {
    it('the evader is both the positive and negative roller', () =>
    {
      const effect = buildEffect();
      const evader = {
        getPositiveRollsForSkill: () => 3,
        getNegativeRollsForSkill: () => 2,
        onEvadeApplySelfEffects: () => [ effect ],
        addState: () => {},
        processOnEvadeStateSelf: sandbox.Game_Battler.prototype.processOnEvadeStateSelf,
      };

      evader.processOnEvadeStateSelf();

      expect(effect.__calls).toEqual([ { rollForPositive: 4, rollForNegative: 2 } ]);
    });
  });

  describe('Game_Battler.processOnEvadeStateAttacker', () =>
  {
    it('the evader rolls positive, the punished attacker rolls negative', () =>
    {
      const effect = buildEffect();
      const evader = {
        getPositiveRollsForSkill: () => 1,
        onEvadeApplyAttackerEffects: () => [ effect ],
        processOnEvadeStateAttacker: sandbox.Game_Battler.prototype.processOnEvadeStateAttacker,
      };
      const attacker = {
        getNegativeRolls: () => 5,
        addState: () => {},
      };

      evader.processOnEvadeStateAttacker(attacker);

      expect(effect.__calls).toEqual([ { rollForPositive: 2, rollForNegative: 5 } ]);
    });
  });

  describe('JABS_Battler.handleOnEvadeSkills', () =>
  {
    it('the evader is both the roller and the recipient of the trigger roll', () =>
    {
      const effect = buildEffect(42);
      const gameBattler = {
        onEvadeExecuteEffects: () => [ effect ],
        getPositiveRollsForSkill: () => 2,
        getNegativeRollsForSkill: () => 1,
      };
      const evader = {
        getBattler: () => gameBattler,
        handleOnEvadeSkills: sandbox.JABS_Battler.prototype.handleOnEvadeSkills,
      };

      evader.handleOnEvadeSkills(null);

      expect(effect.__calls).toEqual([ { rollForPositive: 3, rollForNegative: 1 } ]);
      expect(sandbox.$jabsEngine.__forceMapActionCalls).toEqual([
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
        executeRetaliationSkills: sandbox.JABS_Engine.prototype.executeRetaliationSkills,
        canExecuteMapActions: () => false,
        executeMapActions: () => {},
      };
    }

    it('the retaliator is both the roller and the recipient of the "do I retaliate" roll', () =>
    {
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

      buildEngine().executeRetaliationSkills(retaliator, [ effect ], triggeringAction);

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
        handleAutoCounter: sandbox.JABS_Engine.prototype.handleAutoCounter,
        canAutoCounter: () => true,
        doAutoCounter: () => {},
      };
    }

    it('feeds the counter-user\'s own positive and negative rolls into the same roll', () =>
    {
      const calls = [];
      sandbox.RPGManager.chanceIn100 = function(percent, rollForPositive, rollForNegative)
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

      sandbox.JABS_Button = sandbox.JABS_Button || { Offhand: 'offhand' };

      buildEngine().handleAutoCounter(battler);

      expect(calls).toEqual([ { percent: 10, rollForPositive: 3, rollForNegative: 1 } ]);
    });
  });
});
//endregion plugins/abs/core/on-chance-roll-threading.test.js
