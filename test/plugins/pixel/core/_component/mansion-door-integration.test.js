//region plugins/pixel/core/_component/mansion-door-integration.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import {
  installPixelCoreHostGlobals,
  setPluginContextToJBase,
  setPluginContextToJPixel,
} from '../../_component/fixtures/install-pixel-host-globals.js';

/**
 * End-to-end regression for the "mansion door" topology: a Player Touch door event sitting on a
 * *passable* tile, with the actual impassable wall one row behind it. Approaching from below and
 * facing up, the player's feet-anchored body comes to rest ON the door's own tile (blocked by the
 * wall behind it), so a naive "check only the tile ahead" trigger lookup misses the door entirely
 * -exactly the bug this suite exists to catch a regression of. Uses the real
 * checkEventTriggerThere/checkEventTriggerTouchFront/startMapEvent/pos chain end-to-end, with the
 * player positioned at the resting fraction that geometry produces rather than re-deriving it via
 * a full collision-kernel simulation (covered separately by the collision-kernel test suites).
 */
describe('mansion-door integration: doorstep geometry, approaching from below (direct src import)', () =>
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

    // vanilla-shaped checkEventTriggerTouch, captured by the pixel override's alias before
    // it gets replaced; mirrors real rmmz_objects.js Game_Player.prototype.checkEventTriggerTouch.
    globalThis.Game_Player.prototype.checkEventTriggerTouch = function(x, y)
    {
      if (this.canStartLocalEvents())
      {
        this.startMapEvent(x, y, [ 1, 2 ], true);
      }
    };

    await import('../../../../../src/plugins/pixel/core/objects/Game_Player.js');

    globalThis.$gameMap = {
      roundXWithDirection(x, d)
      {
        if (d === 6) return x + 1;
        if (d === 4) return x - 1;
        return x;
      },
      roundYWithDirection(y, d)
      {
        if (d === 2) return y + 1;
        if (d === 8) return y - 1;
        return y;
      },
      isCounter: () => false,
      isAnyEventStarting() { return globalThis.__door.started > 0; },
      isEventRunning: () => false,
      events() { return [ globalThis.__door ]; },
      eventsXy(x, y) { return this.events().filter(e => e.pos(x, y)); },
    };

    globalThis.__door = {
      x: 2,
      y: 5,
      _x: 2,
      _y: 5,
      isErased: () => false,
      isNormalPriority: () => true,
      isTriggerIn: triggers => triggers.includes(1),
      pos(x, y)
      {
        return this._x === x && this._y === y;
      },
      started: 0,
      start()
      {
        this.started += 1;
      },
    };

    globalThis.Game_Player.prototype.startMapEvent = function(x, y, triggers, normal)
    {
      if (globalThis.$gameMap.isEventRunning()) return;
      for (const event of globalThis.$gameMap.eventsXy(x, y))
      {
        if (!event.isErased() && event.isTriggerIn(triggers) && event.isNormalPriority() === normal)
        {
          event.start();
        }
      }
    };
    globalThis.Game_Player.prototype.canStartLocalEvents = () => true;
  });

  /**
   * Builds a player positioned at the doorstep resting fraction: blocked by the wall one row
   * behind the door, the feet-anchored body (pivotY 0.70) comes to rest at `doorRow - 0.4`,
   * whose occupied tile is the door's own row.
   * @param {number} doorRow
   * @returns {Game_Player}
   */
  function makePlayerAtDoorstep(doorRow)
  {
    const player = new globalThis.Game_Player();
    player.initMembers();
    player.getCollisionPivotY = () => 0.70;
    player._x = 2;
    player._y = doorRow - 0.4;
    player.setDirection(globalThis.J.PIXEL.Directions.UP);
    return player;
  }

  it('opens the door by pressing the action button while facing up', () =>
  {
    // Arrange
    const player = makePlayerAtDoorstep(5);

    // Sanity check: the player's body has actually come to rest on the door's own tile (row 5),
    // not one tile short of it- this is the geometry that broke the old front-tile-only lookup.
    expect(player.occupiedTileY()).toBe(5);

    // Act
    globalThis.__door.started = 0;
    player.checkEventTriggerThere([ 0, 1, 2 ]);

    // Assert
    expect(globalThis.__door.started).toBe(1);
  });

  it('also opens the door by simply walking into it (Player Touch), without pressing anything', () =>
  {
    // Arrange
    const player = makePlayerAtDoorstep(5);

    // Act
    globalThis.__door.started = 0;
    player.checkEventTriggerTouchFront(globalThis.J.PIXEL.Directions.UP);

    // Assert
    expect(globalThis.__door.started).toBe(1);
  });
});
//endregion plugins/pixel/core/_component/mansion-door-integration.test.js
