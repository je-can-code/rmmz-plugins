//region plugins/pixel/ext/abs/game-player-abs-bridge.test.js
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { loadPixelAbsStackPluginVm } from '../../pixel-vm.js';

describe('J-ABS-Pixelistics Game_Player bridge', () =>
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

  it('updateDashing clears dash state while pivot-guard blocks motion', () =>
  {
    const p = {};

    p._dashing = true;
    p.isMoving = function()
    {
      return false;
    };
    p.isMovePressed = function()
    {
      return false;
    };
    p.canMove = function()
    {
      return true;
    };
    p.isInVehicle = function()
    {
      return false;
    };
    p.isDashButtonPressed = function()
    {
      return false;
    };

    sandbox.$jabsEngine = {
      getPlayer1()
      {
        return {
          getCharacter()
          {
            return p;
          },
          canBattlerMove()
          {
            return false;
          },
          guarding()
          {
            return false;
          },
        };
      },
    };

    sandbox.Game_Player.prototype.updateDashing.call(p);

    expect(p._dashing).toBe(false);
  });

  it('moveByInput applies facing while pivot-guard blocks translation', () =>
  {
    const p = new sandbox.Game_Player();

    p.initMembers();

    let faced = 0;

    p.getVectorInputAngle = function()
    {
      return null;
    };
    p.dir8ToAngle = function()
    {
      return 0;
    };
    p.angleToNearestDirection = function()
    {
      return sandbox.J.PIXEL.Directions.RIGHT;
    };
    p.setDirection = function(d)
    {
      faced = d;
    };
    p.checkEventTriggerTouchFront = function()
    {
    };
    p.stopFollowersPixelMoving = function()
    {
    };
    p.setMovePressed = function()
    {
    };
    p.setMovementSuccess = function()
    {
    };

    sandbox.Input.dir8 = sandbox.J.PIXEL.Directions.RIGHT;
    sandbox.$gameTemp.clearDestination = function()
    {
    };

    sandbox.$jabsEngine = {
      getPlayer1()
      {
        return {
          getCharacter()
          {
            return p;
          },
          canBattlerMove()
          {
            return false;
          },
          guarding()
          {
            return false;
          },
        };
      },
    };

    sandbox.Game_Player.prototype.moveByInput.call(p);

    expect(faced).toBe(sandbox.J.PIXEL.Directions.RIGHT);
  });
});
//endregion plugins/pixel/ext/abs/game-player-abs-bridge.test.js
