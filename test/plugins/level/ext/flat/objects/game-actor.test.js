//region plugins/level/ext/flat/objects/game-actor.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('Game_Actor (J-LEVEL-Flat) (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.J = { LEVEL: { EXT: { FLAT: { Metadata: { expPerLevel: 1000 } } } } };

    function Game_Actor()
    {
    }

    globalThis.Game_Actor = Game_Actor;

    await import('../../../../../../src/plugins/level/ext/flat/objects/Game_Actor.js');
  });

  beforeEach(() =>
  {
    globalThis.J.LEVEL.EXT.FLAT.Metadata.expPerLevel = 1000;
  });

  describe('expForLevel', () =>
  {
    it('returns 0 for level 1', () =>
    {
      // Arrange
      const actor = new globalThis.Game_Actor();

      // Act & Assert
      expect(actor.expForLevel(1)).toBe(0);
    });

    it('returns 0 for a level below 1', () =>
    {
      // Arrange
      const actor = new globalThis.Game_Actor();

      // Act & Assert
      expect(actor.expForLevel(0)).toBe(0);
    });

    it('returns the flat experience scaled by levels above 1', () =>
    {
      // Arrange
      const actor = new globalThis.Game_Actor();

      // Act & Assert
      expect(actor.expForLevel(5)).toBe(4000);
    });

    it('scales using the configured flat experience per level', () =>
    {
      // Arrange
      globalThis.J.LEVEL.EXT.FLAT.Metadata.expPerLevel = 250;
      const actor = new globalThis.Game_Actor();

      // Act & Assert
      expect(actor.expForLevel(5)).toBe(1000);
    });
  });
});
//endregion plugins/level/ext/flat/objects/game-actor.test.js
