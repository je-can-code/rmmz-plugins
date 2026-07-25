//region plugins/omni/ext/quest/managers/_component/data-manager.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('DataManager ext/quest augments (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.J = {
      OMNI: { EXT: { QUEST: { Aliased: { DataManager: new Map() } } } },
      ABS: { EXT: { INPUT: { Symbols: { DPadRight: 'dpad-right' } } } },
    };

    globalThis.DataManager = { createGameObjects: vi.fn() };
    globalThis.Input = {
      registerAction: vi.fn(),
      seedDefaultBindings: vi.fn(),
      getAllBindings: vi.fn(),
    };

    await import('../../../../../../../src/plugins/omni/ext/quest/managers/DataManager.js');
  });

  beforeEach(() =>
  {
    vi.clearAllMocks();
  });

  describe('createGameObjects', () =>
  {
    it('always calls through to the original aliased implementation', () =>
    {
      // Arrange/Act
      globalThis.DataManager.createGameObjects();

      // Assert
      expect(globalThis.J.OMNI.EXT.QUEST.Aliased.DataManager.get('createGameObjects')).toHaveBeenCalled();
    });

    it('re-registers the quest input actions', () =>
    {
      // Arrange/Act
      globalThis.DataManager.createGameObjects();

      // Assert
      expect(globalThis.Input.registerAction).toHaveBeenCalledWith('J.OMNI.QUEST', expect.objectContaining({ key: 'open-quest-log' }));
    });
  });

  describe('registerQuestopediaInputActions', () =>
  {
    it('registers the open-quest-log action with the DPadRight default', () =>
    {
      // Arrange/Act
      globalThis.DataManager.registerQuestopediaInputActions();

      // Assert
      expect(globalThis.Input.registerAction).toHaveBeenCalledWith('J.OMNI.QUEST', {
        key: 'open-quest-log',
        label: 'Open Quest Log',
        defaults: [ 'dpad-right' ],
        category: 'ui',
      });
    });

    it('seeds the default binding and initializes the live bindings bucket', () =>
    {
      // Arrange/Act
      globalThis.DataManager.registerQuestopediaInputActions();

      // Assert
      expect(globalThis.Input.seedDefaultBindings).toHaveBeenCalledWith('J.OMNI.QUEST', { 'open-quest-log': [ 'dpad-right' ] });
      expect(globalThis.Input.getAllBindings).toHaveBeenCalledWith('J.OMNI.QUEST');
    });
  });
});
//endregion plugins/omni/ext/quest/managers/_component/data-manager.test.js
