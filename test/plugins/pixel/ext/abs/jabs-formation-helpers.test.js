//region plugins/pixel/ext/abs/jabs-formation-helpers.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import {
  installPixelAbsExtHostGlobals,
  installPixelCoreHostGlobals,
  setPluginContextToJBase,
  setPluginContextToJPixel,
  setPluginContextToJPixelAbsExt,
} from '../../fixtures/install-pixel-host-globals.js';

describe('J-ABS-Pixelistics formation helpers on JABS_AiManager (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installPixelCoreHostGlobals();

    setPluginContextToJBase();
    await import('../../../../../src/plugins/_base/_metadata/initialization.js');

    setPluginContextToJPixel();
    await import('../../../../../src/plugins/pixel/core/_metadata/initialization.js');

    installPixelAbsExtHostGlobals();

    setPluginContextToJPixelAbsExt();
    await import('../../../../../src/plugins/pixel/ext/abs/_metadata/initialization.js');

    // patches the fake JABS_AiManager stand-in directly, no vm involved.
    await import('../../../../../src/plugins/pixel/ext/abs/managers/JABS_AiManager.js');
  });

  it('calculateFormationSlotCoordinates offsets by half a tile toward centers', () =>
  {
    // Arrange & Act
    const [ sx, sy ] = globalThis.JABS_AiManager.calculateFormationSlotCoordinates(1, 0.5, 2, -0.5);

    // Assert
    expect(sx).toBe(2);
    expect(sy).toBe(2);
  });

  describe('isWithinTolerance', () =>
  {
    const ally = {
      getCharacter: () => ({ x: 0.3, y: 0 }),
    };

    it('is true when the Euclidean distance is within tolerance', () =>
    {
      // Arrange & Act
      const result = globalThis.JABS_AiManager.isWithinTolerance(ally, 0, 0, 0.5);

      // Assert
      expect(result).toBe(true);
    });

    it('is false when the Euclidean distance exceeds tolerance', () =>
    {
      // Arrange & Act
      const result = globalThis.JABS_AiManager.isWithinTolerance(ally, 2, 0, 0.5);

      // Assert
      expect(result).toBe(false);
    });
  });
});
//endregion plugins/pixel/ext/abs/jabs-formation-helpers.test.js
