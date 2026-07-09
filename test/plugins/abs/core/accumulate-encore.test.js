//region plugins/abs/core/accumulate-encore.test.js
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { clearRpgManagerCacheInVm } from '../../../setup/shipped-plugin-vm.js';
import { loadAbsPluginVm } from '../abs-vm.js';

/**
 * Builds a minimal note-source stub carrying the given tag string, backed by the real
 * RPG_Skill prototype so formula/boolean tags parse for real.
 * @param {object} sandbox
 * @param {string} note
 * @returns {object}
 */
function buildNoteRow(sandbox, note)
{
  const row = Object.create(sandbox.RPG_Skill.prototype);
  row.id = 1;
  row.note = note;
  row.meta = {};
  row._original = function() { return this; };
  return row;
}

describe('Accumulate Mode / Encore (out/abs/J-ABS.js)', () =>
{
  /** @type {object} */
  let sandbox;

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
  });

  describe('Game_Battler.isAccumulating / getEncoreRepeats', () =>
  {
    function buildBattler(notes = [])
    {
      return {
        getLevel: () => 1,
        getAllNotes: () => notes,
        isAccumulating: sandbox.Game_Battler.prototype.isAccumulating,
        refreshEncoreRepeats: sandbox.Game_Battler.prototype.refreshEncoreRepeats,
        setEncoreRepeats: sandbox.Game_Battler.prototype.setEncoreRepeats,
        getEncoreRepeats: sandbox.Game_Battler.prototype.getEncoreRepeats,
        _j: { _abs: { _encoreRepeats: 0 } },
      };
    }

    it('isAccumulating is true only when a note source carries <accumulate>', () =>
    {
      expect(buildBattler([ buildNoteRow(sandbox, '<accumulate>') ]).isAccumulating()).toBe(true);
      expect(buildBattler([ buildNoteRow(sandbox, '<knockback:4>') ]).isAccumulating()).toBe(false);
    });

    it('getEncoreRepeats sums <encoreRepeats:[FORMULA]> across note sources after a refresh', () => {
      const battler = buildBattler([
        buildNoteRow(sandbox, '<encoreRepeats:[1]>'),
        buildNoteRow(sandbox, '<encoreRepeats:[2]>'),
      ]);

      expect(battler.getEncoreRepeats()).toBe(0);
      battler.refreshEncoreRepeats();
      expect(battler.getEncoreRepeats()).toBe(3);
    });
  });

  describe('RPGManager.countSuccessesIn100', () =>
  {
    it('never counts a success at 0% chance, regardless of attempts', () =>
    {
      expect(sandbox.RPGManager.countSuccessesIn100(0, 10)).toBe(0);
    });

    it('counts every attempt as a success at 100% chance', () =>
    {
      expect(sandbox.RPGManager.countSuccessesIn100(100, 5)).toBe(5);
    });
  });

  describe('RPGManager.countSuccessesFateOf100', () =>
  {
    it('counts every attempt as a success when very lucky, even at 0% chance', () =>
    {
      const roller = { isVeryLucky: () => true, isVeryCursed: () => false };

      expect(sandbox.RPGManager.countSuccessesFateOf100(roller, 0, 7)).toBe(7);
    });

    it('counts zero successes when very cursed, even at 100% chance', () =>
    {
      const roller = { isVeryLucky: () => false, isVeryCursed: () => true };

      expect(sandbox.RPGManager.countSuccessesFateOf100(roller, 100, 7)).toBe(0);
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
      const roller = buildRoller();

      expect(sandbox.RPGManager.resolveProcCount(roller, 0, 1, 0)).toBe(0);
    });

    it('is 1 at 100% chance with no encore', () =>
    {
      const roller = buildRoller();

      expect(sandbox.RPGManager.resolveProcCount(roller, 100, 1, 0)).toBe(1);
    });

    it('doubles the single success when encoreRepeats is 1', () =>
    {
      const roller = buildRoller({ getEncoreRepeats: () => 1 });

      expect(sandbox.RPGManager.resolveProcCount(roller, 100, 1, 0)).toBe(2);
    });

    it('is 0 even with encore when the roll fails outright', () =>
    {
      const roller = buildRoller({ getEncoreRepeats: () => 1 });

      expect(sandbox.RPGManager.resolveProcCount(roller, 0, 1, 0)).toBe(0);
    });

    it('multiplies Accumulate Mode\'s success count by (1 + encoreRepeats)', () =>
    {
      const roller = buildRoller({ isAccumulating: () => true, getEncoreRepeats: () => 1 });

      // 100% chance, 3 attempts -> 3 successes, each echoed once -> 6.
      expect(sandbox.RPGManager.resolveProcCount(roller, 100, 3, 0)).toBe(6);
    });

    it('very lucky short-circuits to guaranteed success before encore multiplies it', () =>
    {
      const roller = buildRoller({ isVeryLucky: () => true, getEncoreRepeats: () => 2 });

      // guaranteed success (1) * (1 + 2 encore) = 3.
      expect(sandbox.RPGManager.resolveProcCount(roller, 0, 1, 0)).toBe(3);
    });
  });

  describe('JABS_OnChanceEffect.resolveProcCount', () =>
  {
    it('delegates to RPGManager.resolveProcCount when a positiveRoller is provided', () =>
    {
      const effect = new sandbox.JABS_OnChanceEffect(1, 100, 'test-key');
      const roller = {
        isVeryLucky: () => false,
        isVeryCursed: () => false,
        isAccumulating: () => false,
        getEncoreRepeats: () => 1,
      };

      // 100% chance, encore 1 -> 2 executions.
      expect(effect.resolveProcCount(1, 0, roller)).toBe(2);
    });

    it('falls back to a plain boolean-as-count roll with no positiveRoller', () =>
    {
      const effect = new sandbox.JABS_OnChanceEffect(1, 100, 'test-key');

      expect(effect.resolveProcCount(1, 0)).toBe(1);
    });
  });

  describe('Game_Action.handleApplyState (loop site end-to-end)', () =>
  {
    /** @type {Function} */
    let originalResolveProcCount;

    beforeEach(() =>
    {
      originalResolveProcCount = sandbox.RPGManager.resolveProcCount;
    });

    afterEach(() =>
    {
      sandbox.RPGManager.resolveProcCount = originalResolveProcCount;
    });

    it('applies the state once per resolved proc count', () =>
    {
      sandbox.RPGManager.resolveProcCount = () => 3;

      const target = { addState: () => {}, __calls: [] };
      target.addState = function(stateId, attacker)
      {
        this.__calls.push({ stateId, attacker });
      };

      const attacker = { getPositiveRollsForSkill: () => 0 };
      target.getNegativeRolls = () => 0;
      const action = Object.create(sandbox.Game_Action.prototype);
      action.subject = () => attacker;
      action.item = () => ({});
      action.shouldTargetApplyResistances = () => false;
      action.lukEffectRate = () => 1;
      action.makeSuccess = () => {};

      action.handleApplyState(target, 5, 1.0, false);

      expect(target.__calls).toEqual([
        { stateId: 5, attacker },
        { stateId: 5, attacker },
        { stateId: 5, attacker },
      ]);
    });

    it('does not apply the state at all when the proc count is 0', () =>
    {
      sandbox.RPGManager.resolveProcCount = () => 0;

      const target = { addState: () => { throw new Error('should not be called'); } };
      const attacker = { getPositiveRollsForSkill: () => 0 };
      target.getNegativeRolls = () => 0;
      const action = Object.create(sandbox.Game_Action.prototype);
      action.subject = () => attacker;
      action.item = () => ({});
      action.shouldTargetApplyResistances = () => false;
      action.lukEffectRate = () => 1;
      action.makeSuccess = () => {};

      expect(() => action.handleApplyState(target, 5, 1.0, false)).not.toThrow();
    });
  });
});
//endregion plugins/abs/core/accumulate-encore.test.js
