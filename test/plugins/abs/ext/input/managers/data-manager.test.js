//region plugins/abs/ext/input/managers/data-manager.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('J-ABS-Input DataManager (unit, all downstream dependencies mocked)', () =>
{
  let originalCreateGameObjects;
  let FakeJABS_StandardController;

  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.J = { ABS: { EXT: { INPUT: { Aliased: { DataManager: new Map() } } } } };

    FakeJABS_StandardController = vi.fn();
    vi.doMock('../../../../../../src/plugins/abs/ext/input/_models/JABS_StandardController.js', () => ({
      default: FakeJABS_StandardController,
    }));

    globalThis.Input = { ensureRemapBootstrapped: vi.fn() };
    globalThis.IconManager = { registerJabsIcons: vi.fn(), registerJabsInputTexts: vi.fn() };

    originalCreateGameObjects = vi.fn();
    globalThis.DataManager = { createGameObjects: originalCreateGameObjects };

    await import('../../../../../../src/plugins/abs/ext/input/managers/DataManager.js');
  });

  beforeEach(() =>
  {
    originalCreateGameObjects.mockReset();
    globalThis.Input.ensureRemapBootstrapped.mockReset();
    globalThis.IconManager.registerJabsIcons.mockReset();
    globalThis.IconManager.registerJabsInputTexts.mockReset();
    FakeJABS_StandardController.mockClear();
    globalThis.$jabsController1 = null;
  });

  describe('createGameObjects', () =>
  {
    it('performs the original logic then bootstraps input remap, icons, and text', () =>
    {
      // Act
      globalThis.DataManager.createGameObjects();

      // Assert
      expect(originalCreateGameObjects).toHaveBeenCalledTimes(1);
      expect(globalThis.Input.ensureRemapBootstrapped).toHaveBeenCalledTimes(1);
      expect(globalThis.IconManager.registerJabsIcons).toHaveBeenCalledTimes(1);
      expect(globalThis.IconManager.registerJabsInputTexts).toHaveBeenCalledTimes(1);
    });

    it('creates controller 1 when none exists yet', () =>
    {
      globalThis.DataManager.createGameObjects();
      expect(FakeJABS_StandardController).toHaveBeenCalledTimes(1);
      expect(globalThis.$jabsController1).toBeInstanceOf(FakeJABS_StandardController);
    });

    it('does not recreate controller 1 when one already exists', () =>
    {
      const existing = { id: 'existing-controller' };
      globalThis.$jabsController1 = existing;

      globalThis.DataManager.createGameObjects();

      expect(FakeJABS_StandardController).not.toHaveBeenCalled();
      expect(globalThis.$jabsController1).toBe(existing);
    });
  });
});
//endregion plugins/abs/ext/input/managers/data-manager.test.js
