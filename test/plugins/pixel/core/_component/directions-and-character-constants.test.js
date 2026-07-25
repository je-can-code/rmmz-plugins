//region plugins/pixel/core/_component/directions-and-character-constants.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import {
  installPixelCoreHostGlobals,
  setPluginContextToJBase,
  setPluginContextToJPixel,
} from '../../_component/fixtures/install-pixel-host-globals.js';

describe('J-Pixelistics direction and route constants (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installPixelCoreHostGlobals();

    setPluginContextToJBase();
    await import('../../../../../src/plugins/_base/_metadata/initialization.js');

    setPluginContextToJPixel();
    await import('../../../../../src/plugins/pixel/core/_metadata/initialization.js');

    // patches globalThis.Game_Character with the static pixelRepeatableMoveCommandCodes list.
    await import('../../../../../src/plugins/pixel/core/objects/Game_Character.js');
  });

  describe('J.PIXEL.Directions', () =>
  {
    it('matches RMMZ-style numeric constants for all eight compass directions', () =>
    {
      // Arrange & Act
      const D = globalThis.J.PIXEL.Directions;

      // Assert
      expect(D.DOWN).toBe(2);
      expect(D.LEFT).toBe(4);
      expect(D.RIGHT).toBe(6);
      expect(D.UP).toBe(8);
      expect(D.LOWERLEFT).toBe(1);
      expect(D.LOWERRIGHT).toBe(3);
      expect(D.UPPERLEFT).toBe(7);
      expect(D.UPPERRIGHT).toBe(9);
    });
  });

  describe('Game_Character.pixelRepeatableMoveCommandCodes', () =>
  {
    it('is an array of route opcode ids', () =>
    {
      // Arrange & Act
      const codes = globalThis.Game_Character.pixelRepeatableMoveCommandCodes;

      // Assert
      expect(Array.isArray(codes)).toBe(true);
    });

    it('includes the move-down opcode id', () =>
    {
      // Arrange & Act
      const codes = globalThis.Game_Character.pixelRepeatableMoveCommandCodes;

      // Assert
      expect(codes.includes(1)).toBe(true);
    });

    it('includes the turn-down opcode id', () =>
    {
      // Arrange & Act
      const codes = globalThis.Game_Character.pixelRepeatableMoveCommandCodes;

      // Assert
      expect(codes.includes(9)).toBe(true);
    });

    it('includes the jump opcode id', () =>
    {
      // Arrange & Act
      const codes = globalThis.Game_Character.pixelRepeatableMoveCommandCodes;

      // Assert
      expect(codes.includes(13)).toBe(true);
    });
  });
});
//endregion plugins/pixel/core/_component/directions-and-character-constants.test.js
