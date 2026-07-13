//region plugins/pixel/ext/abs/game-player-abs-bridge.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import {
  installPixelAbsExtHostGlobals,
  installPixelCoreHostGlobals,
  setPluginContextToJBase,
  setPluginContextToJPixel,
  setPluginContextToJPixelAbsExt,
} from '../../fixtures/install-pixel-host-globals.js';

describe('J-ABS-Pixelistics Game_Player bridge (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installPixelCoreHostGlobals();

    setPluginContextToJBase();
    await import('../../../../../src/plugins/_base/_metadata/initialization.js');
    await import('../../../../../src/plugins/_base/objects/Game_Character.js');
    await import('../../../../../src/plugins/_base/objects/Game_Event.js');

    setPluginContextToJPixel();
    await import('../../../../../src/plugins/pixel/core/_metadata/initialization.js');

    await import('../../../../../src/plugins/pixel/core/objects/Game_CharacterBase.js');
    await import('../../../../../src/plugins/pixel/core/objects/Game_Character.js');
    await import('../../../../../src/plugins/pixel/core/objects/Game_Player.js');

    installPixelAbsExtHostGlobals();

    setPluginContextToJPixelAbsExt();
    await import('../../../../../src/plugins/pixel/ext/abs/_metadata/initialization.js');

    // patches globalThis.Game_Player.prototype directly, no vm involved.
    await import('../../../../../src/plugins/pixel/ext/abs/objects/Game_CharacterBase.js');
    await import('../../../../../src/plugins/pixel/ext/abs/objects/Game_Player.js');
  });

  it('updateDashing clears dash state while the pivot-guard blocks motion', () =>
  {
    // Arrange
    const p = {};
    p._dashing = true;
    p.isMoving = () => false;
    p.isMovePressed = () => false;
    p.canMove = () => true;
    p.isInVehicle = () => false;
    p.isDashButtonPressed = () => false;

    globalThis.$jabsEngine = {
      getPlayer1()
      {
        return {
          getCharacter: () => p,
          canBattlerMove: () => false,
          guarding: () => false,
        };
      },
    };

    // Act
    globalThis.Game_Player.prototype.updateDashing.call(p);

    // Assert
    expect(p._dashing).toBe(false);
  });

  it('moveByInput applies facing while the pivot-guard blocks translation', () =>
  {
    // Arrange
    const p = new globalThis.Game_Player();
    p.initMembers();

    let faced = 0;

    p.getVectorInputAngle = () => null;
    p.dir8ToAngle = () => 0;
    p.angleToNearestDirection = () => globalThis.J.PIXEL.Directions.RIGHT;
    p.setDirection = (d) => { faced = d; };
    p.checkEventTriggerTouchFront = () => {};
    p.stopFollowersPixelMoving = () => {};
    p.setMovePressed = () => {};
    p.setMovementSuccess = () => {};

    globalThis.Input.dir8 = globalThis.J.PIXEL.Directions.RIGHT;
    globalThis.$gameTemp.clearDestination = () => {};

    globalThis.$jabsEngine = {
      getPlayer1()
      {
        return {
          getCharacter: () => p,
          canBattlerMove: () => false,
          guarding: () => false,
        };
      },
    };

    // Act
    globalThis.Game_Player.prototype.moveByInput.call(p);

    // Assert
    expect(faced).toBe(globalThis.J.PIXEL.Directions.RIGHT);
  });
});
//endregion plugins/pixel/ext/abs/game-player-abs-bridge.test.js
