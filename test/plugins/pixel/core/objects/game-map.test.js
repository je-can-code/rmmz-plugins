//region plugins/pixel/core/objects/game-map.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('Game_Map ext/pixel augments (direct src import)', () =>
{
  let FakePIXELCollisionManager;
  let FakePathSearchEventIndex;

  beforeAll(async () =>
  {
    vi.resetModules();

    FakePIXELCollisionManager = { setupCollision: vi.fn() };
    vi.doMock('../../../../../src/plugins/pixel/core/managers/PIXEL_CollisionManager.js', () => ({ default: FakePIXELCollisionManager }));

    // the lookup's own behavior is tested beside it; here it only has to be seen being used.
    FakePathSearchEventIndex = { build: vi.fn(), clear: vi.fn(), isBuilt: vi.fn(), eventsAt: vi.fn() };
    vi.doMock('../../../../../src/plugins/pixel/core/managers/PathSearchEventIndex.js', () => ({ default: FakePathSearchEventIndex }));

    globalThis.J = { PIXEL: { Aliased: { Game_Map: new Map() }, Metadata: { FootTouchEventDelayFrames: 10 } } };

    function StubGameMap()
    {
    }

    StubGameMap.prototype.setup = vi.fn();
    StubGameMap.prototype.eventsXyNt = vi.fn(() => [ 'walked' ]);
    StubGameMap.prototype.events = function()
    {
      return [ 'crate', 'zone' ];
    };
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

  describe('searchWithEventIndex', () =>
  {
    it('builds the lookup from the map\'s events, runs the search, and clears it after', () =>
    {
      // Arrange
      const map = new globalThis.Game_Map();
      const calls = [];
      FakePathSearchEventIndex.build.mockImplementation(events => calls.push([ 'build', events ]));
      FakePathSearchEventIndex.clear.mockImplementation(() => calls.push([ 'clear' ]));
      const search = vi.fn(() =>
      {
        calls.push([ 'search' ]);
        return { x: 3, y: 4, reachedGoal: true };
      });

      // Act
      const step = map.searchWithEventIndex(search);

      // Assert
      expect(calls).toEqual([ [ 'build', [ 'crate', 'zone' ] ], [ 'search' ], [ 'clear' ] ]);
      expect(step).toEqual({ x: 3, y: 4, reachedGoal: true });
    });

    it('clears the lookup even when the search throws', () =>
    {
      // Arrange
      const map = new globalThis.Game_Map();
      const search = () =>
      {
        throw new Error('the search broke');
      };

      // Act
      const attempt = () => map.searchWithEventIndex(search);

      // Assert - the failure still arrives, and nothing is left answering for a map that moves on.
      expect(attempt).toThrow('the search broke');
      expect(FakePathSearchEventIndex.clear).toHaveBeenCalledTimes(1);
    });
  });

  describe('eventsXyNt', () =>
  {
    it('answers from the lookup while a search has one built', () =>
    {
      // Arrange
      const map = new globalThis.Game_Map();
      FakePathSearchEventIndex.isBuilt.mockReturnValue(true);
      FakePathSearchEventIndex.eventsAt.mockReturnValue([ 'looked up' ]);

      // Act
      const events = map.eventsXyNt(3, 4);

      // Assert - asked about the right tile, and the engine's walk never ran.
      expect(events).toEqual([ 'looked up' ]);
      expect(FakePathSearchEventIndex.eventsAt).toHaveBeenCalledWith(3, 4);
      expect(globalThis.J.PIXEL.Aliased.Game_Map.get('eventsXyNt')).not.toHaveBeenCalled();
    });

    it('walks the events as the engine does when no search is running', () =>
    {
      // Arrange
      const map = new globalThis.Game_Map();
      FakePathSearchEventIndex.isBuilt.mockReturnValue(false);

      // Act
      const events = map.eventsXyNt(3, 4);

      // Assert
      expect(events).toEqual([ 'walked' ]);
      expect(globalThis.J.PIXEL.Aliased.Game_Map.get('eventsXyNt')).toHaveBeenCalledWith(3, 4);
      expect(FakePathSearchEventIndex.eventsAt).not.toHaveBeenCalled();
    });
  });
});
//endregion plugins/pixel/core/objects/game-map.test.js
