//region plugins/abs/ext/input/_models/jabs-input-adapter.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

describe('J-ABS-Input JABS_InputAdapter (unit, all downstream dependencies mocked)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.J = {};

    vi.doMock('../../../../../../src/plugins/abs/ext/input/_models/JABS_StandardController.js', () => ({ default: class {} }));

    globalThis.JABS_InputAdapter = {};

    await import('../../../../../../src/plugins/abs/ext/input/_models/JABS_InputAdapter.js');
  });

  describe('getAllControllers', () =>
  {
    it('returns a shallow copy of the internal controllers list', () =>
    {
      // Arrange
      const controller = { id: 'controller-1' };
      globalThis.JABS_InputAdapter.controllers = [ controller ];

      // Act
      const result = globalThis.JABS_InputAdapter.getAllControllers();

      // Assert
      expect(result).toEqual([ controller ]);
      expect(result).not.toBe(globalThis.JABS_InputAdapter.controllers);
    });
  });
});
//endregion plugins/abs/ext/input/_models/jabs-input-adapter.test.js
