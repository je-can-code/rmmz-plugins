//region plugins/pixel/ext/abs/_component/jabs-battler-ext.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import {
  installPixelAbsExtHostGlobals,
  installPixelCoreHostGlobals,
  setPluginContextToJBase,
  setPluginContextToJPixel,
  setPluginContextToJPixelAbsExt,
} from '../../../_component/fixtures/install-pixel-host-globals.js';

describe('J-ABS-Pixelistics JABS_Battler extensions (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installPixelCoreHostGlobals();

    setPluginContextToJBase();
    await import('../../../../../../src/plugins/_base/_metadata/initialization.js');

    setPluginContextToJPixel();
    await import('../../../../../../src/plugins/pixel/core/_metadata/initialization.js');

    ({ default: globalThis.PIXEL_CollisionManager } = await import('../../../../../../src/plugins/pixel/core/managers/PIXEL_CollisionManager.js'));
    globalThis.PIXEL_CollisionManager.initConfig();
    globalThis.PIXEL_CollisionManager.setupCollision();

    installPixelAbsExtHostGlobals();

    setPluginContextToJPixelAbsExt();
    await import('../../../../../../src/plugins/pixel/ext/abs/_metadata/initialization.js');

    // patches the fake JABS_Battler stand-in directly, no vm involved.
    await import('../../../../../../src/plugins/pixel/ext/abs/objects/JABS_Battler.js');
  });

  it('initIdleInfo seeds the pixel idle destination to null', () =>
  {
    // Arrange
    const b = new globalThis.JABS_Battler();

    // Act
    b.initIdleInfo();

    // Assert
    expect(b._pixelIdleDest).toBe(null);
  });

  it('initIdleInfo seeds the pixel idle wait counter to 0', () =>
  {
    // Arrange
    const b = new globalThis.JABS_Battler();

    // Act
    b.initIdleInfo();

    // Assert
    expect(b._pixelIdleWait).toBe(0);
  });

  it('initIdleInfo seeds the pixel idle stuck-frame counter to 0', () =>
  {
    // Arrange
    const b = new globalThis.JABS_Battler();

    // Act
    b.initIdleInfo();

    // Assert
    expect(b._pixelIdleStuckFrames).toBe(0);
  });

  describe('isHome', () =>
  {
    it('is true when distanceToHome is under half a tile', () =>
    {
      // Arrange
      const b = new globalThis.JABS_Battler();
      b.__distHome = 0.49;

      // Act
      const result = b.isHome();

      // Assert
      expect(result).toBe(true);
    });

    it('is false when distanceToHome is over half a tile', () =>
    {
      // Arrange
      const b = new globalThis.JABS_Battler();
      b.__distHome = 0.51;

      // Act
      const result = b.isHome();

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('destroy', () =>
  {
    it('rebuilds collision when an enemy battler is removed', () =>
    {
      // Arrange
      let setups = 0;
      const orig = globalThis.PIXEL_CollisionManager.setupCollision;
      globalThis.PIXEL_CollisionManager.setupCollision = function()
      {
        setups++;
        return orig.apply(this, arguments);
      };
      const b = new globalThis.JABS_Battler();
      b.__battlerSubject = { isActor: () => false };

      // Act
      b.destroy();

      // Assert
      expect(setups).toBeGreaterThanOrEqual(1);
      globalThis.PIXEL_CollisionManager.setupCollision = orig;
    });

    it('skips the collision rebuild for actor battlers', () =>
    {
      // Arrange
      let setups = 0;
      const orig = globalThis.PIXEL_CollisionManager.setupCollision;
      globalThis.PIXEL_CollisionManager.setupCollision = function()
      {
        setups++;
        return orig.apply(this, arguments);
      };
      const b = new globalThis.JABS_Battler();
      b.__battlerSubject = { isActor: () => true };

      // Act
      b.destroy();

      // Assert
      expect(setups).toBe(0);
      globalThis.PIXEL_CollisionManager.setupCollision = orig;
    });
  });

  describe('getProjectileSpawnBaseDirection', () =>
  {
    it('maps the leader\'s vector input angle to an 8-directional facing', () =>
    {
      // Arrange
      const fakePlayer = {
        getVectorInputAngle: () => 45,
        isDirectionFixed: () => false,
      };
      globalThis.$gamePlayer = fakePlayer;
      const b = new globalThis.JABS_Battler();
      b.getCharacter = () => fakePlayer;

      // Act
      const result = b.getProjectileSpawnBaseDirection();

      // Assert
      expect(result).toBe(globalThis.J.ABS.Directions.LOWERRIGHT);
    });

    it('falls back to the character\'s facing when vector input is null', () =>
    {
      // Arrange
      const fakePlayer = {
        getVectorInputAngle: () => null,
        direction: () => 8,
        isDirectionFixed: () => false,
      };
      globalThis.$gamePlayer = fakePlayer;
      const b = new globalThis.JABS_Battler();
      b.getCharacter = () => fakePlayer;

      // Act
      const result = b.getProjectileSpawnBaseDirection();

      // Assert
      expect(result).toBe(8);
    });

    it('uses facing when direction fix (strafe) is active, not the movement vector', () =>
    {
      // Arrange
      const fakePlayer = {
        getVectorInputAngle: () => 180,
        isDirectionFixed: () => true,
        direction: () => 6,
      };
      globalThis.$gamePlayer = fakePlayer;
      const b = new globalThis.JABS_Battler();
      b.getCharacter = () => fakePlayer;

      // Act
      const result = b.getProjectileSpawnBaseDirection();

      // Assert
      expect(result).toBe(6);
    });
  });
});
//endregion plugins/pixel/ext/abs/_component/jabs-battler-ext.test.js
