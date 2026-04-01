//region plugins/pixel/ext/abs/jabs-ai-and-dodge.test.js
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { DEFAULT_PIXEL_CORE_PLUGIN_PARAMS } from '../../fixtures/pixel-plugin-params.js';
import { loadPixelAbsStackPluginVm } from '../../pixel-vm.js';

describe('J-ABS-Pixelistics JABS integration', () =>
{
  let sandbox;

  beforeEach(() =>
  {
    sandbox = { console };
    loadPixelAbsStackPluginVm(sandbox, {
      coreParams: {
        ...DEFAULT_PIXEL_CORE_PLUGIN_PARAMS,
        collisionStepCount: '4',
      },
    });
  });

  afterEach(() =>
  {
    sandbox = null;
  });

  it('canMoveIdly returns true after extension override', () =>
  {
    const a = {};

    expect(sandbox.JABS_AiManager.canMoveIdly(a)).toBe(true);
  });

  it('scales dodge steps by collision step count', () =>
  {
    const battler = new sandbox.JABS_Battler();

    battler.setDodgeSteps(3);

    expect(battler.__lastDodgeSteps).toBe(12);
  });
});
//endregion plugins/pixel/ext/abs/jabs-ai-and-dodge.test.js
