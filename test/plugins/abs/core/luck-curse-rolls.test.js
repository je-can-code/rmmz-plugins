//region plugins/abs/core/luck-curse-rolls.test.js
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { clearRpgManagerCacheInVm } from '../../../setup/shipped-plugin-vm.js';
import { loadAbsPluginVm } from '../abs-vm.js';

/**
 * Builds a minimal note-source stub carrying the given tag string, backed by the real
 * RPG_Skill prototype so formula tags parse and eval for real. Plain regex/eval reads (as used
 * by luckyRolls/cursedRolls) don't depend on any particular prototype chain, so this doubles as
 * a stand-in for any note source (state, equip, class, actor, or skill).
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

describe('J-ABS luck/curse rolls (out/abs/J-ABS.js)', () =>
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

  /**
   * Builds a plain duck-typed battler carrying only what these getters touch, borrowed directly
   * from the real prototype so no full Game_Battler construction is needed. Mirrors the real
   * cache field this all reads/writes through (`_j._abs._positiveRolls`/`_negativeRolls`).
   * @param {object[]} notes Note sources returned by getAllNotes().
   * @returns {object}
   */
  function buildBattler(notes = [])
  {
    return {
      _j: { _abs: { _positiveRolls: 0, _negativeRolls: 0 } },
      getLevel: () => 1,
      getAllNotes: () => notes,
      getRawPositiveRolls: sandbox.Game_Battler.prototype.getRawPositiveRolls,
      setPositiveRolls: sandbox.Game_Battler.prototype.setPositiveRolls,
      refreshPositiveRolls: sandbox.Game_Battler.prototype.refreshPositiveRolls,
      getPositiveRolls: sandbox.Game_Battler.prototype.getPositiveRolls,
      getRawNegativeRolls: sandbox.Game_Battler.prototype.getRawNegativeRolls,
      setNegativeRolls: sandbox.Game_Battler.prototype.setNegativeRolls,
      refreshNegativeRolls: sandbox.Game_Battler.prototype.refreshNegativeRolls,
      getNegativeRolls: sandbox.Game_Battler.prototype.getNegativeRolls,
      getPositiveRollsForSkill: sandbox.Game_Battler.prototype.getPositiveRollsForSkill,
      getNegativeRollsForSkill: sandbox.Game_Battler.prototype.getNegativeRollsForSkill,
    };
  }

  describe('caching', () =>
  {
    it('reads 0 from a cold cache before any refresh has run', () =>
    {
      const battler = buildBattler([ buildNoteRow(sandbox, '<luckyRolls:[5]>') ]);

      // the tag is present, but nothing has told the battler to recompute its cache yet.
      expect(battler.getPositiveRolls()).toBe(0);
    });

    it('reflects the note sources only after refreshPositiveRolls/refreshNegativeRolls runs', () =>
    {
      const battler = buildBattler([
        buildNoteRow(sandbox, '<luckyRolls:[5]>\n<cursedRolls:[2]>'),
      ]);

      battler.refreshPositiveRolls();
      battler.refreshNegativeRolls();

      expect(battler.getPositiveRolls()).toBe(5);
      expect(battler.getNegativeRolls()).toBe(2);
    });

    it('does not recompute on its own when note sources change without a refresh call', () =>
    {
      const notes = [ buildNoteRow(sandbox, '<luckyRolls:[5]>') ];
      const battler = buildBattler(notes);
      battler.refreshPositiveRolls();
      expect(battler.getPositiveRolls()).toBe(5);

      // simulate a battler-data change (new state applied) without telling the cache to refresh.
      notes.push(buildNoteRow(sandbox, '<luckyRolls:[100]>'));
      expect(battler.getPositiveRolls()).toBe(5);

      // only after refreshing again does the new source get picked up.
      battler.refreshPositiveRolls();
      expect(battler.getPositiveRolls()).toBe(105);
    });
  });

  describe('getPositiveRolls', () =>
  {
    it('is 0 when no note source carries a luckyRolls tag', () =>
    {
      const battler = buildBattler([ buildNoteRow(sandbox, '<knockback:4>') ]);
      battler.refreshPositiveRolls();

      expect(battler.getPositiveRolls()).toBe(0);
    });

    it('evaluates the formula with "a" bound to the battler', () =>
    {
      const battler = buildBattler([ buildNoteRow(sandbox, '<luckyRolls:[a.luk / 10]>') ]);
      battler.luk = 35;
      battler.refreshPositiveRolls();

      expect(battler.getPositiveRolls()).toBe(3);
    });

    it('sums contributions across multiple note sources, floored once at the end', () =>
    {
      const battler = buildBattler([
        buildNoteRow(sandbox, '<luckyRolls:[1.6]>'),
        buildNoteRow(sandbox, '<luckyRolls:[1.6]>'),
      ]);
      battler.refreshPositiveRolls();

      // 1.6 + 1.6 = 3.2, floored once -> 3 (not floor(1.6) + floor(1.6) = 2).
      expect(battler.getPositiveRolls()).toBe(3);
    });
  });

  describe('getNegativeRolls', () =>
  {
    it('is 0 when no note source carries a cursedRolls tag', () =>
    {
      const battler = buildBattler([ buildNoteRow(sandbox, '<knockback:4>') ]);
      battler.refreshNegativeRolls();

      expect(battler.getNegativeRolls()).toBe(0);
    });

    it('sums cursedRolls formulas across all note sources', () =>
    {
      const battler = buildBattler([
        buildNoteRow(sandbox, '<cursedRolls:[2]>'),
        buildNoteRow(sandbox, '<cursedRolls:[1]>'),
      ]);
      battler.refreshNegativeRolls();

      expect(battler.getNegativeRolls()).toBe(3);
    });
  });

  describe('getPositiveRollsForSkill', () =>
  {
    it('combines the cached battler-wide luckyRolls with the skill\'s own thisLuckyRolls', () =>
    {
      const battler = buildBattler([ buildNoteRow(sandbox, '<luckyRolls:[2]>') ]);
      battler.refreshPositiveRolls();
      const skill = buildNoteRow(sandbox, '<thisLuckyRolls:[3]>');

      expect(battler.getPositiveRollsForSkill(skill)).toBe(5);
    });

    it('floors the combined total once, not each contribution separately', () =>
    {
      const battler = buildBattler([ buildNoteRow(sandbox, '<luckyRolls:[1.6]>') ]);
      battler.refreshPositiveRolls();
      const skill = buildNoteRow(sandbox, '<thisLuckyRolls:[1.6]>');

      // 1.6 + 1.6 = 3.2, floored once -> 3.
      expect(battler.getPositiveRollsForSkill(skill)).toBe(3);
    });

    it('falls back to only the cached battler-wide total when the skill has no thisLuckyRolls tag', () =>
    {
      const battler = buildBattler([ buildNoteRow(sandbox, '<luckyRolls:[4]>') ]);
      battler.refreshPositiveRolls();
      const skill = buildNoteRow(sandbox, '<knockback:4>');

      expect(battler.getPositiveRollsForSkill(skill)).toBe(4);
    });
  });

  describe('getNegativeRollsForSkill', () =>
  {
    it('combines the cached battler-wide cursedRolls with the skill\'s own thisCursedRolls', () =>
    {
      const battler = buildBattler([ buildNoteRow(sandbox, '<cursedRolls:[1]>') ]);
      battler.refreshNegativeRolls();
      const skill = buildNoteRow(sandbox, '<thisCursedRolls:[2]>');

      expect(battler.getNegativeRollsForSkill(skill)).toBe(3);
    });
  });
});
//endregion plugins/abs/core/luck-curse-rolls.test.js
