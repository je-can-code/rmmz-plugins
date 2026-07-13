//region plugins/pixel/ext/abs/jabs-ai-manager-ext.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import {
  installPixelAbsExtHostGlobals,
  installPixelCoreHostGlobals,
  setPluginContextToJBase,
  setPluginContextToJPixel,
  setPluginContextToJPixelAbsExt,
} from '../../fixtures/install-pixel-host-globals.js';

describe('J-ABS-Pixelistics JABS_AiManager overrides (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installPixelCoreHostGlobals();

    setPluginContextToJBase();
    await import('../../../../../src/plugins/_base/_metadata/initialization.js');

    setPluginContextToJPixel();
    await import('../../../../../src/plugins/pixel/core/_metadata/initialization.js');

    ({ default: globalThis.PIXEL_CollisionManager } = await import('../../../../../src/plugins/pixel/core/managers/PIXEL_CollisionManager.js'));

    installPixelAbsExtHostGlobals();

    setPluginContextToJPixelAbsExt();
    await import('../../../../../src/plugins/pixel/ext/abs/_metadata/initialization.js');

    // patches the fake JABS_AiManager/JABS_Battler stand-ins directly, no vm involved.
    await import('../../../../../src/plugins/pixel/ext/abs/managers/JABS_AiManager.js');
    await import('../../../../../src/plugins/pixel/ext/abs/objects/JABS_Battler.js');
  });

  it('moveIdly forwards to updatePixelIdleWander on the battler', () =>
  {
    // Arrange
    const b = new globalThis.JABS_Battler();
    let calls = 0;
    b.updatePixelIdleWander = function()
    {
      calls++;
    };

    // Act
    globalThis.JABS_AiManager.moveIdly(b);

    // Assert
    expect(calls).toBe(1);
  });

  it('goHome asks for smart movement toward the home coordinates', () =>
  {
    // Arrange
    const b = new globalThis.JABS_Battler();
    let sx = null;
    let sy = null;
    b.__distHome = 0.2;
    b.smartMoveTowardCoordinates = function(x, y)
    {
      sx = x;
      sy = y;
    };

    // Act
    globalThis.JABS_AiManager.goHome(b);

    // Assert
    expect(sx).toBe(0);
    expect(sy).toBe(0);
  });

  it('goHome idles the battler once already home', () =>
  {
    // Arrange
    const b = new globalThis.JABS_Battler();
    b.__distHome = 0.2;
    b.smartMoveTowardCoordinates = () => {};

    // Act
    globalThis.JABS_AiManager.goHome(b);

    // Assert
    expect(b.__idle).toBe(true);
  });

  it('rubberbandAlly snaps the ally character to the player', () =>
  {
    // Arrange
    let jumped = 0;
    const chr = {
      x: 5,
      y: 3,
      jumpToPlayer: () => { jumped++; },
      stopPixelMoving: () => {},
    };
    const b = new globalThis.JABS_Battler();
    b.getCharacter = () => chr;

    // Act
    globalThis.JABS_AiManager.rubberbandAlly(b);

    // Assert
    expect(jumped).toBe(1);
  });

  it('rubberbandAlly stops any in-flight pixel movement on the ally character', () =>
  {
    // Arrange
    let stopped = 0;
    const chr = {
      x: 5,
      y: 3,
      jumpToPlayer: () => {},
      stopPixelMoving: () => { stopped++; },
    };
    const b = new globalThis.JABS_Battler();
    b.getCharacter = () => chr;

    // Act
    globalThis.JABS_AiManager.rubberbandAlly(b);

    // Assert
    expect(stopped).toBe(1);
  });

  describe('moveTowardSlotIfNeeded', () =>
  {
    it('stops micro-motion when already within tolerance of the slot', () =>
    {
      // Arrange
      let stopCalls = 0;
      const chr = {
        x: 0.1,
        y: 0,
        stopPixelMoving: () => { stopCalls++; },
        isPixelOnCooldown: () => false,
        setPixelMoveCooldown: () => {},
      };
      const b = new globalThis.JABS_Battler();
      b.__canMove = true;
      b.isDodging = () => false;
      b.guarding = () => false;
      b.getCharacter = () => chr;
      b.smartMoveTowardCoordinates = () =>
      {
        throw new Error('should not nudge when within tolerance');
      };

      // Act
      globalThis.JABS_AiManager.moveTowardSlotIfNeeded(b, 0, 0);

      // Assert
      expect(stopCalls).toBe(1);
    });

    it('moves when far outside the near ring', () =>
    {
      // Arrange
      let moves = 0;
      const chr = {
        x: 5,
        y: 0,
        stopPixelMoving: () => {},
        isPixelOnCooldown: () => false,
        setPixelMoveCooldown: () => {},
      };
      const b = new globalThis.JABS_Battler();
      b.__canMove = true;
      b.isDodging = () => false;
      b.guarding = () => false;
      b.getCharacter = () => chr;
      b.smartMoveTowardCoordinates = () => { moves++; };

      // Act
      globalThis.JABS_AiManager.moveTowardSlotIfNeeded(b, 0, 0);

      // Assert
      expect(moves).toBe(1);
    });

    it('skips nudges while the character pixel cooldown is active', () =>
    {
      // Arrange
      let moves = 0;
      const chr = {
        x: 0.55,
        y: 0,
        stopPixelMoving: () => {},
        isPixelOnCooldown: () => true,
        setPixelMoveCooldown: () => {},
      };
      const b = new globalThis.JABS_Battler();
      b.__canMove = true;
      b.isDodging = () => false;
      b.guarding = () => false;
      b.getCharacter = () => chr;
      b.smartMoveTowardCoordinates = () => { moves++; };

      // Act
      globalThis.JABS_AiManager.moveTowardSlotIfNeeded(b, 0, 0);

      // Assert
      expect(moves).toBe(0);
    });
  });
});
//endregion plugins/pixel/ext/abs/jabs-ai-manager-ext.test.js
