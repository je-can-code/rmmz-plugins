//region plugins/pixel/core/game-character-base-pixel.test.js
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { loadPixelCorePluginVm } from '../pixel-vm.js';

describe('J-Pixelistics Game_CharacterBase pixel movement helpers', () =>
{
  let sandbox;

  beforeEach(() =>
  {
    sandbox = { console };
    loadPixelCorePluginVm(sandbox);
    sandbox.PIXEL_CollisionManager.initConfig();
    sandbox.PIXEL_CollisionManager.setupCollision();
  });

  afterEach(() =>
  {
    sandbox = null;
  });

  it('initMembers wires initPixelMovementMembers state', () =>
  {
    const ch = new sandbox.Game_CharacterBase();

    ch.initMembers();

    expect(ch._j._pixel._steps).toBe(0);
    expect(ch._pixelState()._moveCooldown).toBe(0);
  });

  it('setPixelMoveCooldown and cooldown queries round-trip', () =>
  {
    const ch = new sandbox.Game_CharacterBase();

    ch.initMembers();
    ch.setPixelMoveCooldown(2);

    expect(ch.isPixelOnCooldown()).toBe(true);
    ch.decrementPixelMoveCooldown();
    expect(ch.getPixelMoveCooldown()).toBe(1);
  });

  it('movePixelDistance advances logical X on an open map', () =>
  {
    const ch = new sandbox.Game_CharacterBase();

    ch.initMembers();
    ch.relocate(0.5, 0.5);
    ch.movePixelDistance(sandbox.J.PIXEL.Directions.RIGHT, 0.1);

    expect(ch._x).toBeGreaterThan(0.5);
  });

  it('movePixelDistance reverts when overlapping solid subcells', () =>
  {
    sandbox.$gameMap.isPassable = function()
    {
      return false;
    };
    sandbox.PIXEL_CollisionManager.setupCollision();

    const ch = new sandbox.Game_CharacterBase();

    ch.initMembers();
    ch.relocate(0.5, 0.5);
    const before = ch._x;

    ch.movePixelDistance(sandbox.J.PIXEL.Directions.RIGHT, 0.2);

    expect(ch._x).toBe(before);
  });

  it('stopPixelMoving syncs _realX/_realY to logical tiles', () =>
  {
    const ch = new sandbox.Game_CharacterBase();

    ch.initMembers();
    ch._x = 1.25;
    ch._y = 0.75;
    ch._realX = 9;
    ch._realY = 8;
    ch.stopPixelMoving();

    expect(ch._realX).toBe(1.25);
    expect(ch._realY).toBe(0.75);
  });

  it('regionId samples the collision pivot tile when _x/_y are fractional', () =>
  {
    let capturedX = -1;
    let capturedY = -1;

    sandbox.$gameMap = {
      regionId(x, y)
      {
        capturedX = x;
        capturedY = y;

        return 1;
      },
    };

    const ch = new sandbox.Game_CharacterBase();

    ch.initMembers();
    ch._x = 10.5356952975542;
    ch._y = 7.857090246365618;

    expect(ch.regionId()).toBe(1);
    expect(capturedX).toBe(11);
    expect(capturedY).toBe(8);
  });

  it('recordPixelPosition appends fractional points when distance warrants', () =>
  {
    const ch = new sandbox.Game_CharacterBase();

    ch.initMembers();
    ch._x = 0;
    ch._y = 0;
    ch.recordPixelPosition();
    ch._x = 0.2;
    ch._y = 0;
    ch.recordPixelPosition();

    expect(ch.positionalRecords().length).toBe(2);
  });

  it('update ticks down pixel move cooldown after the engine hook', () =>
  {
    const ch = new sandbox.Game_CharacterBase();

    ch.initMembers();
    ch.setPixelMoveCooldown(1);
    ch.update();

    expect(ch.getPixelMoveCooldown()).toBe(0);
  });
});
//endregion plugins/pixel/core/game-character-base-pixel.test.js
