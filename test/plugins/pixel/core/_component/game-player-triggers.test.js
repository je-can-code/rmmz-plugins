//region plugins/pixel/core/_component/game-player-triggers.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  installPixelCoreHostGlobals,
  setPluginContextToJBase,
  setPluginContextToJPixel,
} from '../../_component/fixtures/install-pixel-host-globals.js';

/**
 * `checkEventTriggerThere`/`checkEventTriggerTouchFront` are pixel-core `Game_Player`
 * overwrites that call `startMapEvent`/`checkEventTriggerTouch`, and the tile-entry check in
 * `update` calls `checkEventTriggerHere`- none of those three are exercised by spying on the
 * real chain (which needs a live `$gameMap`/event roster), so this file spies on them directly
 * and stubs just enough of the surrounding engine to drive the overwrites under test.
 */
describe('J-Pixelistics Game_Player trigger overwrites (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installPixelCoreHostGlobals();

    setPluginContextToJBase();
    await import('../../../../../src/plugins/_base/_metadata/initialization.js');
    await import('../../../../../src/plugins/_base/objects/Game_CharacterBase.js');

    setPluginContextToJPixel();
    await import('../../../../../src/plugins/pixel/core/_metadata/initialization.js');
    await import('../../../../../src/plugins/pixel/core/objects/Game_CharacterBase.js');
    await import('../../../../../src/plugins/pixel/core/objects/Game_Player.js');
  });

  beforeEach(() =>
  {
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
      isAnyEventStarting: () => false,
      _pixelFootTouchTriggerCooldown: 0,
    };

    globalThis.Game_Player.prototype.canStartLocalEvents = () => true;
    globalThis.Game_Player.prototype.startMapEvent = vi.fn();
  });

  /**
   * Builds a player instance positioned/facing as given, with a stubbed feet-anchored pivot
   * (0.70) matching the real {@link Game_Player.getCollisionPivotY} override in production.
   * @param {number} x
   * @param {number} y
   * @param {number} direction
   * @returns {Game_Player}
   */
  function makePlayer(x, y, direction)
  {
    const player = new globalThis.Game_Player();
    player.initMembers();
    player.getCollisionPivotY = () => 0.70;
    player._x = x;
    player._y = y;
    player.setDirection(direction);
    return player;
  }

  describe('checkEventTriggerThere', () =>
  {
    it('checks the occupied base tile before the front tile (doorstep geometry)', () =>
    {
      // Arrange: pivotY 0.70 at _y = 4.65 puts the body in row 5 (floor(4.65+0.70)=5),
      // one row past where a plain round(_y)=5 would also land- occupiedTileY is exercised here
      // via a value chosen so the base tile (5) and the "one tile ahead" front tile (4) differ.
      const player = makePlayer(2, 4.65, globalThis.J.PIXEL.Directions.UP);

      // Act
      player.checkEventTriggerThere([ 0, 1, 2 ]);

      // Assert: the base tile (2, 5) is checked, not just the front tile (2, 4).
      expect(globalThis.Game_Player.prototype.startMapEvent).toHaveBeenCalledWith(2, 5, [ 0, 1, 2 ], true);
    });

    it('still checks the front tile when the base tile does not start an event', () =>
    {
      // Arrange
      const player = makePlayer(2, 4.65, globalThis.J.PIXEL.Directions.UP);

      // Act
      player.checkEventTriggerThere([ 0, 1, 2 ]);

      // Assert
      expect(globalThis.Game_Player.prototype.startMapEvent).toHaveBeenCalledWith(2, 4, [ 0, 1, 2 ], true);
    });

    it('does not check the front tile once the base tile has already started an event', () =>
    {
      // Arrange
      const player = makePlayer(2, 4.65, globalThis.J.PIXEL.Directions.UP);
      globalThis.$gameMap.isAnyEventStarting = vi.fn()
        .mockReturnValueOnce(true);

      // Act
      player.checkEventTriggerThere([ 0, 1, 2 ]);

      // Assert: only the base-tile call happened.
      expect(globalThis.Game_Player.prototype.startMapEvent).toHaveBeenCalledTimes(1);
      expect(globalThis.Game_Player.prototype.startMapEvent).toHaveBeenCalledWith(2, 5, [ 0, 1, 2 ], true);
    });

    it('does not check beyond a counter once an earlier check already started an event', () =>
    {
      // Arrange
      const player = makePlayer(2, 4.65, globalThis.J.PIXEL.Directions.UP);
      globalThis.$gameMap.isCounter = () => true;
      globalThis.$gameMap.isAnyEventStarting = vi.fn()
        .mockReturnValueOnce(false)
        .mockReturnValueOnce(true);

      // Act
      player.checkEventTriggerThere([ 0, 1, 2 ]);

      // Assert: base tile + front tile only, no beyond-counter tile (2, 3).
      expect(globalThis.Game_Player.prototype.startMapEvent).not.toHaveBeenCalledWith(2, 3, [ 0, 1, 2 ], true);
    });
  });

  describe('checkEventTriggerTouchFront', () =>
  {
    it('fires a touch trigger on the occupied base tile without needing to look ahead', () =>
    {
      // Arrange
      const player = makePlayer(2, 4.65, globalThis.J.PIXEL.Directions.UP);
      const touchSpy = vi.spyOn(player, 'checkEventTriggerTouch')
        .mockImplementation((x, y) => x === 2 && y === 5);

      // Act
      const fired = player.checkEventTriggerTouchFront(globalThis.J.PIXEL.Directions.UP);

      // Assert
      expect(fired).toBe(true);
      expect(touchSpy).toHaveBeenCalledWith(2, 5);
    });
  });

  describe('tile-entry underfoot touch check (update override)', () =>
  {
    it('fires checkEventTriggerHere exactly once when the occupied tile changes', () =>
    {
      // Arrange: pre-seed the tracked tile to the starting position so only the deliberate
      // y=4->5 transition below counts as a change (the very first call always fires once,
      // since the tracking fields start undefined- that behavior is covered separately below).
      const player = makePlayer(2, 4, globalThis.J.PIXEL.Directions.DOWN);
      player._followers = { update: () => {} };
      player._lastOccupiedTileX = player.occupiedTileX();
      player._lastOccupiedTileY = player.occupiedTileY();
      const hereSpy = vi.spyOn(player, 'checkEventTriggerHere')
        .mockImplementation(() => {});

      // Act: cross from tile row 4 into tile row 5.
      player._y = 5;
      player.update(true);

      // Assert
      expect(hereSpy).toHaveBeenCalledTimes(1);
      expect(hereSpy).toHaveBeenCalledWith([ 1, 2 ]);
    });

    it('fires once on the very first update, since the tracked tile starts undefined', () =>
    {
      // Arrange
      const player = makePlayer(2, 4, globalThis.J.PIXEL.Directions.DOWN);
      player._followers = { update: () => {} };
      const hereSpy = vi.spyOn(player, 'checkEventTriggerHere')
        .mockImplementation(() => {});

      // Act
      player.update(true);

      // Assert
      expect(hereSpy).toHaveBeenCalledTimes(1);
    });

    it('does not fire again while the occupied tile stays the same', () =>
    {
      // Arrange: pre-seed so the baseline frame below isn't itself counted as a change.
      const player = makePlayer(2, 4, globalThis.J.PIXEL.Directions.DOWN);
      player._followers = { update: () => {} };
      player._lastOccupiedTileX = player.occupiedTileX();
      player._lastOccupiedTileY = player.occupiedTileY();
      const hereSpy = vi.spyOn(player, 'checkEventTriggerHere')
        .mockImplementation(() => {});

      // Act: three frames with no tile change.
      player.update(true);
      player.update(true);
      player.update(true);

      // Assert
      expect(hereSpy).not.toHaveBeenCalled();
    });
  });
});
//endregion plugins/pixel/core/_component/game-player-triggers.test.js
