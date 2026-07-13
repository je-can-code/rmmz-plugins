//region plugins/pixel/core/game-character-base-pixel.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  buildDefaultPixelGameMap,
  installPixelCoreHostGlobals,
  setPluginContextToJBase,
  setPluginContextToJPixel,
} from '../fixtures/install-pixel-host-globals.js';

describe('J-Pixelistics Game_CharacterBase pixel movement helpers (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installPixelCoreHostGlobals();

    setPluginContextToJBase();
    await import('../../../../src/plugins/_base/_metadata/initialization.js');

    // patches globalThis.Game_CharacterBase.prototype with isStraightDirection/isDiagonalDirection,
    // which pixel core's own Game_CharacterBase.js relies on.
    await import('../../../../src/plugins/_base/objects/Game_CharacterBase.js');

    setPluginContextToJPixel();
    await import('../../../../src/plugins/pixel/core/_metadata/initialization.js');

    // patches globalThis.Game_CharacterBase.prototype directly, no vm involved.
    await import('../../../../src/plugins/pixel/core/objects/Game_CharacterBase.js');

    ({ default: globalThis.PIXEL_CollisionManager } = await import('../../../../src/plugins/pixel/core/managers/PIXEL_CollisionManager.js'));
  });

  beforeEach(() =>
  {
    // a fresh $gameMap every test- some tests replace it outright (regionId) or override a single
    // method (movePixelDistance's isPassable override), and neither should leak into the next test.
    globalThis.$gameMap = buildDefaultPixelGameMap();
    globalThis.PIXEL_CollisionManager.initConfig();
    globalThis.PIXEL_CollisionManager.setupCollision();
  });

  it('initMembers wires up the _j._pixel step counter', () =>
  {
    // Arrange
    const ch = new globalThis.Game_CharacterBase();

    // Act
    ch.initMembers();

    // Assert
    expect(ch._j._pixel._steps).toBe(0);
  });

  it('initMembers wires up the pixel move cooldown state', () =>
  {
    // Arrange
    const ch = new globalThis.Game_CharacterBase();

    // Act
    ch.initMembers();

    // Assert
    expect(ch._pixelState()._moveCooldown).toBe(0);
  });

  it('setPixelMoveCooldown flags the character as on cooldown', () =>
  {
    // Arrange
    const ch = new globalThis.Game_CharacterBase();
    ch.initMembers();

    // Act
    ch.setPixelMoveCooldown(2);

    // Assert
    expect(ch.isPixelOnCooldown()).toBe(true);
  });

  it('decrementPixelMoveCooldown reduces the remaining cooldown by one', () =>
  {
    // Arrange
    const ch = new globalThis.Game_CharacterBase();
    ch.initMembers();
    ch.setPixelMoveCooldown(2);

    // Act
    ch.decrementPixelMoveCooldown();

    // Assert
    expect(ch.getPixelMoveCooldown()).toBe(1);
  });

  it('movePixelDistance advances logical X on an open map', () =>
  {
    // Arrange
    const ch = new globalThis.Game_CharacterBase();
    ch.initMembers();
    ch.relocate(0.5, 0.5);

    // Act
    ch.movePixelDistance(globalThis.J.PIXEL.Directions.RIGHT, 0.1);

    // Assert
    expect(ch._x).toBeGreaterThan(0.5);
  });

  it('movePixelDistance reverts when overlapping solid subcells', () =>
  {
    // Arrange
    globalThis.$gameMap.isPassable = function()
    {
      return false;
    };
    globalThis.PIXEL_CollisionManager.setupCollision();
    const ch = new globalThis.Game_CharacterBase();
    ch.initMembers();
    ch.relocate(0.5, 0.5);
    const before = ch._x;

    // Act
    ch.movePixelDistance(globalThis.J.PIXEL.Directions.RIGHT, 0.2);

    // Assert
    expect(ch._x).toBe(before);
  });

  it('stopPixelMoving syncs _realX/_realY to the logical tile position', () =>
  {
    // Arrange
    const ch = new globalThis.Game_CharacterBase();
    ch.initMembers();
    ch._x = 1.25;
    ch._y = 0.75;
    ch._realX = 9;
    ch._realY = 8;

    // Act
    ch.stopPixelMoving();

    // Assert
    expect(ch._realX).toBe(1.25);
    expect(ch._realY).toBe(0.75);
  });

  it('regionId samples the collision pivot tile when _x/_y are fractional', () =>
  {
    // Arrange
    let capturedX = -1;
    let capturedY = -1;
    globalThis.$gameMap = {
      regionId(x, y)
      {
        capturedX = x;
        capturedY = y;
        return 1;
      },
    };
    const ch = new globalThis.Game_CharacterBase();
    ch.initMembers();
    ch._x = 10.5356952975542;
    ch._y = 7.857090246365618;

    // Act
    const result = ch.regionId();

    // Assert
    expect(result).toBe(1);
    expect(capturedX).toBe(11);
    expect(capturedY).toBe(8);
  });

  it('recordPixelPosition appends fractional points when distance warrants', () =>
  {
    // Arrange
    const ch = new globalThis.Game_CharacterBase();
    ch.initMembers();
    ch._x = 0;
    ch._y = 0;
    ch.recordPixelPosition();
    ch._x = 0.2;
    ch._y = 0;

    // Act
    ch.recordPixelPosition();

    // Assert
    expect(ch.positionalRecords().length).toBe(2);
  });

  it('update ticks down the pixel move cooldown after the engine hook', () =>
  {
    // Arrange
    const ch = new globalThis.Game_CharacterBase();
    ch.initMembers();
    ch.setPixelMoveCooldown(1);

    // Act
    ch.update();

    // Assert
    expect(ch.getPixelMoveCooldown()).toBe(0);
  });
});
//endregion plugins/pixel/core/game-character-base-pixel.test.js
