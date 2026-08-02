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

    // the real `createGameObjects` builds `$gameSystem` before this extension's alias runs, so the
    // system object is present by the time the keybinds are pushed onto the fresh controller.
    globalThis.$gameSystem = { applyJabsInputConfiguration: vi.fn() };
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

    it('applies the stored keybind configuration, on a new game as much as on a loaded one', () =>
    {
      // Act
      globalThis.DataManager.createGameObjects();

      // Assert- this hook runs down both paths, which is the whole reason the apply lives here.
      // hanging it off the load hook instead left a new game running the built-in defaults while
      // the player's own bindings sat unread in the config file.
      expect(globalThis.$gameSystem.applyJabsInputConfiguration).toHaveBeenCalledTimes(1);
    });
  });
});
//endregion plugins/abs/ext/input/managers/data-manager.test.js
