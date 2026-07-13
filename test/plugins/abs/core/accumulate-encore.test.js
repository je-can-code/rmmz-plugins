//region plugins/abs/core/accumulate-encore.test.js
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  installAbsHostGlobals,
  setPluginContextToJAbs,
  setPluginContextToJBase,
} from '../fixtures/install-abs-host-globals.js';

/**
 * Builds a minimal note-source stub carrying the given tag string, backed by the real
 * RPG_Skill prototype so formula/boolean tags parse for real.
 * @param {string} note
 * @returns {object}
 */
function buildNoteRow(note)
{
  const row = Object.create(globalThis.RPG_Skill.prototype);
  row.id = 1;
  row.note = note;
  row.meta = {};
  row._original = function() { return this; };
  return row;
}

describe('Accumulate Mode / Encore (direct src import)', () =>
{
  let RPGManager;

  beforeAll(async () =>
  {
    vi.resetModules();

    installAbsHostGlobals();

    setPluginContextToJBase();
    await import('../../../../src/plugins/_base/_metadata/initialization.js');

    ({ default: RPGManager } = await import('../../../../src/plugins/_base/managers/RPGManager.js'));
    globalThis.RPGManager = RPGManager;

    ({ default: globalThis.RPG_Skill } = await import('../../../../src/plugins/_base/database/implementations/RPG_Skill.js'));
    ({ default: globalThis.JABS_OnChanceEffect } = await import('../../../../src/plugins/abs/core/models/JABS_OnChanceEffect.js'));

    // real production code- sets up J.ABS.RegExp.Accumulate/EncoreRepeats and J.ABS.Metadata.
    setPluginContextToJAbs();
    await import('../../../../src/plugins/abs/core/_metadata/initialization.js');

    // patches globalThis.Game_Battler.prototype directly, no vm involved.
    await import('../../../../src/plugins/abs/core/objects/Game_Battler.js');

    // patches globalThis.Game_Action.prototype directly, no vm involved.
    await import('../../../../src/plugins/abs/core/objects/Game_Action.js');
  });

  afterAll(() =>
  {
    globalThis.RPGManager.clearCache();
  });

  beforeEach(() =>
  {
    globalThis.RPGManager.clearCache();
  });

  describe('Game_Battler.isAccumulating', () =>
  {
    function buildBattler(notes = [])
    {
      return {
        getLevel: () => 1,
        getAllNotes: () => notes,
        isAccumulating: globalThis.Game_Battler.prototype.isAccumulating,
      };
    }

    it('is true when a note source carries <accumulate>', () =>
    {
      // Arrange
      const battler = buildBattler([ buildNoteRow('<accumulate>') ]);

      // Act
      const result = battler.isAccumulating();

      // Assert
      expect(result).toBe(true);
    });

    it('is false when no note source carries <accumulate>', () =>
    {
      // Arrange
      const battler = buildBattler([ buildNoteRow('<knockback:4>') ]);

      // Act
      const result = battler.isAccumulating();

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('Game_Battler.getEncoreRepeats / refreshEncoreRepeats', () =>
  {
    function buildBattler(notes = [])
    {
      return {
        getLevel: () => 1,
        getAllNotes: () => notes,
        refreshEncoreRepeats: globalThis.Game_Battler.prototype.refreshEncoreRepeats,
        setEncoreRepeats: globalThis.Game_Battler.prototype.setEncoreRepeats,
        getEncoreRepeats: globalThis.Game_Battler.prototype.getEncoreRepeats,
        _j: { _abs: { _encoreRepeats: 0 } },
      };
    }

    it('defaults to 0 before any refresh has run', () =>
    {
      // Arrange
      const battler = buildBattler([
        buildNoteRow('<encoreRepeats:[1]>'),
        buildNoteRow('<encoreRepeats:[2]>'),
      ]);

      // Act
      const result = battler.getEncoreRepeats();

      // Assert
      expect(result).toBe(0);
    });

    it('sums <encoreRepeats:[FORMULA]> across note sources after a refresh', () =>
    {
      // Arrange
      const battler = buildBattler([
        buildNoteRow('<encoreRepeats:[1]>'),
        buildNoteRow('<encoreRepeats:[2]>'),
      ]);

      // Act
      battler.refreshEncoreRepeats();

      // Assert
      expect(battler.getEncoreRepeats()).toBe(3);
    });
  });

  describe('RPGManager.countSuccessesIn100', () =>
  {
    it('never counts a success at 0% chance, regardless of attempts', () =>
    {
      // Arrange
      const percentOfSuccess = 0;
      const attempts = 10;

      // Act
      const result = RPGManager.countSuccessesIn100(percentOfSuccess, attempts);

      // Assert
      expect(result).toBe(0);
    });

    it('counts every attempt as a success at 100% chance', () =>
    {
      // Arrange
      const percentOfSuccess = 100;
      const attempts = 5;

      // Act
      const result = RPGManager.countSuccessesIn100(percentOfSuccess, attempts);

      // Assert
      expect(result).toBe(5);
    });
  });

  describe('RPGManager.countSuccessesFateOf100', () =>
  {
    it('counts every attempt as a success when very lucky, even at 0% chance', () =>
    {
      // Arrange
      const roller = { isVeryLucky: () => true, isVeryCursed: () => false };

      // Act
      const result = RPGManager.countSuccessesFateOf100(roller, 0, 7);

      // Assert
      expect(result).toBe(7);
    });

    it('counts zero successes when very cursed, even at 100% chance', () =>
    {
      // Arrange
      const roller = { isVeryLucky: () => false, isVeryCursed: () => true };

      // Act
      const result = RPGManager.countSuccessesFateOf100(roller, 100, 7);

      // Assert
      expect(result).toBe(0);
    });
  });

  describe('RPGManager.resolveProcCount', () =>
  {
    function buildRoller(overrides = {})
    {
      return {
        isVeryLucky: () => false,
        isVeryCursed: () => false,
        isAccumulating: () => false,
        getEncoreRepeats: () => 0,
        ...overrides,
      };
    }

    it('is 0 at 0% chance with no fate override', () =>
    {
      // Arrange
      const roller = buildRoller();

      // Act
      const result = RPGManager.resolveProcCount(roller, 0, 1, 0);

      // Assert
      expect(result).toBe(0);
    });

    it('is 1 at 100% chance with no encore', () =>
    {
      // Arrange
      const roller = buildRoller();

      // Act
      const result = RPGManager.resolveProcCount(roller, 100, 1, 0);

      // Assert
      expect(result).toBe(1);
    });

    it('doubles the single success when encoreRepeats is 1', () =>
    {
      // Arrange
      const roller = buildRoller({ getEncoreRepeats: () => 1 });

      // Act
      const result = RPGManager.resolveProcCount(roller, 100, 1, 0);

      // Assert
      expect(result).toBe(2);
    });

    it('is 0 even with encore when the roll fails outright', () =>
    {
      // Arrange
      const roller = buildRoller({ getEncoreRepeats: () => 1 });

      // Act
      const result = RPGManager.resolveProcCount(roller, 0, 1, 0);

      // Assert
      expect(result).toBe(0);
    });

    it('multiplies Accumulate Mode\'s success count by (1 + encoreRepeats)', () =>
    {
      // Arrange- 100% chance, 3 attempts -> 3 successes, each echoed once -> 6.
      const roller = buildRoller({ isAccumulating: () => true, getEncoreRepeats: () => 1 });

      // Act
      const result = RPGManager.resolveProcCount(roller, 100, 3, 0);

      // Assert
      expect(result).toBe(6);
    });

    it('very lucky short-circuits to guaranteed success before encore multiplies it', () =>
    {
      // Arrange- guaranteed success (1) * (1 + 2 encore) = 3.
      const roller = buildRoller({ isVeryLucky: () => true, getEncoreRepeats: () => 2 });

      // Act
      const result = RPGManager.resolveProcCount(roller, 0, 1, 0);

      // Assert
      expect(result).toBe(3);
    });
  });

  describe('JABS_OnChanceEffect.resolveProcCount', () =>
  {
    it('delegates to RPGManager.resolveProcCount when a positiveRoller is provided', () =>
    {
      // Arrange- 100% chance, encore 1 -> 2 executions.
      const effect = new globalThis.JABS_OnChanceEffect(1, 100, 'test-key');
      const roller = {
        isVeryLucky: () => false,
        isVeryCursed: () => false,
        isAccumulating: () => false,
        getEncoreRepeats: () => 1,
      };

      // Act
      const result = effect.resolveProcCount(1, 0, roller);

      // Assert
      expect(result).toBe(2);
    });

    it('falls back to a plain boolean-as-count roll with no positiveRoller', () =>
    {
      // Arrange
      const effect = new globalThis.JABS_OnChanceEffect(1, 100, 'test-key');

      // Act
      const result = effect.resolveProcCount(1, 0);

      // Assert
      expect(result).toBe(1);
    });
  });

  describe('Game_Action.handleApplyState (loop site end-to-end)', () =>
  {
    /** @type {Function} */
    let originalResolveProcCount;

    beforeEach(() =>
    {
      originalResolveProcCount = globalThis.RPGManager.resolveProcCount;
    });

    afterEach(() =>
    {
      globalThis.RPGManager.resolveProcCount = originalResolveProcCount;
    });

    function buildAction(attacker)
    {
      const action = Object.create(globalThis.Game_Action.prototype);
      action.subject = () => attacker;
      action.item = () => ({});
      action.shouldTargetApplyResistances = () => false;
      action.lukEffectRate = () => 1;
      action.makeSuccess = () => {};
      return action;
    }

    it('applies the state once per resolved proc count', () =>
    {
      // Arrange
      globalThis.RPGManager.resolveProcCount = () => 3;
      const target = { __calls: [] };
      target.addState = function(stateId, attacker)
      {
        this.__calls.push({ stateId, attacker });
      };
      target.getNegativeRolls = () => 0;
      const attacker = { getPositiveRollsForSkill: () => 0 };
      const action = buildAction(attacker);

      // Act
      action.handleApplyState(target, 5, 1.0, false);

      // Assert
      expect(target.__calls).toEqual([
        { stateId: 5, attacker },
        { stateId: 5, attacker },
        { stateId: 5, attacker },
      ]);
    });

    it('does not apply the state at all when the proc count is 0', () =>
    {
      // Arrange
      globalThis.RPGManager.resolveProcCount = () => 0;
      const target = { addState: () => { throw new Error('should not be called'); } };
      target.getNegativeRolls = () => 0;
      const attacker = { getPositiveRollsForSkill: () => 0 };
      const action = buildAction(attacker);

      // Act
      const act = () => action.handleApplyState(target, 5, 1.0, false);

      // Assert
      expect(act).not.toThrow();
    });
  });
});
//endregion plugins/abs/core/accumulate-encore.test.js
