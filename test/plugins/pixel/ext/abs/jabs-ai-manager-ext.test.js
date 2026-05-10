//region plugins/pixel/ext/abs/jabs-ai-manager-ext.test.js
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { loadPixelAbsStackPluginVm } from '../../pixel-vm.js';

describe('J-ABS-Pixelistics JABS_AiManager overrides', () =>
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

  it('moveIdly forwards to updatePixelIdleWander on the battler', () =>
  {
    const b = new sandbox.JABS_Battler();
    let calls = 0;

    b.updatePixelIdleWander = function()
    {
      calls++;
    };

    sandbox.JABS_AiManager.moveIdly(b);

    expect(calls).toBe(1);
  });

  it('goHome asks for smart movement then idles when already home', () =>
  {
    const b = new sandbox.JABS_Battler();
    let sx = null;
    let sy = null;

    b.__distHome = 0.2;
    b.smartMoveTowardCoordinates = function(x, y)
    {
      sx = x;
      sy = y;
    };

    sandbox.JABS_AiManager.goHome(b);

    expect(sx).toBe(0);
    expect(sy).toBe(0);
    expect(b.__idle).toBe(true);
  });

  it('rubberbandAlly locks combat state and snaps the ally character', () =>
  {
    let jumped = 0;
    let stopped = 0;
    const chr = {
      x: 5,
      y: 3,
      jumpToPlayer()
      {
        jumped++;
      },
      stopPixelMoving()
      {
        stopped++;
      },
    };
    const b = new sandbox.JABS_Battler();

    b.getCharacter = function()
    {
      return chr;
    };

    sandbox.JABS_AiManager.rubberbandAlly(b);

    expect(jumped).toBe(1);
    expect(stopped).toBe(1);
  });

  it('moveTowardSlotIfNeeded stops micro-motion when already within tolerance', () =>
  {
    let stopCalls = 0;
    const chr = {
      x: 0.1,
      y: 0,
      stopPixelMoving()
      {
        stopCalls++;
      },
      isPixelOnCooldown()
      {
        return false;
      },
      setPixelMoveCooldown: () =>
      {
      },
    };
    const b = new sandbox.JABS_Battler();

    b.__canMove = true;
    b.isDodging = function()
    {
      return false;
    };
    b.guarding = function()
    {
      return false;
    };
    b.getCharacter = function()
    {
      return chr;
    };
    b.smartMoveTowardCoordinates = function()
    {
      throw new Error('should not nudge when within tolerance');
    };

    sandbox.JABS_AiManager.moveTowardSlotIfNeeded(b, 0, 0);

    expect(stopCalls).toBe(1);
  });

  it('moveTowardSlotIfNeeded moves when far outside the near ring', () =>
  {
    let moves = 0;
    const chr = {
      x: 5,
      y: 0,
      stopPixelMoving: () =>
      {
      },
      isPixelOnCooldown()
      {
        return false;
      },
      setPixelMoveCooldown: () =>
      {
      },
    };
    const b = new sandbox.JABS_Battler();

    b.__canMove = true;
    b.isDodging = function()
    {
      return false;
    };
    b.guarding = function()
    {
      return false;
    };
    b.getCharacter = function()
    {
      return chr;
    };
    b.smartMoveTowardCoordinates = function()
    {
      moves++;
    };

    sandbox.JABS_AiManager.moveTowardSlotIfNeeded(b, 0, 0);

    expect(moves).toBe(1);
  });

  it('moveTowardSlotIfNeeded skips nudges while the character pixel cooldown is active', () =>
  {
    let moves = 0;
    const chr = {
      x: 0.55,
      y: 0,
      stopPixelMoving: () =>
      {
      },
      isPixelOnCooldown()
      {
        return true;
      },
      setPixelMoveCooldown: () =>
      {
      },
    };
    const b = new sandbox.JABS_Battler();

    b.__canMove = true;
    b.isDodging = function()
    {
      return false;
    };
    b.guarding = function()
    {
      return false;
    };
    b.getCharacter = function()
    {
      return chr;
    };
    b.smartMoveTowardCoordinates = function()
    {
      moves++;
    };

    sandbox.JABS_AiManager.moveTowardSlotIfNeeded(b, 0, 0);

    expect(moves).toBe(0);
  });
});
//endregion plugins/pixel/ext/abs/jabs-ai-manager-ext.test.js