//region plugins/pixel/ext/abs/_component/jabs-ai-and-dodge.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { DEFAULT_PIXEL_CORE_PLUGIN_PARAMS } from '../../../_component/fixtures/pixel-plugin-params.js';
import {
  installPixelAbsExtHostGlobals,
  installPixelCoreHostGlobals,
  setPluginContextToJBase,
  setPluginContextToJPixel,
  setPluginContextToJPixelAbsExt,
} from '../../../_component/fixtures/install-pixel-host-globals.js';

describe('J-ABS-Pixelistics JABS integration (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installPixelCoreHostGlobals(globalThis, {
      ...DEFAULT_PIXEL_CORE_PLUGIN_PARAMS,
      collisionStepCount: '4',
    });

    setPluginContextToJBase();
    await import('../../../../../../src/plugins/_base/_metadata/initialization.js');

    setPluginContextToJPixel();
    await import('../../../../../../src/plugins/pixel/core/_metadata/initialization.js');

    ({ default: globalThis.PIXEL_CollisionManager } = await import('../../../../../../src/plugins/pixel/core/managers/PIXEL_CollisionManager.js'));

    installPixelAbsExtHostGlobals();

    setPluginContextToJPixelAbsExt();
    await import('../../../../../../src/plugins/pixel/ext/abs/_metadata/initialization.js');

    // patches the fake JABS_AiManager/JABS_Battler stand-ins directly, no vm involved.
    await import('../../../../../../src/plugins/pixel/ext/abs/managers/JABS_AiManager.js');
    await import('../../../../../../src/plugins/pixel/ext/abs/objects/JABS_Battler.js');
  });

  it('canMoveIdly returns true after the extension override', () =>
  {
    // Arrange
    const a = {};

    // Act
    const result = globalThis.JABS_AiManager.canMoveIdly(a);

    // Assert
    expect(result).toBe(true);
  });

  it('scales dodge steps by the collision step count', () =>
  {
    // Arrange
    const battler = new globalThis.JABS_Battler();

    // Act
    battler.setDodgeSteps(3);

    // Assert
    expect(battler.__lastDodgeSteps).toBe(12);
  });
});
//endregion plugins/pixel/ext/abs/_component/jabs-ai-and-dodge.test.js
