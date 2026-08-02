//region plugins/abs/core/_component/fate-of-100.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  installAbsHostGlobals,
  setPluginContextToJAbs,
  setPluginContextToJBase,
} from '../../_component/fixtures/install-abs-host-globals.js';

/**
 * Builds a minimal note-source stub carrying the given tag string, backed by the real
 * RPG_Skill prototype so boolean tags parse for real.
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

describe('fateOf100 / isVeryLucky / isVeryCursed (direct src import)', () =>
{
  let RPGManager;

  beforeAll(async () =>
  {
    vi.resetModules();

    installAbsHostGlobals();

    setPluginContextToJBase();
    await import('../../../../../src/plugins/_base/core/_metadata/initialization.js');

    ({ default: RPGManager } = await import('../../../../../src/plugins/_base/core/managers/RPGManager.js'));
    globalThis.RPGManager = RPGManager;
    ({ default: globalThis.RPG_Skill } = await import('../../../../../src/plugins/_base/core/database/implementations/RPG_Skill.js'));
    ({ default: globalThis.JABS_OnChanceEffect } = await import('../../../../../src/plugins/abs/core/models/JABS_OnChanceEffect.js'));

    setPluginContextToJAbs();
    await import('../../../../../src/plugins/abs/core/_metadata/initialization.js');

    // patches globalThis.Game_Battler.prototype directly, no vm involved.
    await import('../../../../../src/plugins/abs/core/objects/Game_Battler.js');
  });

  beforeEach(() =>
  {
    globalThis.RPGManager.clearCache();
  });

  describe('Game_Battler.isVeryLucky', () =>
  {
    function buildBattler(notes = [])
    {
      return {
        getAllNotes: () => notes,
        isVeryLucky: globalThis.Game_Battler.prototype.isVeryLucky,
      };
    }

    it('is true when a note source carries <veryLucky>', () =>
    {
      // Arrange
      const battler = buildBattler([ buildNoteRow('<veryLucky>') ]);

      // Act
      const result = battler.isVeryLucky();

      // Assert
      expect(result).toBe(true);
    });

    it('is false when no note source carries the tag', () =>
    {
      // Arrange
      const battler = buildBattler([ buildNoteRow('<knockback:4>') ]);

      // Act
      const result = battler.isVeryLucky();

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('Game_Battler.isVeryCursed', () =>
  {
    function buildBattler(notes = [])
    {
      return {
        getAllNotes: () => notes,
        isVeryCursed: globalThis.Game_Battler.prototype.isVeryCursed,
      };
    }

    it('is true when a note source carries <veryCursed>', () =>
    {
      // Arrange
      const battler = buildBattler([ buildNoteRow('<veryCursed>') ]);

      // Act
      const result = battler.isVeryCursed();

      // Assert
      expect(result).toBe(true);
    });

    it('is false when no note source carries the tag', () =>
    {
      // Arrange
      const battler = buildBattler([ buildNoteRow('<knockback:4>') ]);

      // Act
      const result = battler.isVeryCursed();

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('RPGManager.fateOf100', () =>
  {
    function buildRoller(veryLucky = false, veryCursed = false)
    {
      return {
        isVeryLucky: () => veryLucky,
        isVeryCursed: () => veryCursed,
      };
    }

    it('short-circuits to true when the roller is very lucky, even at 0% chance', () =>
    {
      // Arrange
      const roller = buildRoller(true, false);

      // Act
      const result = RPGManager.fateOf100(roller, 0, 1, 0);

      // Assert
      expect(result).toBe(true);
    });

    it('short-circuits to false when the roller is very cursed, even at 100% chance', () =>
    {
      // Arrange
      const roller = buildRoller(false, true);

      // Act
      const result = RPGManager.fateOf100(roller, 100, 1, 0);

      // Assert
      expect(result).toBe(false);
    });

    it('very lucky takes priority if somehow both flags are set', () =>
    {
      // Arrange
      const roller = buildRoller(true, true);

      // Act
      const result = RPGManager.fateOf100(roller, 0, 1, 0);

      // Assert
      expect(result).toBe(true);
    });

    it('succeeds at 100% chance with neither flag set, like a normal chanceIn100 roll', () =>
    {
      // Arrange
      const roller = buildRoller(false, false);

      // Act
      const result = RPGManager.fateOf100(roller, 100, 1, 0);

      // Assert
      expect(result).toBe(true);
    });

    it('fails at 0% chance with neither flag set, like a normal chanceIn100 roll', () =>
    {
      // Arrange
      const roller = buildRoller(false, false);

      // Act
      const result = RPGManager.fateOf100(roller, 0, 1, 0);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('JABS_OnChanceEffect.shouldTrigger with a positiveRoller', () =>
  {
    it('is guaranteed to succeed when the positiveRoller is very lucky, regardless of chance', () =>
    {
      // Arrange
      const effect = new globalThis.JABS_OnChanceEffect(1, 0, 'test-key');
      const roller = { isVeryLucky: () => true, isVeryCursed: () => false };

      // Act
      const result = effect.shouldTrigger(1, 0, roller);

      // Assert
      expect(result).toBe(true);
    });

    it('is guaranteed to fail when the positiveRoller is very cursed, regardless of chance', () =>
    {
      // Arrange
      const effect = new globalThis.JABS_OnChanceEffect(1, 100, 'test-key');
      const roller = { isVeryLucky: () => false, isVeryCursed: () => true };

      // Act
      const result = effect.shouldTrigger(1, 0, roller);

      // Assert
      expect(result).toBe(false);
    });

    it('rolls normally when no positiveRoller is provided', () =>
    {
      // Arrange
      const effect = new globalThis.JABS_OnChanceEffect(1, 100, 'test-key');

      // Act
      const result = effect.shouldTrigger(1, 0);

      // Assert
      expect(result).toBe(true);
    });
  });
});
//endregion plugins/abs/core/_component/fate-of-100.test.js
