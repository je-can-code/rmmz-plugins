//region plugins/pixel/ext/abs/jabs-formation-helpers.test.js
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { loadPixelAbsStackPluginVm } from '../../pixel-vm.js';

describe('J-ABS-Pixelistics formation helpers on JABS_AiManager', () =>
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

  it('calculateFormationSlotCoordinates offsets by half a tile toward centers', () =>
  {
    const [sx, sy] = sandbox.JABS_AiManager.calculateFormationSlotCoordinates(1, 0.5, 2, -0.5);

    expect(sx).toBe(2);
    expect(sy).toBe(2);
  });

  it('isWithinTolerance uses Euclidean distance on fractional coordinates', () =>
  {
    const ally = {
      getCharacter()
      {
        return { x: 0.3, y: 0 };
      },
    };

    expect(sandbox.JABS_AiManager.isWithinTolerance(ally, 0, 0, 0.5)).toBe(true);
    expect(sandbox.JABS_AiManager.isWithinTolerance(ally, 2, 0, 0.5)).toBe(false);
  });
});
//endregion plugins/pixel/ext/abs/jabs-formation-helpers.test.js
