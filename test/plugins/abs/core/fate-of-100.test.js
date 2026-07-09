//region plugins/abs/core/fate-of-100.test.js
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { clearRpgManagerCacheInVm } from '../../../setup/shipped-plugin-vm.js';
import { loadAbsPluginVm } from '../abs-vm.js';

/**
 * Builds a minimal note-source stub carrying the given tag string, backed by the real
 * RPG_Skill prototype so boolean tags parse for real.
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

describe('fateOf100 / isVeryLucky / isVeryCursed (out/abs/J-ABS.js)', () =>
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

  describe('Game_Battler.isVeryLucky / isVeryCursed', () =>
  {
    /**
     * Builds a plain duck-typed battler exposing only isVeryLucky/isVeryCursed, borrowed
     * directly from the real prototype.
     * @param {object[]} notes
     * @returns {object}
     */
    function buildBattler(notes = [])
    {
      return {
        getAllNotes: () => notes,
        isVeryLucky: sandbox.Game_Battler.prototype.isVeryLucky,
        isVeryCursed: sandbox.Game_Battler.prototype.isVeryCursed,
      };
    }

    it('isVeryLucky is true only when a note source carries <veryLucky>', () =>
    {
      expect(buildBattler([ buildNoteRow(sandbox, '<veryLucky>') ]).isVeryLucky()).toBe(true);
      expect(buildBattler([ buildNoteRow(sandbox, '<knockback:4>') ]).isVeryLucky()).toBe(false);
    });

    it('isVeryCursed is true only when a note source carries <veryCursed>', () =>
    {
      expect(buildBattler([ buildNoteRow(sandbox, '<veryCursed>') ]).isVeryCursed()).toBe(true);
      expect(buildBattler([ buildNoteRow(sandbox, '<knockback:4>') ]).isVeryCursed()).toBe(false);
    });
  });

  describe('RPGManager.fateOf100', () =>
  {
    /**
     * Builds a plain duck-typed positive-roller with controllable fate-override flags.
     * @param {boolean} veryLucky
     * @param {boolean} veryCursed
     * @returns {object}
     */
    function buildRoller(veryLucky = false, veryCursed = false)
    {
      return {
        isVeryLucky: () => veryLucky,
        isVeryCursed: () => veryCursed,
      };
    }

    it('short-circuits to true when the roller is very lucky, even at 0% chance', () =>
    {
      const roller = buildRoller(true, false);

      expect(sandbox.RPGManager.fateOf100(roller, 0, 1, 0)).toBe(true);
    });

    it('short-circuits to false when the roller is very cursed, even at 100% chance', () =>
    {
      const roller = buildRoller(false, true);

      expect(sandbox.RPGManager.fateOf100(roller, 100, 1, 0)).toBe(false);
    });

    it('very lucky takes priority if somehow both flags are set', () =>
    {
      const roller = buildRoller(true, true);

      expect(sandbox.RPGManager.fateOf100(roller, 0, 1, 0)).toBe(true);
    });

    it('falls through to a normal chanceIn100 roll when neither flag is set', () =>
    {
      const roller = buildRoller(false, false);

      // 100% with no fate override should behave exactly like chanceIn100.
      expect(sandbox.RPGManager.fateOf100(roller, 100, 1, 0)).toBe(true);
      // 0% with no fate override should still fail normally.
      expect(sandbox.RPGManager.fateOf100(roller, 0, 1, 0)).toBe(false);
    });
  });

  describe('JABS_OnChanceEffect.shouldTrigger with a positiveRoller', () =>
  {
    it('is guaranteed to succeed when the positiveRoller is very lucky, regardless of chance', () =>
    {
      const effect = new sandbox.JABS_OnChanceEffect(1, 0, 'test-key');
      const roller = { isVeryLucky: () => true, isVeryCursed: () => false };

      expect(effect.shouldTrigger(1, 0, roller)).toBe(true);
    });

    it('is guaranteed to fail when the positiveRoller is very cursed, regardless of chance', () =>
    {
      const effect = new sandbox.JABS_OnChanceEffect(1, 100, 'test-key');
      const roller = { isVeryLucky: () => false, isVeryCursed: () => true };

      expect(effect.shouldTrigger(1, 0, roller)).toBe(false);
    });

    it('rolls normally when no positiveRoller is provided', () =>
    {
      const effect = new sandbox.JABS_OnChanceEffect(1, 100, 'test-key');

      expect(effect.shouldTrigger(1, 0)).toBe(true);
    });
  });
});
//endregion plugins/abs/core/fate-of-100.test.js
