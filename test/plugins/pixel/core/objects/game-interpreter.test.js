//region plugins/pixel/core/objects/game-interpreter.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import {
  installPixelCoreHostGlobals,
  setPluginContextToJBase,
  setPluginContextToJPixel,
} from '../../_component/fixtures/install-pixel-host-globals.js';

/**
 * The engine's interpreter, as much of it as a Transfer Player touches. Which event and map it belongs to
 * are answered the way vanilla answers them. Its own Transfer Player only records that it ran and what it
 * was given, since reserving the transfer is the engine's business and the pixel alias in front of it only
 * ever adds to what happens first.
 * @param {number} mapId The map the interpreter's event list came from.
 * @param {number} eventId The map event it is running, or 0 for none.
 */
function Game_Interpreter(mapId, eventId)
{
  this._mapId = mapId;
  this._eventId = eventId;
  this._transfersRun = [];
}

Game_Interpreter.prototype.eventId = function()
{
  return this._eventId;
};

Game_Interpreter.prototype.isOnCurrentMap = function()
{
  return this._mapId === globalThis.$gameMap.mapId();
};

Game_Interpreter.prototype.command201 = function(params)
{
  this._transfersRun.push(params);

  return true;
};

describe('J-Pixelistics Game_Interpreter (direct src import)', () =>
{
  /**
   * The Transfer Player every test runs: straight to map 6, landing at (1, 14) facing down, black fade.
   * @type {number[]}
   */
  const TRANSFER = [ 0, 6, 1, 14, 2, 0 ];

  beforeAll(async () =>
  {
    vi.resetModules();

    installPixelCoreHostGlobals();

    setPluginContextToJBase();
    await import('../../../../../src/plugins/_base/core/_metadata/initialization.js');
    await import('../../../../../src/plugins/_base/core/objects/Game_CharacterBase.js');

    // the real area event and the real player on either side of the handover.
    setPluginContextToJPixel();
    await import('../../../../../src/plugins/pixel/core/_metadata/initialization.js');
    await import('../../../../../src/plugins/pixel/core/objects/Game_CharacterBase.js');
    await import('../../../../../src/plugins/pixel/core/objects/Game_Event.js');
    await import('../../../../../src/plugins/pixel/core/objects/Game_Player.js');

    globalThis.Game_Interpreter = Game_Interpreter;
    await import('../../../../../src/plugins/pixel/core/objects/Game_Interpreter.js');
  });

  /**
   * Builds map 3 with a 20-tile strip along its top edge from (10, 0), and the player standing on it
   * eight tiles in from the event. The map answers with the strip for any event id it is asked about,
   * so anything that refuses to treat a transfer as relative can only be the guard under test.
   * @param {boolean} isRelativeTransfer Whether the strip's page remembers where the player crossed.
   * @returns {Game_Event} The strip.
   */
  const buildCrossing = isRelativeTransfer =>
  {
    const strip = new globalThis.Game_Event();
    strip.initMembers();
    strip._x = 10;
    strip._y = 0;
    strip.setAreaEventWidth(20);
    strip.setRelativeTransfer(isRelativeTransfer);

    globalThis.$gameMap = {
      mapId: () => 3,
      event: () => strip,
    };

    const player = new globalThis.Game_Player();
    player.initMembers();
    player._x = 18;
    player._y = 0;
    globalThis.$gamePlayer = player;

    return strip;
  };

  describe('command201', () =>
  {
    it('hands the player how far along the area they crossed, then runs the transfer', () =>
    {
      // Arrange
      buildCrossing(true);
      const interpreter = new Game_Interpreter(3, 4);

      // Act
      const reserved = interpreter.command201(TRANSFER);

      // Assert
      const { $gamePlayer } = globalThis;
      const offset = [ $gamePlayer.transferOffsetX(), $gamePlayer.transferOffsetY() ];
      const outcome = [ reserved, interpreter._transfersRun, offset ];
      expect(outcome)
        .toStrictEqual([ true, [ TRANSFER ], [ 8, 0 ] ]);
    });

    it('runs a transfer from a page that does not remember the crossing without handing anything over', () =>
    {
      // Arrange: the same crossing, eight tiles in, from a page without the tag.
      buildCrossing(false);
      const interpreter = new Game_Interpreter(3, 4);

      // Act
      const reserved = interpreter.command201(TRANSFER);

      // Assert
      const { $gamePlayer } = globalThis;
      const outcome = [ reserved, interpreter._transfersRun, $gamePlayer.transferOffsetX() ];
      expect(outcome)
        .toStrictEqual([ true, [ TRANSFER ], 0 ]);
    });
  });

  describe('isRelativeTransfer', () =>
  {
    it('answers false for a common event running on its own, which belongs to no map event', () =>
    {
      // Arrange
      buildCrossing(true);
      const interpreter = new Game_Interpreter(3, 0);

      // Act
      const isRelative = interpreter.isRelativeTransfer();

      // Assert
      expect(isRelative)
        .toBe(false);
    });

    it('answers false once a transfer has already carried the interpreter off its event map', () =>
    {
      // Arrange: the interpreter's list came from map 2, and the player now stands on map 3.
      buildCrossing(true);
      const interpreter = new Game_Interpreter(2, 4);

      // Act
      const isRelative = interpreter.isRelativeTransfer();

      // Assert
      expect(isRelative)
        .toBe(false);
    });
  });
});
//endregion plugins/pixel/core/objects/game-interpreter.test.js