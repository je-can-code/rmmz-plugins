//region plugins/abs/ext/food/input/input.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('J-ABS-Food Input (unit, all downstream dependencies mocked)', () =>
{
  let originalEnsureRemapBootstrapped;

  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.J = {
      ABS: {
        EXT: {
          FOOD: { Aliased: { Input: new Map() } },
          INPUT: { Symbols: { MobilitySkill: 'MB' } },
        },
      },
    };
    globalThis.JABS_Button = { UsableItem: 'usableItem' };

    originalEnsureRemapBootstrapped = vi.fn();
    globalThis.Input = { ensureRemapBootstrapped: originalEnsureRemapBootstrapped, getAllBindings: vi.fn() };

    await import('../../../../../../src/plugins/abs/ext/food/input/Input.js');
  });

  beforeEach(() =>
  {
    originalEnsureRemapBootstrapped.mockReset();
    globalThis.Input.getAllBindings.mockReset();
  });

  describe('ensureRemapBootstrapped', () =>
  {
    it('performs the original logic then injects the UsableItem binding when missing', () =>
    {
      // Arrange
      const bindings = {};
      globalThis.Input.getAllBindings.mockReturnValue(bindings);

      // Act
      globalThis.Input.ensureRemapBootstrapped();

      // Assert
      expect(originalEnsureRemapBootstrapped).toHaveBeenCalledTimes(1);
      expect(bindings.usableItem).toEqual([ 'MB' ]);
    });

    it('does not overwrite an existing UsableItem binding', () =>
    {
      // Arrange
      const bindings = { usableItem: [ 'CUSTOM' ] };
      globalThis.Input.getAllBindings.mockReturnValue(bindings);

      // Act
      globalThis.Input.ensureRemapBootstrapped();

      // Assert
      expect(bindings.usableItem).toEqual([ 'CUSTOM' ]);
    });

    it('does not throw when there are no bindings at all', () =>
    {
      // Arrange
      globalThis.Input.getAllBindings.mockReturnValue(null);

      // Act / Assert
      expect(() => globalThis.Input.ensureRemapBootstrapped()).not.toThrow();
    });
  });
});
//endregion plugins/abs/ext/food/input/input.test.js
