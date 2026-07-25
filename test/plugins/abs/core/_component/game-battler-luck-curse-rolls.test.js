//region plugins/abs/core/_component/game-battler-luck-curse-rolls.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  installAbsHostGlobals,
  setPluginContextToJAbs,
  setPluginContextToJBase,
} from '../../_component/fixtures/install-abs-host-globals.js';

/**
 * Builds a real Game_Battler-backed instance with a note-source override.
 * @param {string[]} notes Raw note strings, one per source.
 * @returns {object}
 */
function buildBattler(notes = [])
{
  const battler = Object.create(globalThis.Game_Battler.prototype);
  battler.initMembers();
  battler.__testNoteSources = notes.map(note => ({ note }));
  return battler;
}

/**
 * Builds a minimal note-carrying "skill" row for the this-skill roll-bonus tags.
 * @param {string} note
 * @returns {object}
 */
function buildSkillRow(note)
{
  return { note };
}

describe('J-ABS Game_Battler luck/curse rolls (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installAbsHostGlobals();

    setPluginContextToJBase();
    await import('../../../../../src/plugins/_base/_metadata/initialization.js');
    await import('../../../../../src/plugins/_base/objects/Game_Battler.js');

    ({ default: globalThis.RPGManager } = await import('../../../../../src/plugins/_base/managers/RPGManager.js'));

    setPluginContextToJAbs();
    await import('../../../../../src/plugins/abs/core/_metadata/initialization.js');

    // patches globalThis.Game_Battler.prototype directly, no vm involved.
    await import('../../../../../src/plugins/abs/core/objects/Game_Battler.js');
  });

  beforeEach(() =>
  {
    globalThis.RPGManager.clearCache();
  });

  describe('positive rolls', () =>
  {
    it('getRawPositiveRolls/setPositiveRolls round-trip the cached unfloored total', () =>
    {
      // Arrange
      const battler = buildBattler();

      // Act
      battler.setPositiveRolls(2.7);

      // Assert
      expect(battler.getRawPositiveRolls()).toBe(2.7);
    });

    it('refreshPositiveRolls sums <luckyRolls:[FORMULA]> tags across note sources', () =>
    {
      // Arrange
      const battler = buildBattler([ '<luckyRolls:[2]>', '<luckyRolls:[1]>' ]);

      // Act
      battler.refreshPositiveRolls();

      // Assert
      expect(battler.getRawPositiveRolls()).toBe(3);
    });

    it('getPositiveRolls floors the raw cached total', () =>
    {
      // Arrange
      const battler = buildBattler();
      battler.setPositiveRolls(2.9);

      // Act & Assert
      expect(battler.getPositiveRolls()).toBe(2);
    });

    it('getPositiveRollsForSkill floors the combined battler-wide and this-skill totals once', () =>
    {
      // Arrange- 1.5 (battler) + 1.4 (skill) = 2.9, floored once to 2.
      const battler = buildBattler();
      battler.setPositiveRolls(1.5);
      const skill = buildSkillRow('<thisLuckyRolls:[1.4]>');

      // Act & Assert
      expect(battler.getPositiveRollsForSkill(skill)).toBe(2);
    });

    it('getPositiveRollsForSkill is just the floored battler-wide total with no skill-side tag', () =>
    {
      // Arrange
      const battler = buildBattler();
      battler.setPositiveRolls(3);
      const skill = buildSkillRow('');

      // Act & Assert
      expect(battler.getPositiveRollsForSkill(skill)).toBe(3);
    });
  });

  describe('negative rolls', () =>
  {
    it('getRawNegativeRolls/setNegativeRolls round-trip the cached unfloored total', () =>
    {
      // Arrange
      const battler = buildBattler();

      // Act
      battler.setNegativeRolls(1.3);

      // Assert
      expect(battler.getRawNegativeRolls()).toBe(1.3);
    });

    it('refreshNegativeRolls sums <cursedRolls:[FORMULA]> tags across note sources', () =>
    {
      // Arrange
      const battler = buildBattler([ '<cursedRolls:[3]>' ]);

      // Act
      battler.refreshNegativeRolls();

      // Assert
      expect(battler.getRawNegativeRolls()).toBe(3);
    });

    it('getNegativeRolls floors the raw cached total', () =>
    {
      // Arrange
      const battler = buildBattler();
      battler.setNegativeRolls(4.9);

      // Act & Assert
      expect(battler.getNegativeRolls()).toBe(4);
    });

    it('getNegativeRollsForSkill floors the combined battler-wide and this-skill totals once', () =>
    {
      // Arrange- 1 (battler) + 1.9 (skill) = 2.9, floored once to 2.
      const battler = buildBattler();
      battler.setNegativeRolls(1);
      const skill = buildSkillRow('<thisCursedRolls:[1.9]>');

      // Act & Assert
      expect(battler.getNegativeRollsForSkill(skill)).toBe(2);
    });
  });

  describe('veryLucky/veryCursed bypasses', () =>
  {
    it('isVeryLucky is true with a <veryLucky> tag on any note source', () =>
    {
      expect(buildBattler([ '<veryLucky>' ]).isVeryLucky()).toBe(true);
    });

    it('isVeryLucky is false with no matching tag', () =>
    {
      expect(buildBattler().isVeryLucky()).toBe(false);
    });

    it('isVeryCursed is true with a <veryCursed> tag on any note source', () =>
    {
      expect(buildBattler([ '<veryCursed>' ]).isVeryCursed()).toBe(true);
    });

    it('isVeryCursed is false with no matching tag', () =>
    {
      expect(buildBattler().isVeryCursed()).toBe(false);
    });
  });

  describe('encore repeats', () =>
  {
    it('getEncoreRepeats floors the cached unfloored total', () =>
    {
      // Arrange
      const battler = buildBattler();
      battler.setEncoreRepeats(2.9);

      // Act & Assert
      expect(battler.getEncoreRepeats()).toBe(2);
    });

    it('setEncoreRepeats assigns the unfloored value read back by getRawPositiveRolls-style access', () =>
    {
      // Arrange
      const battler = buildBattler();

      // Act
      battler.setEncoreRepeats(3.5);

      // Assert- getEncoreRepeats floors, so this confirms the raw setter stored the unfloored value.
      expect(battler.getEncoreRepeats()).toBe(3);
    });

    it('refreshEncoreRepeats sums <encoreRepeats:[FORMULA]> tags across note sources', () =>
    {
      // Arrange
      const battler = buildBattler([ '<encoreRepeats:[2]>' ]);

      // Act
      battler.refreshEncoreRepeats();

      // Assert
      expect(battler.getEncoreRepeats()).toBe(2);
    });
  });

  describe('isAccumulating', () =>
  {
    it('is true with an <accumulate> tag on any note source', () =>
    {
      expect(buildBattler([ '<accumulate>' ]).isAccumulating()).toBe(true);
    });

    it('is false with no matching tag', () =>
    {
      expect(buildBattler().isAccumulating()).toBe(false);
    });
  });
});
//endregion plugins/abs/core/_component/game-battler-luck-curse-rolls.test.js
