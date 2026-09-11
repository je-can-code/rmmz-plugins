//region plugins/pixel/core/objects/game-event.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  installPixelCoreHostGlobals,
  setPluginContextToJBase,
  setPluginContextToJPixel,
} from '../../_component/fixtures/install-pixel-host-globals.js';

describe('Game_Event ext/pixel augments (direct src import)', () =>
{
  let Game_Event;

  /**
   * What the placeholder engine `stopCountThreshold` answers, standing in for vanilla's
   * frequency-derived value. Deliberately not a sentinel so the alias's two arms are told apart.
   * @type {number}
   */
  const ENGINE_THRESHOLD = 90;

  beforeAll(async () =>
  {
    vi.resetModules();

    installPixelCoreHostGlobals();

    // real production code- the alias map the pixel Game_Event augments register into.
    setPluginContextToJBase();
    await import('../../../../../src/plugins/_base/core/_metadata/initialization.js');
    setPluginContextToJPixel();
    await import('../../../../../src/plugins/pixel/core/_metadata/initialization.js');

    // the engine method the alias wraps; the fixture's placeholder event does not carry one.
    globalThis.Game_Event.prototype.stopCountThreshold = function()
    {
      return ENGINE_THRESHOLD;
    };

    await import('../../../../../src/plugins/pixel/core/objects/Game_Event.js');
    ({ Game_Event } = globalThis);
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
    };
  });

  describe('getCollisionPivotY', () =>
  {
    it('anchors the collision pivot near the feet', () =>
    {
      // Arrange
      const event = new Game_Event();

      // Act
      const pivot = event.getCollisionPivotY();

      // Assert
      expect(pivot).toBe(0.70);
    });
  });

  describe('isCollidedWithEvents', () =>
  {
    it('returns true when a non-erased, non-through event other than itself occupies the tile', () =>
    {
      // Arrange
      const event = new Game_Event();
      const other = { isErased: () => false, isThrough: () => false };
      globalThis.$gameMap.eventsXyNt = () => [ event, other ];

      // Act
      const collided = event.isCollidedWithEvents(3, 4);

      // Assert
      expect(collided).toBe(true);
    });

    it('excludes erased and through events, returning false when none remain', () =>
    {
      // Arrange
      const event = new Game_Event();
      const erased = { isErased: () => true, isThrough: () => false };
      const through = { isErased: () => false, isThrough: () => true };
      globalThis.$gameMap.eventsXyNt = () => [ event, erased, through ];

      // Act
      const collided = event.isCollidedWithEvents(3, 4);

      // Assert
      expect(collided).toBe(false);
    });
  });

  describe('checkEventTriggerTouchFront', () =>
  {
    it('derives the front tile from its own occupied tile rather than raw fractional coordinates', () =>
    {
      // Arrange: an event mid-step (fractional _x/_y) whose occupied tile is (3, 4).
      const event = new Game_Event();
      event._x = 3.4;
      event._y = 3.9;
      event.occupiedTileX = () => 3;
      event.occupiedTileY = () => 4;
      const touchSpy = vi.fn();
      event.checkEventTriggerTouch = touchSpy;

      // Act: moving down, so the front tile is one row below the occupied tile.
      event.checkEventTriggerTouchFront(2);

      // Assert: called with the occupied tile's front, not a front tile derived from raw _y.
      expect(touchSpy).toHaveBeenCalledWith(3, 5);
    });
  });

  describe('stopCountThreshold', () =>
  {
    it('reports no threshold while a route command is mid-repeat', () =>
    {
      // Arrange- the engine would answer 90 here, so a 0 can only have come from the alias's own arm.
      const event = new Game_Event();
      event.isRepeatMoveActive = () => true;

      // Act
      const threshold = event.stopCountThreshold();

      // Assert
      expect(threshold).toBe(0);
    });

    it('defers to the engine threshold between route commands', () =>
    {
      // Arrange
      const event = new Game_Event();
      event.isRepeatMoveActive = () => false;

      // Act
      const threshold = event.stopCountThreshold();

      // Assert
      expect(threshold).toBe(90);
    });
  });
});
//endregion plugins/pixel/core/objects/game-event.test.js
