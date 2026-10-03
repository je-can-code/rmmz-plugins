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

  /**
   * Builds an event standing at a position, its members seeded the way construction seeds them.
   * @param {number} x The event's x coordinate, in tiles.
   * @param {number} y The event's y coordinate, in tiles.
   * @returns {Game_Event} The event.
   */
  const buildEvent = (x, y) =>
  {
    const event = new Game_Event();
    event.initMembers();
    event._x = x;
    event._y = y;

    return event;
  };

  /**
   * Builds a comment line the way the page hands it over.
   * @param {string} comment The comment's text.
   * @returns {object} The comment command.
   */
  const commentCommand = comment => ({ code: 108, parameters: [ comment ] });

  /**
   * Builds a character whose body occupies the given tile, which is all an area asks of one.
   * @param {number} tileX The occupied tile's x.
   * @param {number} tileY The occupied tile's y.
   * @returns {object} The character.
   */
  const characterAt = (tileX, tileY) => ({ occupiedTileX: () => tileX, occupiedTileY: () => tileY });

  beforeAll(async () =>
  {
    vi.resetModules();

    installPixelCoreHostGlobals();

    // real production code- the alias map the pixel Game_Event augments register into.
    setPluginContextToJBase();
    await import('../../../../../src/plugins/_base/core/_metadata/initialization.js');
    await import('../../../../../src/plugins/_base/core/objects/Game_CharacterBase.js');

    // the real note reader, since an area is read the same way every other tag on an event is.
    ({ default: globalThis.RPGManager } = await import('../../../../../src/plugins/_base/core/managers/RPGManager.js'));

    setPluginContextToJPixel();
    await import('../../../../../src/plugins/pixel/core/_metadata/initialization.js');

    // the real occupied-tile rule an event's area hangs off.
    await import('../../../../../src/plugins/pixel/core/objects/Game_CharacterBase.js');

    // the engine methods the aliases wrap; the fixture's placeholder event does not carry them.
    globalThis.Game_Event.prototype.stopCountThreshold = function()
    {
      return ENGINE_THRESHOLD;
    };
    globalThis.Game_Event.prototype.setupPage = function()
    {
      // counted, so the alias can be seen to have let the engine set the page up first.
      this._enginePageSetups = (this._enginePageSetups ?? 0) + 1;
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

  describe('initMembers', () =>
  {
    it('starts every event on a one-tile area that does not remember transfers', () =>
    {
      // Arrange
      const event = new Game_Event();

      // Act
      event.initMembers();

      // Assert
      expect([ event.areaEventWidth(), event.areaEventHeight(), event.isRelativeTransfer() ])
        .toStrictEqual([ 1, 1, false ]);
    });
  });

  describe('setupPage', () =>
  {
    it('lets the engine set the page up, then reads the area the new page covers', () =>
    {
      // Arrange
      const event = buildEvent(0, 0);
      event._validCommentCommands = [ commentCommand('<areaEvent:[4, 2]>') ];

      // Act
      event.setupPage();

      // Assert
      expect([ event._enginePageSetups, event.areaEventWidth(), event.areaEventHeight() ])
        .toStrictEqual([ 1, 4, 2 ]);
    });
  });

  describe('refreshAreaEvent', () =>
  {
    it('reads the area and the relative transfer off the page, from among its other tags', () =>
    {
      // Arrange
      const event = buildEvent(0, 0);
      event._validCommentCommands = [
        commentCommand('<minimap:teleport>'),
        commentCommand('<areaEvent:[5, 3]>'),
        commentCommand('<relativeTransfer>'),
      ];

      // Act
      event.refreshAreaEvent();

      // Assert
      expect([ event.areaEventWidth(), event.areaEventHeight(), event.isRelativeTransfer() ])
        .toStrictEqual([ 5, 3, true ]);
    });

    it('falls back to a single tile when the page declares no area it can use', () =>
    {
      // Arrange: a wide, relative area left over from the previous page, and a new page whose only
      // area tag is zero tiles wide- which is not an area tag at all.
      const event = buildEvent(0, 0);
      event.setAreaEventWidth(7);
      event.setAreaEventHeight(9);
      event.setRelativeTransfer(true);
      event._validCommentCommands = [ commentCommand('<minimap:npc>'), commentCommand('<areaEvent:[0, 2]>') ];

      // Act
      event.refreshAreaEvent();

      // Assert
      expect([ event.areaEventWidth(), event.areaEventHeight(), event.isRelativeTransfer() ])
        .toStrictEqual([ 1, 1, false ]);
    });
  });

  describe('pos', () =>
  {
    /**
     * Builds an event caught mid-step at (3.4, 5.2), whose body occupies tile (3, 5), covering a 4 by 2
     * area. Fractional on purpose: an area hangs off the occupied tile, never the raw coordinates.
     * @returns {Game_Event} The event.
     */
    const buildAreaEvent = () =>
    {
      const event = buildEvent(3.4, 5.2);
      event.setAreaEventWidth(4);
      event.setAreaEventHeight(2);

      return event;
    };

    it('stands on the far corner of its area', () =>
    {
      // Arrange
      const event = buildAreaEvent();

      // Act: the last column and the last row, (3 + 4 - 1, 5 + 2 - 1).
      const standsOn = event.pos(6, 6);

      // Assert
      expect(standsOn).toBe(true);
    });

    it('does not stand just left of its area', () =>
    {
      // Arrange
      const event = buildAreaEvent();

      // Act
      const standsOn = event.pos(2, 5);

      // Assert
      expect(standsOn).toBe(false);
    });

    it('does not stand just past the right edge of its area', () =>
    {
      // Arrange
      const event = buildAreaEvent();

      // Act
      const standsOn = event.pos(7, 5);

      // Assert
      expect(standsOn).toBe(false);
    });

    it('does not stand just above its area', () =>
    {
      // Arrange
      const event = buildAreaEvent();

      // Act
      const standsOn = event.pos(3, 4);

      // Assert
      expect(standsOn).toBe(false);
    });

    it('does not stand just past the bottom edge of its area', () =>
    {
      // Arrange
      const event = buildAreaEvent();

      // Act
      const standsOn = event.pos(3, 7);

      // Assert
      expect(standsOn).toBe(false);
    });

    it('stands on its occupied tile alone without an area, not the tile its raw coordinates round up to', () =>
    {
      // Arrange: mid-step at (3.4, 5.2), whose body occupies (3, 5). Counting up from the raw
      // coordinates instead would put it on (4, 6), one tile right of and below where it really is.
      const event = buildEvent(3.4, 5.2);

      // Act
      const standing = [ event.pos(3, 5), event.pos(4, 6) ];

      // Assert
      expect(standing).toStrictEqual([ true, false ]);
    });
  });

  describe('areaColumnOf', () =>
  {
    /**
     * Builds a 5 by 3 area anchored at tile (10, 4).
     * @returns {Game_Event} The event.
     */
    const buildAreaEvent = () =>
    {
      const event = buildEvent(10, 4);
      event.setAreaEventWidth(5);
      event.setAreaEventHeight(3);

      return event;
    };

    it('measures a character inside the area from its left edge', () =>
    {
      // Arrange
      const event = buildAreaEvent();

      // Act
      const column = event.areaColumnOf(characterAt(12, 5));

      // Assert
      expect(column).toBe(2);
    });

    it('measures a character beyond the right end as standing in the last column', () =>
    {
      // Arrange
      const event = buildAreaEvent();

      // Act
      const column = event.areaColumnOf(characterAt(17, 5));

      // Assert
      expect(column).toBe(4);
    });

    it('measures a character beside the left edge as standing in the first column', () =>
    {
      // Arrange
      const event = buildAreaEvent();

      // Act
      const column = event.areaColumnOf(characterAt(8, 5));

      // Assert
      expect(column).toBe(0);
    });
  });

  describe('areaRowOf', () =>
  {
    /**
     * Builds a 3 by 5 area anchored at tile (4, 10).
     * @returns {Game_Event} The event.
     */
    const buildAreaEvent = () =>
    {
      const event = buildEvent(4, 10);
      event.setAreaEventWidth(3);
      event.setAreaEventHeight(5);

      return event;
    };

    it('measures a character inside the area from its top edge', () =>
    {
      // Arrange
      const event = buildAreaEvent();

      // Act
      const row = event.areaRowOf(characterAt(5, 13));

      // Assert
      expect(row).toBe(3);
    });

    it('measures a character beyond the bottom end as standing in the last row', () =>
    {
      // Arrange
      const event = buildAreaEvent();

      // Act
      const row = event.areaRowOf(characterAt(5, 18));

      // Assert
      expect(row).toBe(4);
    });

    it('measures a character above the top edge as standing in the first row', () =>
    {
      // Arrange
      const event = buildAreaEvent();

      // Act
      const row = event.areaRowOf(characterAt(5, 7));

      // Assert
      expect(row).toBe(0);
    });
  });
});
//endregion plugins/pixel/core/objects/game-event.test.js
