//region plugins/pixel/ext/abs/jabs-battler-ext.test.js
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { loadPixelAbsStackPluginVm } from '../../pixel-vm.js';

describe('J-ABS-Pixelistics JABS_Battler extensions', () =>
{
  let sandbox;

  beforeEach(() =>
  {
    sandbox = { console };
    loadPixelAbsStackPluginVm(sandbox);
  });

  afterEach(() =>
  {
    sandbox = null;
  });

  it('initIdleInfo seeds pixel idle wander fields', () =>
  {
    const b = new sandbox.JABS_Battler();

    b.initIdleInfo();

    expect(b._pixelIdleDest).toBe(null);
    expect(b._pixelIdleWait).toBe(0);
    expect(b._pixelIdleStuckFrames).toBe(0);
  });

  it('isHome uses distanceToHome under half a tile', () =>
  {
    const b = new sandbox.JABS_Battler();

    b.__distHome = 0.49;
    expect(b.isHome()).toBe(true);

    b.__distHome = 0.51;
    expect(b.isHome()).toBe(false);
  });

  it('destroy rebuilds collision when an enemy battler is removed', () =>
  {
    let setups = 0;
    const orig = sandbox.PIXEL_CollisionManager.setupCollision;

    sandbox.PIXEL_CollisionManager.setupCollision = function()
    {
      setups++;
      return orig.apply(this, arguments);
    };

    const b = new sandbox.JABS_Battler();

    b.__battlerSubject = { isActor: () => false };
    b.destroy();

    expect(setups).toBeGreaterThanOrEqual(1);

    sandbox.PIXEL_CollisionManager.setupCollision = orig;
  });

  it('destroy skips collision rebuild for actor battlers', () =>
  {
    let setups = 0;
    const orig = sandbox.PIXEL_CollisionManager.setupCollision;

    sandbox.PIXEL_CollisionManager.setupCollision = function()
    {
      setups++;
      return orig.apply(this, arguments);
    };

    const b = new sandbox.JABS_Battler();

    b.__battlerSubject = { isActor: () => true };
    b.destroy();

    expect(setups).toBe(0);

    sandbox.PIXEL_CollisionManager.setupCollision = orig;
  });

  it('getProjectileSpawnBaseDirection maps leader vector input to 8-dir', () =>
  {
    const fakePlayer = {
      getVectorInputAngle()
      {
        return 45;
      },
    };
    sandbox.$gamePlayer = fakePlayer;

    const b = new sandbox.JABS_Battler();
    b.getCharacter = () => fakePlayer;

    expect(b.getProjectileSpawnBaseDirection()).toBe(sandbox.J.ABS.Directions.LOWERRIGHT);
  });

  it('getProjectileSpawnBaseDirection falls back when vector input is null', () =>
  {
    const fakePlayer = {
      getVectorInputAngle()
      {
        return null;
      },
      direction()
      {
        return 8;
      },
    };
    sandbox.$gamePlayer = fakePlayer;

    const b = new sandbox.JABS_Battler();
    b.getCharacter = () => fakePlayer;

    expect(b.getProjectileSpawnBaseDirection()).toBe(8);
  });

  it('getProjectileSpawnBaseDirection uses facing when direction fix (strafe) is active, not movement vector', () =>
  {
    const fakePlayer = {
      getVectorInputAngle()
      {
        return 180;
      },
      isDirectionFixed()
      {
        return true;
      },
      direction()
      {
        return 6;
      },
    };
    sandbox.$gamePlayer = fakePlayer;

    const b = new sandbox.JABS_Battler();
    b.getCharacter = () => fakePlayer;

    expect(b.getProjectileSpawnBaseDirection()).toBe(6);
  });
});
//endregion plugins/pixel/ext/abs/jabs-battler-ext.test.js
