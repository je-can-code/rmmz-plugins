//region plugins/map/core/objects/game-map.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('Game_Map ext/map augments (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    String.empty = '';

    globalThis.J = { MAP: { RegExp: { BlockMinimap: /<blockMinimap>/i } } };

    function StubGameMap()
    {
    }

    StubGameMap.prototype.note = vi.fn();
    globalThis.Game_Map = StubGameMap;

    await import('../../../../../src/plugins/map/core/objects/Game_Map.js');
  });

  beforeEach(() =>
  {
    vi.clearAllMocks();
  });

  describe('isMinimapBlocked', () =>
  {
    it('returns true when the note contains the block-minimap tag', () =>
    {
      // Arrange
      const map = new globalThis.Game_Map();
      map.note.mockReturnValue('<blockMinimap>');

      // Act
      const result = map.isMinimapBlocked();

      // Assert
      expect(result).toEqual(true);
    });

    it('returns false when the note does not contain the tag', () =>
    {
      // Arrange
      const map = new globalThis.Game_Map();
      map.note.mockReturnValue('some other note');

      // Act
      const result = map.isMinimapBlocked();

      // Assert
      expect(result).toEqual(false);
    });

    it('falls back to an empty string when note() returns null', () =>
    {
      // Arrange
      const map = new globalThis.Game_Map();
      map.note.mockReturnValue(null);

      // Act/Assert (no throw against a null note)
      expect(() => map.isMinimapBlocked()).not.toThrow();
      expect(map.isMinimapBlocked()).toEqual(false);
    });

    it('resets the shared global regex lastIndex before each test, so repeated calls stay correct', () =>
    {
      // Arrange
      const map = new globalThis.Game_Map();
      map.note.mockReturnValue('<blockMinimap>');

      // Act
      const first = map.isMinimapBlocked();
      const second = map.isMinimapBlocked();

      // Assert
      expect(first).toEqual(true);
      expect(second).toEqual(true);
    });
  });
});
//endregion plugins/map/core/objects/game-map.test.js
