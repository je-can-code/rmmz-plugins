//region plugins/pixel/core/objects/game-map.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('Game_Map ext/pixel augments (direct src import)', () =>
{
  let FakePIXELCollisionManager;

  beforeAll(async () =>
  {
    vi.resetModules();

    FakePIXELCollisionManager = { setupCollision: vi.fn() };
    vi.doMock('../../../../../src/plugins/pixel/core/managers/PIXEL_CollisionManager.js', () => ({ default: FakePIXELCollisionManager }));

    globalThis.J = { PIXEL: { Aliased: { Game_Map: new Map() }, Metadata: { FootTouchEventDelayFrames: 10 } } };

    function StubGameMap()
    {
    }

    StubGameMap.prototype.setup = vi.fn();
    globalThis.Game_Map = StubGameMap;

    await import('../../../../../src/plugins/pixel/core/objects/Game_Map.js');
  });

  beforeEach(() =>
  {
    vi.clearAllMocks();
  });

  describe('setup', () =>
  {
    it('always calls through to the original aliased implementation', () =>
    {
      // Arrange
      const map = new globalThis.Game_Map();

      // Act
      map.setup(3);

      // Assert
      expect(globalThis.J.PIXEL.Aliased.Game_Map.get('setup')).toHaveBeenCalledWith(3);
    });

    it('rebuilds the pixel collision table for the new map', () =>
    {
      // Arrange
      const map = new globalThis.Game_Map();

      // Act
      map.setup(3);

      // Assert
      expect(FakePIXELCollisionManager.setupCollision).toHaveBeenCalled();
    });

    it('seeds the foot-touch trigger cooldown from plugin metadata', () =>
    {
      // Arrange
      const map = new globalThis.Game_Map();

      // Act
      map.setup(3);

      // Assert
      expect(map._pixelFootTouchTriggerCooldown).toEqual(10);
    });
  });
});
//endregion plugins/pixel/core/objects/game-map.test.js
