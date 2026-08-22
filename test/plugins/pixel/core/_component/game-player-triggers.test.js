//region plugins/pixel/core/_component/game-player-triggers.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  attachPixelEventRoster,
  buildPixelMapEvent,
  installPixelCoreHostGlobals,
  setPluginContextToJBase,
  setPluginContextToJPixel,
} from '../../_component/fixtures/install-pixel-host-globals.js';

const noop = function()
{
};

/**
 * Builds a map that answers real directional questions, so the "tile in front of me" the trigger
 * overwrites compute is genuine geometry rather than a coordinate handed back unchanged.
 * @param {object[]} roster Events built by `buildPixelMapEvent`.
 * @param {Set<string>} [counterTiles] Tiles that behave as counters, keyed `"x,y"`.
 * @returns {object}
 */
function buildTriggerPixelGameMap(roster, counterTiles = new Set())
{
  const map = {
    _pixelFootTouchTriggerCooldown: 0,
    width()
    {
      return 10;
    },
    height()
    {
      return 10;
    },
    tileWidth()
    {
      return 48;
    },
    tileHeight()
    {
      return 48;
    },
    roundXWithDirection(x, d)
    {
      if (d === globalThis.J.PIXEL.Directions.RIGHT) return x + 1;
      if (d === globalThis.J.PIXEL.Directions.LEFT) return x - 1;

      return x;
    },
    roundYWithDirection(y, d)
    {
      if (d === globalThis.J.PIXEL.Directions.DOWN) return y + 1;
      if (d === globalThis.J.PIXEL.Directions.UP) return y - 1;

      return y;
    },
    isCounter(x, y)
    {
      return counterTiles.has(`${x},${y}`);
    },
    // mirrors rmmz_objects.js: an event merely flagged as starting already blocks another start.
    isEventRunning()
    {
      return this.isAnyEventStarting();
    },
    isAnyEventStarting()
    {
      return this.events()
        .some(event => event.isStarting());
    },
    isPassable()
    {
      return true;
    },
    isDashDisabled()
    {
      return false;
    },
    requestRefresh: noop,
  };

  return attachPixelEventRoster(map, roster);
}

/**
 * Pixel core's `Game_Player` trigger overwrites, driven end to end against a real event roster.
 * Every assertion here is on an observable outcome- whether a specific event actually started-
 * rather than on whether a collaborator method happened to be called, because the interesting
 * behavior of these overwrites is precisely *which tile* ends up being searched.
 */
describe('J-Pixelistics Game_Player trigger overwrites (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installPixelCoreHostGlobals();

    setPluginContextToJBase();
    await import('../../../../../src/plugins/_base/core/_metadata/initialization.js');
    await import('../../../../../src/plugins/_base/core/objects/Game_CharacterBase.js');

    setPluginContextToJPixel();
    await import('../../../../../src/plugins/pixel/core/_metadata/initialization.js');
    await import('../../../../../src/plugins/pixel/core/objects/Game_CharacterBase.js');
    await import('../../../../../src/plugins/pixel/core/objects/Game_Player.js');
  });

  beforeEach(() =>
  {
    globalThis.$gameMap = buildTriggerPixelGameMap([]);
  });

  /**
   * Builds a player whose body occupies tile (2, 5): the 0.70 feet pivot pushes `_y` 4.65 into
   * row 5, one row past where a naive round would land, so base-tile and front-tile lookups are
   * genuinely distinguishable in every test below.
   * @param {number} x The fractional x coordinate.
   * @param {number} y The fractional y coordinate.
   * @param {number} direction The facing direction.
   * @returns {Game_Player}
   */
  function makePlayer(x, y, direction)
  {
    const player = new globalThis.Game_Player();
    player.initMembers();
    player._x = x;
    player._y = y;
    player.setDirection(direction);

    return player;
  }

  //region checkEventTriggerHere
  describe('checkEventTriggerHere', () =>
  {
    it('starts an underfoot event on the tile the body actually occupies', () =>
    {
      // Arrange: the event sits on row 5, which only the feet-anchored pivot resolves to.
      const event = buildPixelMapEvent(2, 5, 1, false);
      globalThis.$gameMap = buildTriggerPixelGameMap([ event ]);
      const player = makePlayer(2, 4.65, globalThis.J.PIXEL.Directions.UP);

      // Act
      player.checkEventTriggerHere([ 1, 2 ]);

      // Assert
      expect(event.isStarting())
        .toBe(true);
    });

    it('starts nothing while local events cannot be started', () =>
    {
      // Arrange
      const event = buildPixelMapEvent(2, 5, 1, false);
      globalThis.$gameMap = buildTriggerPixelGameMap([ event ]);
      const player = makePlayer(2, 4.65, globalThis.J.PIXEL.Directions.UP);
      player._canStartLocalEvents = false;

      // Act
      player.checkEventTriggerHere([ 1, 2 ]);

      // Assert
      expect(event.isStarting())
        .toBe(false);
    });

    it('suppresses touch triggers entirely while the foot-touch cooldown is active', () =>
    {
      // Arrange: the cooldown exists to stop an event from immediately re-firing underfoot,
      // so with only touch triggers requested there is nothing left to search for.
      const event = buildPixelMapEvent(2, 5, 1, false);
      globalThis.$gameMap = buildTriggerPixelGameMap([ event ]);
      globalThis.$gameMap._pixelFootTouchTriggerCooldown = 3;
      const player = makePlayer(2, 4.65, globalThis.J.PIXEL.Directions.UP);

      // Act
      player.checkEventTriggerHere([ 1, 2 ]);

      // Assert
      expect(event.isStarting())
        .toBe(false);
    });

    it('still honors non-touch triggers while the foot-touch cooldown is active', () =>
    {
      // Arrange: the cooldown only filters the touch triggers (1 and 2); an action-button
      // trigger (0) survives the filter and is still searched for.
      const event = buildPixelMapEvent(2, 5, 0, false);
      globalThis.$gameMap = buildTriggerPixelGameMap([ event ]);
      globalThis.$gameMap._pixelFootTouchTriggerCooldown = 3;
      const player = makePlayer(2, 4.65, globalThis.J.PIXEL.Directions.UP);

      // Act
      player.checkEventTriggerHere([ 0, 1, 2 ]);

      // Assert
      expect(event.isStarting())
        .toBe(true);
    });

    it('drops the event-touch trigger too while the foot-touch cooldown is active', () =>
    {
      // Arrange: the cooldown has to filter both touch triggers, not just player-touch (1). The
      // action-button event beside it is the near-miss sibling that must survive the filter, and
      // it doubles as proof the search actually ran rather than being skipped wholesale.
      const eventTouch = buildPixelMapEvent(2, 5, 2, false);
      const actionButton = buildPixelMapEvent(2, 5, 0, false);
      globalThis.$gameMap = buildTriggerPixelGameMap([ eventTouch, actionButton ]);
      globalThis.$gameMap._pixelFootTouchTriggerCooldown = 3;
      const player = makePlayer(2, 4.65, globalThis.J.PIXEL.Directions.UP);

      // Act
      player.checkEventTriggerHere([ 0, 1, 2 ]);

      // Assert
      expect(eventTouch.isStarting())
        .toBe(false);
      expect(actionButton.isStarting())
        .toBe(true);
    });
  });
  //endregion checkEventTriggerHere

  //region update
  describe('update', () =>
  {
    it('ticks the foot-touch cooldown down while it is active', () =>
    {
      // Arrange
      globalThis.$gameMap._pixelFootTouchTriggerCooldown = 3;
      const player = makePlayer(2, 4.65, globalThis.J.PIXEL.Directions.DOWN);

      // Act
      player.update(true);

      // Assert
      expect(globalThis.$gameMap._pixelFootTouchTriggerCooldown)
        .toBe(2);
    });

    it('leaves an already-expired cooldown alone rather than driving it negative', () =>
    {
      // Arrange
      globalThis.$gameMap._pixelFootTouchTriggerCooldown = 0;
      const player = makePlayer(2, 4.65, globalThis.J.PIXEL.Directions.DOWN);

      // Act
      player.update(true);

      // Assert
      expect(globalThis.$gameMap._pixelFootTouchTriggerCooldown)
        .toBe(0);
    });

    it('fires underfoot triggers when the occupied tile changes', () =>
    {
      // Arrange: pre-seed the tracked tile so only the deliberate row 4 -> row 5 crossing counts.
      const event = buildPixelMapEvent(2, 5, 1, false);
      globalThis.$gameMap = buildTriggerPixelGameMap([ event ]);
      const player = makePlayer(2, 3.65, globalThis.J.PIXEL.Directions.DOWN);
      player.setLastOccupiedTileX(player.occupiedTileX());
      player.setLastOccupiedTileY(player.occupiedTileY());

      // Act: cross into row 5.
      player._y = 4.65;
      player.update(true);

      // Assert
      expect(event.isStarting())
        .toBe(true);
    });

    it('fires underfoot triggers when the occupied column changes but the row does not', () =>
    {
      // Arrange: the case above crosses on the y axis alone, so the x half of the tile-change
      // check is never what decides anything there. Walking sideways along a row is the ordinary
      // way a player meets an underfoot event, and a check missing its x half would carry them
      // across a whole row of them without firing one.
      const event = buildPixelMapEvent(3, 5, 1, false);
      globalThis.$gameMap = buildTriggerPixelGameMap([ event ]);
      const player = makePlayer(2, 4.65, globalThis.J.PIXEL.Directions.RIGHT);
      player.setLastOccupiedTileX(player.occupiedTileX());
      player.setLastOccupiedTileY(player.occupiedTileY());

      // Act: cross into column 3 while staying in row 5.
      player._x = 2.6;
      player.update(true);

      // Assert
      expect(event.isStarting())
        .toBe(true);
    });

    it('fires on the very first update, since the tracked tile starts undefined', () =>
    {
      // Arrange
      const event = buildPixelMapEvent(2, 5, 1, false);
      globalThis.$gameMap = buildTriggerPixelGameMap([ event ]);
      const player = makePlayer(2, 4.65, globalThis.J.PIXEL.Directions.DOWN);

      // Act
      player.update(true);

      // Assert
      expect(event.isStarting())
        .toBe(true);
    });

    it('does not fire again while the occupied tile stays the same', () =>
    {
      // Arrange
      const event = buildPixelMapEvent(2, 5, 1, false);
      globalThis.$gameMap = buildTriggerPixelGameMap([ event ]);
      const player = makePlayer(2, 4.65, globalThis.J.PIXEL.Directions.DOWN);
      player.setLastOccupiedTileX(player.occupiedTileX());
      player.setLastOccupiedTileY(player.occupiedTileY());

      // Act: three frames with no tile change at all.
      player.update(true);
      player.update(true);
      player.update(true);

      // Assert
      expect(event.isStarting())
        .toBe(false);
    });

    it('records the newly entered tile so the crossing is only counted once', () =>
    {
      // Arrange
      const player = makePlayer(2, 3.65, globalThis.J.PIXEL.Directions.DOWN);
      player.setLastOccupiedTileX(player.occupiedTileX());
      player.setLastOccupiedTileY(player.occupiedTileY());

      // Act
      player._y = 4.65;
      player.update(true);

      // Assert
      expect(player.lastOccupiedTileY())
        .toBe(5);
    });
  });
  //endregion update

  //region checkEventTriggerThere
  describe('checkEventTriggerThere', () =>
  {
    it('starts nothing while local events cannot be started', () =>
    {
      // Arrange
      const event = buildPixelMapEvent(2, 5, 0, true);
      globalThis.$gameMap = buildTriggerPixelGameMap([ event ]);
      const player = makePlayer(2, 4.65, globalThis.J.PIXEL.Directions.UP);
      player._canStartLocalEvents = false;

      // Act
      player.checkEventTriggerThere([ 0 ]);

      // Assert
      expect(event.isStarting())
        .toBe(false);
    });

    it('checks the occupied base tile before the front tile (doorstep geometry)', () =>
    {
      // Arrange: a doorstep event on the player's own tile, with the wall behind it being what
      // the vanilla "tile in front" model would have looked at instead.
      const doorstep = buildPixelMapEvent(2, 5, 0, true);
      globalThis.$gameMap = buildTriggerPixelGameMap([ doorstep ]);
      const player = makePlayer(2, 4.65, globalThis.J.PIXEL.Directions.UP);

      // Act
      player.checkEventTriggerThere([ 0 ]);

      // Assert
      expect(doorstep.isStarting())
        .toBe(true);
    });

    it('checks the front tile when the base tile holds no event', () =>
    {
      // Arrange: facing UP from row 5 puts the front tile at row 4.
      const ahead = buildPixelMapEvent(2, 4, 0, true);
      globalThis.$gameMap = buildTriggerPixelGameMap([ ahead ]);
      const player = makePlayer(2, 4.65, globalThis.J.PIXEL.Directions.UP);

      // Act
      player.checkEventTriggerThere([ 0 ]);

      // Assert
      expect(ahead.isStarting())
        .toBe(true);
    });

    it('does not start a front-tile event once the base tile already started one', () =>
    {
      // Arrange
      const doorstep = buildPixelMapEvent(2, 5, 0, true);
      const ahead = buildPixelMapEvent(2, 4, 0, true);
      globalThis.$gameMap = buildTriggerPixelGameMap([ doorstep, ahead ]);
      const player = makePlayer(2, 4.65, globalThis.J.PIXEL.Directions.UP);

      // Act
      player.checkEventTriggerThere([ 0 ]);

      // Assert
      expect(ahead.isStarting())
        .toBe(false);
    });

    it('reaches past a counter tile to the tile beyond it', () =>
    {
      // Arrange: the front tile (2, 4) is a counter, so the shopkeeper at (2, 3) is reachable.
      const beyond = buildPixelMapEvent(2, 3, 0, true);
      globalThis.$gameMap = buildTriggerPixelGameMap([ beyond ], new Set([ '2,4' ]));
      const player = makePlayer(2, 4.65, globalThis.J.PIXEL.Directions.UP);

      // Act
      player.checkEventTriggerThere([ 0 ]);

      // Assert
      expect(beyond.isStarting())
        .toBe(true);
    });

    it('does not reach past a counter once an earlier check already started an event', () =>
    {
      // Arrange
      const ahead = buildPixelMapEvent(2, 4, 0, true);
      const beyond = buildPixelMapEvent(2, 3, 0, true);
      globalThis.$gameMap = buildTriggerPixelGameMap([ ahead, beyond ], new Set([ '2,4' ]));
      const player = makePlayer(2, 4.65, globalThis.J.PIXEL.Directions.UP);

      // Act
      player.checkEventTriggerThere([ 0 ]);

      // Assert
      expect(beyond.isStarting())
        .toBe(false);
    });

    it('does not reach beyond a front tile that is not a counter', () =>
    {
      // Arrange
      const beyond = buildPixelMapEvent(2, 3, 0, true);
      globalThis.$gameMap = buildTriggerPixelGameMap([ beyond ]);
      const player = makePlayer(2, 4.65, globalThis.J.PIXEL.Directions.UP);

      // Act
      player.checkEventTriggerThere([ 0 ]);

      // Assert
      expect(beyond.isStarting())
        .toBe(false);
    });
  });
  //endregion checkEventTriggerThere

  //region checkEventTriggerTouch
  describe('checkEventTriggerTouch', () =>
  {
    it('reports a started event when the coordinates sit near the tile center', () =>
    {
      // Arrange
      const event = buildPixelMapEvent(2, 5, 1, true);
      globalThis.$gameMap = buildTriggerPixelGameMap([ event ]);
      const player = makePlayer(2, 4.65, globalThis.J.PIXEL.Directions.UP);

      // Act
      const fired = player.checkEventTriggerTouch(2.05, 5.05);

      // Assert
      expect(fired)
        .toBe(true);
    });

    it('starts the event it reports on', () =>
    {
      // Arrange
      const event = buildPixelMapEvent(2, 5, 1, true);
      globalThis.$gameMap = buildTriggerPixelGameMap([ event ]);
      const player = makePlayer(2, 4.65, globalThis.J.PIXEL.Directions.UP);

      // Act
      player.checkEventTriggerTouch(2.05, 5.05);

      // Assert
      expect(event.isStarting())
        .toBe(true);
    });

    it('declines coordinates too far from the tile center to count as a touch', () =>
    {
      // Arrange: 0.4 away on both axes exceeds the 0.3 threshold that guards against a touch
      // firing while the body is still most of a tile away.
      const event = buildPixelMapEvent(2, 5, 1, true);
      globalThis.$gameMap = buildTriggerPixelGameMap([ event ]);
      const player = makePlayer(2, 4.65, globalThis.J.PIXEL.Directions.UP);

      // Act
      const fired = player.checkEventTriggerTouch(2.4, 5.4);

      // Assert
      expect(fired)
        .toBe(false);
    });

    it('starts nothing when the coordinates fail the threshold', () =>
    {
      // Arrange
      const event = buildPixelMapEvent(2, 5, 1, true);
      globalThis.$gameMap = buildTriggerPixelGameMap([ event ]);
      const player = makePlayer(2, 4.65, globalThis.J.PIXEL.Directions.UP);

      // Act
      player.checkEventTriggerTouch(2.4, 5.4);

      // Assert
      expect(event.isStarting())
        .toBe(false);
    });

    it.each([
      [ 'x', 2.4, 5.05 ],
      [ 'y', 2.05, 5.4 ],
    ])('declines a touch when only the %s coordinate is too far from the tile center', (_axis, x, y) =>
    {
      // Arrange: the case above misses on both axes at once, so either half of the threshold
      // could be forced true and the other half would still refuse. A body sliding along a row
      // or a column is off-center on exactly one axis, which is the state this actually guards.
      const event = buildPixelMapEvent(2, 5, 1, true);
      globalThis.$gameMap = buildTriggerPixelGameMap([ event ]);
      const player = makePlayer(2, 4.65, globalThis.J.PIXEL.Directions.UP);

      // Act
      const fired = player.checkEventTriggerTouch(x, y);

      // Assert
      expect(fired)
        .toBe(false);
      expect(event.isStarting())
        .toBe(false);
    });

    it('reports no start when the touch lands on a tile holding no event', () =>
    {
      // Arrange
      globalThis.$gameMap = buildTriggerPixelGameMap([]);
      const player = makePlayer(2, 4.65, globalThis.J.PIXEL.Directions.UP);

      // Act
      const fired = player.checkEventTriggerTouch(2.05, 5.05);

      // Assert
      expect(fired)
        .toBe(false);
    });
  });
  //endregion checkEventTriggerTouch

  //region checkEventTriggerTouchFront
  describe('checkEventTriggerTouchFront', () =>
  {
    it('fires a touch trigger on the occupied base tile without looking ahead', () =>
    {
      // Arrange: a blocked player overlapping a doorstep event should still touch it.
      const doorstep = buildPixelMapEvent(2, 5, 1, true);
      globalThis.$gameMap = buildTriggerPixelGameMap([ doorstep ]);
      const player = makePlayer(2, 4.65, globalThis.J.PIXEL.Directions.UP);

      // Act
      const fired = player.checkEventTriggerTouchFront(globalThis.J.PIXEL.Directions.UP);

      // Assert
      expect(fired)
        .toBe(true);
    });

    it('leaves the front tile alone once the base tile already fired', () =>
    {
      // Arrange
      const doorstep = buildPixelMapEvent(2, 5, 1, true);
      const ahead = buildPixelMapEvent(2, 4, 1, true);
      globalThis.$gameMap = buildTriggerPixelGameMap([ doorstep, ahead ]);
      const player = makePlayer(2, 4.65, globalThis.J.PIXEL.Directions.UP);

      // Act
      player.checkEventTriggerTouchFront(globalThis.J.PIXEL.Directions.UP);

      // Assert
      expect(ahead.isStarting())
        .toBe(false);
    });

    it('fires a touch trigger on the front tile when the base tile is empty', () =>
    {
      // Arrange
      const ahead = buildPixelMapEvent(2, 4, 1, true);
      globalThis.$gameMap = buildTriggerPixelGameMap([ ahead ]);
      const player = makePlayer(2, 4.65, globalThis.J.PIXEL.Directions.UP);

      // Act
      const fired = player.checkEventTriggerTouchFront(globalThis.J.PIXEL.Directions.UP);

      // Assert
      expect(fired)
        .toBe(true);
    });

    it('fires a touch trigger beyond a counter when neither nearer tile did', () =>
    {
      // Arrange
      const beyond = buildPixelMapEvent(2, 3, 1, true);
      globalThis.$gameMap = buildTriggerPixelGameMap([ beyond ], new Set([ '2,4' ]));
      const player = makePlayer(2, 4.65, globalThis.J.PIXEL.Directions.UP);

      // Act
      const fired = player.checkEventTriggerTouchFront(globalThis.J.PIXEL.Directions.UP);

      // Assert
      expect(fired)
        .toBe(true);
    });

    it('reports failure when the front tile is a counter but nothing lies beyond it', () =>
    {
      // Arrange
      globalThis.$gameMap = buildTriggerPixelGameMap([], new Set([ '2,4' ]));
      const player = makePlayer(2, 4.65, globalThis.J.PIXEL.Directions.UP);

      // Act
      const fired = player.checkEventTriggerTouchFront(globalThis.J.PIXEL.Directions.UP);

      // Assert
      expect(fired)
        .toBe(false);
    });

    it('does not touch past a front tile that is not a counter', () =>
    {
      // Arrange: only a counter earns the extra tile of reach. The sibling case above puts the
      // very same event two tiles away with the counter present and expects it to fire, so the
      // counter flag is the only thing that differs between reaching it and not.
      const beyond = buildPixelMapEvent(2, 3, 1, true);
      globalThis.$gameMap = buildTriggerPixelGameMap([ beyond ]);
      const player = makePlayer(2, 4.65, globalThis.J.PIXEL.Directions.UP);

      // Act
      const fired = player.checkEventTriggerTouchFront(globalThis.J.PIXEL.Directions.UP);

      // Assert
      expect(fired)
        .toBe(false);
      expect(beyond.isStarting())
        .toBe(false);
    });

    it('reports failure when no tile in the search path holds a touch event', () =>
    {
      // Arrange
      globalThis.$gameMap = buildTriggerPixelGameMap([]);
      const player = makePlayer(2, 4.65, globalThis.J.PIXEL.Directions.UP);

      // Act
      const fired = player.checkEventTriggerTouchFront(globalThis.J.PIXEL.Directions.UP);

      // Assert
      expect(fired)
        .toBe(false);
    });
  });
  //endregion checkEventTriggerTouchFront
});
//endregion plugins/pixel/core/_component/game-player-triggers.test.js