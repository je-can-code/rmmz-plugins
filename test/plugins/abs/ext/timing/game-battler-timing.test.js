//region plugins/abs/ext/timing/game-battler-timing.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

// distinct markers stand in for the real J.ABS.EXT.TIMING.RegExp values- this file's logic never
// runs a regex against text (that's RPGManager's job, already covered by RPGManager's own tests),
// so identity markers are all that's needed to prove the right constant is wired to the right call.
const REGEX = {
  BaseCastSpeed: Symbol('BaseCastSpeed'),
  CastSpeedFlat: Symbol('CastSpeedFlat'),
  CastSpeedRate: Symbol('CastSpeedRate'),
  BaseFastCooldown: Symbol('BaseFastCooldown'),
  FastCooldownFlat: Symbol('FastCooldownFlat'),
  FastCooldownRate: Symbol('FastCooldownRate'),
};

describe('J-ABS-Timing Game_Battler (unit, all downstream dependencies mocked)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    // minimal J.ABS.EXT.TIMING namespace- only the shape this one file reads/writes.
    globalThis.J = {
      ABS: {
        EXT: {
          TIMING: {
            Aliased: { Game_Battler: new Map() },
            Metadata: {
              BaseCastSpeed: 0,
              MinimumCastTime: 10,
              BaseFastCooldown: 0,
              MinimumCooldown: 10,
            },
            RegExp: REGEX,
          },
        },
      },
    };

    // RPGManager is a downstream dependency (different file); mock it entirely rather than
    // exercising its real note-parsing logic.
    globalThis.RPGManager = { getResultsFromAllNotesByRegex: vi.fn() };

    // Game_Battler.prototype.initMembers is aliased ("original") before this file overwrites it;
    // a bare noop is all the "original" needs to be for this file's own logic to be exercised.
    function Game_Battler()
    {
    }

    Game_Battler.prototype.initMembers = function()
    {
    };
    globalThis.Game_Battler = Game_Battler;

    // the file under test- patches globalThis.Game_Battler.prototype directly, no vm involved.
    await import('../../../../../src/plugins/abs/ext/timing/objects/Game_Battler.js');
  });

  /**
   * Configures the mocked RPGManager to return a specific number per regex identity, regardless of
   * the note sources or formula base it's called with.
   * @param {Map<symbol, number>} valuesByRegex
   */
  function mockNoteResults(valuesByRegex)
  {
    globalThis.RPGManager.getResultsFromAllNotesByRegex.mockImplementation((_notes, regex) => valuesByRegex.get(regex) ?? 0);
  }

  beforeEach(() =>
  {
    globalThis.RPGManager.getResultsFromAllNotesByRegex.mockReset();
    mockNoteResults(new Map());
  });

  function buildBattler()
  {
    const battler = new globalThis.Game_Battler();
    battler.getAllNotes = () => [];
    battler.initMembers();
    return battler;
  }

  describe('initMembers', () =>
  {
    it('seeds all six cached timing values to zero', () =>
    {
      // Arrange & Act
      const battler = buildBattler();

      // Assert
      expect(battler.getBaseFastCooldown()).toBe(0);
      expect(battler.getFastCooldownFlat()).toBe(0);
      expect(battler.getFastCooldownRate()).toBe(0);
      expect(battler.getBaseCastSpeed()).toBe(0);
      expect(battler.getCastSpeedFlat()).toBe(0);
      expect(battler.getCastSpeedRate()).toBe(0);
    });
  });

  describe('cast speed', () =>
  {
    it('baseCastSpeed delegates to RPGManager with the BaseCastSpeed regex and returns its result', () =>
    {
      // Arrange
      mockNoteResults(new Map([ [ REGEX.BaseCastSpeed, 8 ] ]));
      const battler = buildBattler();

      // Act
      const result = battler.baseCastSpeed();

      // Assert
      expect(result).toBe(8);
      expect(globalThis.RPGManager.getResultsFromAllNotesByRegex).toHaveBeenCalledWith(
        [], REGEX.BaseCastSpeed, 0, battler);
    });

    it('castSpeedFlat delegates to RPGManager with the CastSpeedFlat regex and returns its result', () =>
    {
      // Arrange
      mockNoteResults(new Map([ [ REGEX.CastSpeedFlat, 6 ] ]));
      const battler = buildBattler();

      // Act
      const result = battler.castSpeedFlat();

      // Assert
      expect(result).toBe(6);
      expect(globalThis.RPGManager.getResultsFromAllNotesByRegex).toHaveBeenCalledWith(
        [], REGEX.CastSpeedFlat, expect.any(Number), battler);
    });

    it('castSpeedRate delegates to RPGManager with the CastSpeedRate regex and returns its result', () =>
    {
      // Arrange
      mockNoteResults(new Map([ [ REGEX.CastSpeedRate, 10 ] ]));
      const battler = buildBattler();

      // Act
      const result = battler.castSpeedRate();

      // Assert
      expect(result).toBe(10);
      expect(globalThis.RPGManager.getResultsFromAllNotesByRegex).toHaveBeenCalledWith(
        [], REGEX.CastSpeedRate, expect.any(Number), battler);
    });

    it('minimumCastTime reflects the metadata value', () =>
    {
      // Arrange
      const battler = buildBattler();

      // Act & Assert
      expect(battler.minimumCastTime()).toBe(10);
    });

    it('applyCastSpeed short-circuits to zero when there is no original cast time', () =>
    {
      // Arrange
      mockNoteResults(new Map([ [ REGEX.BaseCastSpeed, 999 ] ]));
      const battler = buildBattler();

      // Act
      const result = battler.applyCastSpeed(0);

      // Assert
      expect(result).toBe(0);
    });

    it('applyCastSpeed returns the original cast time unmodified when no modifiers are present', () =>
    {
      // Arrange
      const battler = buildBattler();

      // Act
      const result = battler.applyCastSpeed(20);

      // Assert
      expect(result).toBe(20);
    });

    it('applyCastSpeed combines base, flat, and rate modifiers against the original cast time', () =>
    {
      // Arrange: base 5, flat 2 (=7 total base), rate +50% -> (20 * 1.5) + 7 = 37.
      mockNoteResults(new Map([
        [ REGEX.BaseCastSpeed, 5 ], [ REGEX.CastSpeedFlat, 2 ], [ REGEX.CastSpeedRate, 50 ],
      ]));
      const battler = buildBattler();

      // Act
      const result = battler.applyCastSpeed(20);

      // Assert
      expect(result).toBe(37);
    });

    it('applyCastSpeed clamps up to the minimum cast time when the calculated value is lower', () =>
    {
      // Arrange: base -100 pushes the calculated value below the 10-frame floor.
      mockNoteResults(new Map([ [ REGEX.BaseCastSpeed, -100 ] ]));
      const battler = buildBattler();

      // Act
      const result = battler.applyCastSpeed(5);

      // Assert
      expect(result).toBe(10);
    });
  });

  describe('fast cooldown', () =>
  {
    it('baseFastCooldown delegates to RPGManager with the BaseFastCooldown regex and returns its result', () =>
    {
      // Arrange
      mockNoteResults(new Map([ [ REGEX.BaseFastCooldown, 10 ] ]));
      const battler = buildBattler();

      // Act
      const result = battler.baseFastCooldown();

      // Assert
      expect(result).toBe(10);
      expect(globalThis.RPGManager.getResultsFromAllNotesByRegex).toHaveBeenCalledWith(
        [], REGEX.BaseFastCooldown, 0, battler);
    });

    it('fastCooldownFlat delegates to RPGManager with the FastCooldownFlat regex and returns its result', () =>
    {
      // Arrange
      mockNoteResults(new Map([ [ REGEX.FastCooldownFlat, 5 ] ]));
      const battler = buildBattler();

      // Act
      const result = battler.fastCooldownFlat();

      // Assert
      expect(result).toBe(5);
      expect(globalThis.RPGManager.getResultsFromAllNotesByRegex).toHaveBeenCalledWith(
        [], REGEX.FastCooldownFlat, expect.any(Number), battler);
    });

    it('fastCooldownRate delegates to RPGManager with the FastCooldownRate regex and returns its result', () =>
    {
      // Arrange
      mockNoteResults(new Map([ [ REGEX.FastCooldownRate, 8 ] ]));
      const battler = buildBattler();

      // Act
      const result = battler.fastCooldownRate();

      // Assert
      expect(result).toBe(8);
      expect(globalThis.RPGManager.getResultsFromAllNotesByRegex).toHaveBeenCalledWith(
        [], REGEX.FastCooldownRate, expect.any(Number), battler);
    });

    it('minimumCooldown reflects the metadata value', () =>
    {
      // Arrange
      const battler = buildBattler();

      // Act & Assert
      expect(battler.minimumCooldown()).toBe(10);
    });

    it('applyFastCooldown short-circuits to zero when there is no original cooldown', () =>
    {
      // Arrange
      mockNoteResults(new Map([ [ REGEX.BaseFastCooldown, 999 ] ]));
      const battler = buildBattler();

      // Act
      const result = battler.applyFastCooldown(0);

      // Assert
      expect(result).toBe(0);
    });

    it('applyFastCooldown returns the original cooldown unmodified when no modifiers are present', () =>
    {
      // Arrange
      const battler = buildBattler();

      // Act
      const result = battler.applyFastCooldown(30);

      // Assert
      expect(result).toBe(30);
    });

    it('applyFastCooldown combines base, flat, and rate modifiers against the original cooldown', () =>
    {
      // Arrange: base 4, flat 1 (=5 total base), rate -50% -> (30 * 0.5) + 5 = 20.
      mockNoteResults(new Map([
        [ REGEX.BaseFastCooldown, 4 ], [ REGEX.FastCooldownFlat, 1 ], [ REGEX.FastCooldownRate, -50 ],
      ]));
      const battler = buildBattler();

      // Act
      const result = battler.applyFastCooldown(30);

      // Assert
      expect(result).toBe(20);
    });

    it('applyFastCooldown clamps up to the minimum cooldown when the calculated value is lower', () =>
    {
      // Arrange: base -100 pushes the calculated value below the 10-frame floor.
      mockNoteResults(new Map([ [ REGEX.BaseFastCooldown, -100 ] ]));
      const battler = buildBattler();

      // Act
      const result = battler.applyFastCooldown(5);

      // Assert
      expect(result).toBe(10);
    });
  });

  describe('cached value getters/setters/updaters', () =>
  {
    it('updateBaseFastCooldown pulls from baseFastCooldown() into the cache', () =>
    {
      // Arrange
      mockNoteResults(new Map([ [ REGEX.BaseFastCooldown, 7 ] ]));
      const battler = buildBattler();

      // Act
      battler.updateBaseFastCooldown();

      // Assert
      expect(battler.getBaseFastCooldown()).toBe(7);
    });

    it('updateFastCooldownFlat pulls from fastCooldownFlat() into the cache', () =>
    {
      // Arrange
      mockNoteResults(new Map([ [ REGEX.FastCooldownFlat, 3 ] ]));
      const battler = buildBattler();

      // Act
      battler.updateFastCooldownFlat();

      // Assert
      expect(battler.getFastCooldownFlat()).toBe(3);
    });

    it('updateFastCooldownRate pulls from fastCooldownRate() into the cache', () =>
    {
      // Arrange
      mockNoteResults(new Map([ [ REGEX.FastCooldownRate, 9 ] ]));
      const battler = buildBattler();

      // Act
      battler.updateFastCooldownRate();

      // Assert
      expect(battler.getFastCooldownRate()).toBe(9);
    });

    it('updateBaseCastSpeed pulls from baseCastSpeed() into the cache', () =>
    {
      // Arrange
      mockNoteResults(new Map([ [ REGEX.BaseCastSpeed, 6 ] ]));
      const battler = buildBattler();

      // Act
      battler.updateBaseCastSpeed();

      // Assert
      expect(battler.getBaseCastSpeed()).toBe(6);
    });

    it('updateCastSpeedFlat pulls from castSpeedFlat() into the cache', () =>
    {
      // Arrange
      mockNoteResults(new Map([ [ REGEX.CastSpeedFlat, 4 ] ]));
      const battler = buildBattler();

      // Act
      battler.updateCastSpeedFlat();

      // Assert
      expect(battler.getCastSpeedFlat()).toBe(4);
    });

    it('updateCastSpeedRate pulls from castSpeedRate() into the cache', () =>
    {
      // Arrange
      mockNoteResults(new Map([ [ REGEX.CastSpeedRate, 20 ] ]));
      const battler = buildBattler();

      // Act
      battler.updateCastSpeedRate();

      // Assert
      expect(battler.getCastSpeedRate()).toBe(20);
    });
  });
});
//endregion plugins/abs/ext/timing/game-battler-timing.test.js
