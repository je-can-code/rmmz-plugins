//region plugins/pixel/core/directions-and-character-constants.test.js
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { loadPixelCorePluginVm } from '../pixel-vm.js';

describe('J-Pixelistics direction and route constants', () =>
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

  it('J.PIXEL.Directions matches RMMZ-style numeric constants', () =>
  {
    const D = sandbox.J.PIXEL.Directions;

    expect(D.DOWN).toBe(2);
    expect(D.LEFT).toBe(4);
    expect(D.RIGHT).toBe(6);
    expect(D.UP).toBe(8);
    expect(D.LOWERLEFT).toBe(1);
    expect(D.LOWERRIGHT).toBe(3);
    expect(D.UPPERLEFT).toBe(7);
    expect(D.UPPERRIGHT).toBe(9);
  });

  it('Game_Character.pixelRepeatableMoveCommandCodes lists expected route opcode ids', () =>
  {
    const codes = sandbox.Game_Character.pixelRepeatableMoveCommandCodes;

    expect(Array.isArray(codes)).toBe(true);
    expect(codes.includes(1)).toBe(true);
    expect(codes.includes(9)).toBe(true);
    expect(codes.includes(13)).toBe(true);
  });
});
//endregion plugins/pixel/core/directions-and-character-constants.test.js
