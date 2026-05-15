//region plugins/pixel/ext/abs/metadata.test.js
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { DEFAULT_PIXEL_ABS_EXT_PLUGIN_PARAMS } from '../../fixtures/pixel-plugin-params.js';
import { loadPixelAbsStackPluginVm } from '../../pixel-vm.js';

describe('J-ABS-Pixelistics metadata', () =>
{
  let sandbox;

  beforeAll(() =>
  {
    sandbox = { console };
    loadPixelAbsStackPluginVm(sandbox);
  });

  afterAll(() =>
  {
    sandbox = null;
  });

  it('exposes IdleWanderRadius from extension params', () =>
  {
    expect(sandbox.J.PIXEL.EXT.ABS.Metadata.IdleWanderRadius).toBe(1.50);
  });

  it('exposes default enemy hitbox dimensions from extension params', () =>
  {
    expect(sandbox.J.PIXEL.EXT.ABS.Metadata.DefaultEnemyHitboxWidth).toBe(0.80);
    expect(sandbox.J.PIXEL.EXT.ABS.Metadata.DefaultEnemyHitboxHeight).toBe(0.50);
  });

  it('exposes hitbox reveal configuration from extension params', () =>
  {
    expect(sandbox.J.PIXEL.EXT.ABS.Metadata.EnemyHitboxOutlineAlwaysActive).toBe(false);
    expect(sandbox.J.PIXEL.EXT.ABS.Metadata.DefaultEnemyHitboxRevealRange).toBe(6.00);
  });
});

describe('J-ABS-Pixelistics metadata with custom extension params', () =>
{
  let sandbox;

  beforeAll(() =>
  {
    sandbox = { console };
    loadPixelAbsStackPluginVm(sandbox, {
      extParams: {
        ...DEFAULT_PIXEL_ABS_EXT_PLUGIN_PARAMS,
        idleWanderRadius: '2.75',
        defaultEnemyHitboxWidth: '1.20',
        defaultEnemyHitboxHeight: '0.65',
        outlineAlwaysActive: 'true',
        defaultHitboxRevealRange: '9.50',
      },
    });
  });

  afterAll(() =>
  {
    sandbox = null;
  });

  it('parses IdleWanderRadius from strings', () =>
  {
    expect(sandbox.J.PIXEL.EXT.ABS.Metadata.IdleWanderRadius).toBe(2.75);
  });

  it('parses default enemy hitbox dimensions from strings', () =>
  {
    expect(sandbox.J.PIXEL.EXT.ABS.Metadata.DefaultEnemyHitboxWidth).toBe(1.20);
    expect(sandbox.J.PIXEL.EXT.ABS.Metadata.DefaultEnemyHitboxHeight).toBe(0.65);
  });

  it('parses hitbox reveal configuration from strings', () =>
  {
    expect(sandbox.J.PIXEL.EXT.ABS.Metadata.EnemyHitboxOutlineAlwaysActive).toBe(true);
    expect(sandbox.J.PIXEL.EXT.ABS.Metadata.DefaultEnemyHitboxRevealRange).toBe(9.50);
  });
});

describe('J-ABS-Pixelistics metadata with missing reveal params', () =>
{
  let sandbox;

  beforeAll(() =>
  {
    sandbox = { console };
    loadPixelAbsStackPluginVm(sandbox, {
      extParams: {
        idleWanderRadius: '1.50',
        defaultEnemyHitboxWidth: '0.80',
        defaultEnemyHitboxHeight: '0.50',
      },
    });
  });

  afterAll(() =>
  {
    sandbox = null;
  });

  it('falls back to the intended reveal defaults when plugin manager data is stale', () =>
  {
    expect(sandbox.J.PIXEL.EXT.ABS.Metadata.EnemyHitboxOutlineAlwaysActive).toBe(false);
    expect(sandbox.J.PIXEL.EXT.ABS.Metadata.DefaultEnemyHitboxRevealRange).toBe(6.00);
  });
});
//endregion plugins/pixel/ext/abs/metadata.test.js