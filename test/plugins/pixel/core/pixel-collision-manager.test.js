//region plugins/pixel/core/pixel-collision-manager.test.js
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { DEFAULT_PIXEL_CORE_PLUGIN_PARAMS } from '../fixtures/pixel-plugin-params.js';
import { loadPixelCorePluginVm } from '../pixel-vm.js';

function freshOpenCollision(sandbox)
{
  sandbox.PIXEL_CollisionManager.initConfig();
  sandbox.PIXEL_CollisionManager.setupCollision();
}

describe('J-Pixelistics PIXEL_CollisionManager', () =>
{
  let sandbox;

  beforeEach(() =>
  {
    sandbox = { console };
    loadPixelCorePluginVm(sandbox);
  });

  afterEach(() =>
  {
    sandbox = null;
  });

  it('initConfig runs without throwing', () =>
  {
    expect(() => sandbox.PIXEL_CollisionManager.initConfig()).not.toThrow();
  });

  it('setupCollision builds an open map and isPositionPassable returns true inside bounds', () =>
  {
    freshOpenCollision(sandbox);

    expect(sandbox.PIXEL_CollisionManager.isPositionPassable(0.5, 0.5, sandbox.J.PIXEL.Directions.DOWN)).toBe(true);
  });

  it('marks every subcell solid when tile passability never allows entry', () =>
  {
    sandbox.$gameMap.isPassable = function()
    {
      return false;
    };
    freshOpenCollision(sandbox);

    expect(sandbox.PIXEL_CollisionManager.isPositionPassable(0.5, 0.5, sandbox.J.PIXEL.Directions.RIGHT)).toBe(false);
  });

  it('returns false for positions outside the map', () =>
  {
    freshOpenCollision(sandbox);

    expect(sandbox.PIXEL_CollisionManager.isPositionPassable(-1, 0.5, sandbox.J.PIXEL.Directions.RIGHT)).toBe(
      false,
    );
    expect(sandbox.PIXEL_CollisionManager.isPositionPassable(5, 0.5, sandbox.J.PIXEL.Directions.RIGHT)).toBe(
      false,
    );
  });

  it('skips rebuilding when $gameMap is missing', () =>
  {
    const prev = sandbox.$gameMap;

    sandbox.$gameMap = null;
    expect(() => sandbox.PIXEL_CollisionManager.setupCollision()).not.toThrow();
    sandbox.$gameMap = prev;
  });

  it('skips rebuilding when $dataMap is missing', () =>
  {
    const prev = sandbox.$dataMap;

    sandbox.$dataMap = null;
    expect(() => sandbox.PIXEL_CollisionManager.setupCollision()).not.toThrow();
    sandbox.$dataMap = prev;
  });

  it('sizes the subcell table by collisionStepCount on a 2×2 map', () =>
  {
    const tableLen = (step) =>
    {
      sandbox = { console };
      loadPixelCorePluginVm(sandbox, {
        coreParams: {
          ...DEFAULT_PIXEL_CORE_PLUGIN_PARAMS,
          collisionStepCount: `${step}`,
        },
      });
      freshOpenCollision(sandbox);

      return sandbox.PIXEL_CollisionManager._table.length;
    };

    expect(tableLen(1)).toBe(4);
    expect(tableLen(2)).toBe(16);
    expect(tableLen(4)).toBe(64);
  });

  it('derives collisionSize from collisionStepCount', () =>
  {
    sandbox = { console };
    loadPixelCorePluginVm(sandbox, {
      coreParams: {
        ...DEFAULT_PIXEL_CORE_PLUGIN_PARAMS,
        collisionStepCount: '2',
      },
    });
    sandbox.PIXEL_CollisionManager.initConfig();

    expect(sandbox.PIXEL_CollisionManager.collisionStepCount).toBe(2);
    expect(sandbox.PIXEL_CollisionManager.collisionSize).toBe(0.5);
  });

  it('treats VerticalLine as blocking vertical entry only', () =>
  {
    const Codes = sandbox.PIXEL_CollisionManager.Codes;

    freshOpenCollision(sandbox);
    sandbox.PIXEL_CollisionManager._set(0.5, 0.5, Codes.VerticalLine);

    expect(sandbox.PIXEL_CollisionManager.isPositionPassable(0.5, 0.5, sandbox.J.PIXEL.Directions.UP)).toBe(
      false,
    );
    expect(sandbox.PIXEL_CollisionManager.isPositionPassable(0.5, 0.5, sandbox.J.PIXEL.Directions.RIGHT)).toBe(
      true,
    );
  });

  it('treats HorizontalLine as blocking horizontal entry only', () =>
  {
    const Codes = sandbox.PIXEL_CollisionManager.Codes;

    freshOpenCollision(sandbox);
    sandbox.PIXEL_CollisionManager._set(0.5, 0.5, Codes.HorizontalLine);

    expect(sandbox.PIXEL_CollisionManager.isPositionPassable(0.5, 0.5, sandbox.J.PIXEL.Directions.LEFT)).toBe(
      false,
    );
    expect(sandbox.PIXEL_CollisionManager.isPositionPassable(0.5, 0.5, sandbox.J.PIXEL.Directions.DOWN)).toBe(
      true,
    );
  });

  it('blocks movement into corners from every direction', () =>
  {
    const Codes = sandbox.PIXEL_CollisionManager.Codes;

    freshOpenCollision(sandbox);
    sandbox.PIXEL_CollisionManager._set(0.25, 0.25, Codes.CornerTopLeft);

    expect(sandbox.PIXEL_CollisionManager.isPositionPassable(0.25, 0.25, sandbox.J.PIXEL.Directions.RIGHT)).toBe(
      false,
    );
  });

  it('respects EdgeLeft for directionally blocked approach', () =>
  {
    const Codes = sandbox.PIXEL_CollisionManager.Codes;

    freshOpenCollision(sandbox);
    sandbox.PIXEL_CollisionManager._set(0.5, 0.5, Codes.EdgeLeft);

    expect(sandbox.PIXEL_CollisionManager.isPositionPassable(0.5, 0.5, sandbox.J.PIXEL.Directions.LEFT)).toBe(
      false,
    );
    expect(sandbox.PIXEL_CollisionManager.isPositionPassable(0.5, 0.5, sandbox.J.PIXEL.Directions.RIGHT)).toBe(
      true,
    );
  });

  it('defaults unknown table codes to passable', () =>
  {
    freshOpenCollision(sandbox);
    sandbox.PIXEL_CollisionManager._set(0.5, 0.5, 99999);

    expect(sandbox.PIXEL_CollisionManager.isPositionPassable(0.5, 0.5, sandbox.J.PIXEL.Directions.DOWN)).toBe(
      true,
    );
  });
});
//endregion plugins/pixel/core/pixel-collision-manager.test.js
