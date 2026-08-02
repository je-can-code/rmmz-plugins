//region plugins/abs/core/_component/luck-curse-rolls.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import {
  installAbsHostGlobals,
  setPluginContextToJAbs,
  setPluginContextToJBase,
} from '../../_component/fixtures/install-abs-host-globals.js';

/**
 * Builds a minimal note-source stub carrying the given tag string, backed by the real
 * RPG_Skill prototype so formula tags parse and eval for real. Plain regex/eval reads (as used
 * by luckyRolls/cursedRolls) don't depend on any particular prototype chain, so this doubles as
 * a stand-in for any note source (state, equip, class, actor, or skill).
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
    getRawPositiveRolls: globalThis.Game_Battler.prototype.getRawPositiveRolls,
    setPositiveRolls: globalThis.Game_Battler.prototype.setPositiveRolls,
    refreshPositiveRolls: globalThis.Game_Battler.prototype.refreshPositiveRolls,
    getPositiveRolls: globalThis.Game_Battler.prototype.getPositiveRolls,
    getRawNegativeRolls: globalThis.Game_Battler.prototype.getRawNegativeRolls,
    setNegativeRolls: globalThis.Game_Battler.prototype.setNegativeRolls,
    refreshNegativeRolls: globalThis.Game_Battler.prototype.refreshNegativeRolls,
    getNegativeRolls: globalThis.Game_Battler.prototype.getNegativeRolls,
    getPositiveRollsForSkill: globalThis.Game_Battler.prototype.getPositiveRollsForSkill,
    getNegativeRollsForSkill: globalThis.Game_Battler.prototype.getNegativeRollsForSkill,
  };
}

describe('J-ABS luck/curse rolls (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installAbsHostGlobals();

    setPluginContextToJBase();
    await import('../../../../../src/plugins/_base/core/_metadata/initialization.js');

    ({ default: globalThis.RPGManager } = await import('../../../../../src/plugins/_base/core/managers/RPGManager.js'));
    ({ default: globalThis.RPG_Skill } = await import('../../../../../src/plugins/_base/core/database/implementations/RPG_Skill.js'));

    setPluginContextToJAbs();
    await import('../../../../../src/plugins/abs/core/_metadata/initialization.js');

    // patches globalThis.Game_Battler.prototype directly, no vm involved.
    await import('../../../../../src/plugins/abs/core/objects/Game_Battler.js');
  });

  describe('caching', () =>
  {
    it('reads 0 from a cold cache before any refresh has run', () =>
    {
      // Arrange- the tag is present, but nothing has told the battler to recompute its cache yet.
      const battler = buildBattler([ buildNoteRow('<luckyRolls:[5]>') ]);

      // Act
      const result = battler.getPositiveRolls();

      // Assert
      expect(result).toBe(0);
    });

    it('reflects the note sources only after refreshPositiveRolls/refreshNegativeRolls runs', () =>
    {
      // Arrange
      const battler = buildBattler([ buildNoteRow('<luckyRolls:[5]>\n<cursedRolls:[2]>') ]);

      // Act
      battler.refreshPositiveRolls();
      battler.refreshNegativeRolls();

      // Assert
      expect(battler.getPositiveRolls()).toBe(5);
      expect(battler.getNegativeRolls()).toBe(2);
    });

    it('does not recompute on its own when note sources change without a refresh call', () =>
    {
      // Arrange
      const notes = [ buildNoteRow('<luckyRolls:[5]>') ];
      const battler = buildBattler(notes);
      battler.refreshPositiveRolls();
      notes.push(buildNoteRow('<luckyRolls:[100]>'));

      // Act- simulate a battler-data change (new state applied) without telling the cache to refresh.
      const result = battler.getPositiveRolls();

      // Assert
      expect(result).toBe(5);
    });

    it('picks up new note sources only after refreshing again', () =>
    {
      // Arrange
      const notes = [ buildNoteRow('<luckyRolls:[5]>') ];
      const battler = buildBattler(notes);
      battler.refreshPositiveRolls();
      notes.push(buildNoteRow('<luckyRolls:[100]>'));

      // Act
      battler.refreshPositiveRolls();

      // Assert
      expect(battler.getPositiveRolls()).toBe(105);
    });
  });

  describe('getPositiveRolls', () =>
  {
    it('is 0 when no note source carries a luckyRolls tag', () =>
    {
      // Arrange
      const battler = buildBattler([ buildNoteRow('<knockback:4>') ]);
      battler.refreshPositiveRolls();

      // Act
      const result = battler.getPositiveRolls();

      // Assert
      expect(result).toBe(0);
    });

    it('evaluates the formula with "a" bound to the battler', () =>
    {
      // Arrange
      const battler = buildBattler([ buildNoteRow('<luckyRolls:[a.luk / 10]>') ]);
      battler.luk = 35;
      battler.refreshPositiveRolls();

      // Act
      const result = battler.getPositiveRolls();

      // Assert
      expect(result).toBe(3);
    });

    it('sums contributions across multiple note sources, floored once at the end', () =>
    {
      // Arrange- 1.6 + 1.6 = 3.2, floored once -> 3 (not floor(1.6) + floor(1.6) = 2).
      const battler = buildBattler([
        buildNoteRow('<luckyRolls:[1.6]>'),
        buildNoteRow('<luckyRolls:[1.6]>'),
      ]);
      battler.refreshPositiveRolls();

      // Act
      const result = battler.getPositiveRolls();

      // Assert
      expect(result).toBe(3);
    });
  });

  describe('getNegativeRolls', () =>
  {
    it('is 0 when no note source carries a cursedRolls tag', () =>
    {
      // Arrange
      const battler = buildBattler([ buildNoteRow('<knockback:4>') ]);
      battler.refreshNegativeRolls();

      // Act
      const result = battler.getNegativeRolls();

      // Assert
      expect(result).toBe(0);
    });

    it('sums cursedRolls formulas across all note sources', () =>
    {
      // Arrange
      const battler = buildBattler([
        buildNoteRow('<cursedRolls:[2]>'),
        buildNoteRow('<cursedRolls:[1]>'),
      ]);
      battler.refreshNegativeRolls();

      // Act
      const result = battler.getNegativeRolls();

      // Assert
      expect(result).toBe(3);
    });
  });

  describe('getPositiveRollsForSkill', () =>
  {
    it('combines the cached battler-wide luckyRolls with the skill\'s own thisLuckyRolls', () =>
    {
      // Arrange
      const battler = buildBattler([ buildNoteRow('<luckyRolls:[2]>') ]);
      battler.refreshPositiveRolls();
      const skill = buildNoteRow('<thisLuckyRolls:[3]>');

      // Act
      const result = battler.getPositiveRollsForSkill(skill);

      // Assert
      expect(result).toBe(5);
    });

    it('floors the combined total once, not each contribution separately', () =>
    {
      // Arrange- 1.6 + 1.6 = 3.2, floored once -> 3.
      const battler = buildBattler([ buildNoteRow('<luckyRolls:[1.6]>') ]);
      battler.refreshPositiveRolls();
      const skill = buildNoteRow('<thisLuckyRolls:[1.6]>');

      // Act
      const result = battler.getPositiveRollsForSkill(skill);

      // Assert
      expect(result).toBe(3);
    });

    it('falls back to only the cached battler-wide total when the skill has no thisLuckyRolls tag', () =>
    {
      // Arrange
      const battler = buildBattler([ buildNoteRow('<luckyRolls:[4]>') ]);
      battler.refreshPositiveRolls();
      const skill = buildNoteRow('<knockback:4>');

      // Act
      const result = battler.getPositiveRollsForSkill(skill);

      // Assert
      expect(result).toBe(4);
    });
  });

  describe('getNegativeRollsForSkill', () =>
  {
    it('combines the cached battler-wide cursedRolls with the skill\'s own thisCursedRolls', () =>
    {
      // Arrange
      const battler = buildBattler([ buildNoteRow('<cursedRolls:[1]>') ]);
      battler.refreshNegativeRolls();
      const skill = buildNoteRow('<thisCursedRolls:[2]>');

      // Act
      const result = battler.getNegativeRollsForSkill(skill);

      // Assert
      expect(result).toBe(3);
    });
  });
});
//endregion plugins/abs/core/_component/luck-curse-rolls.test.js
