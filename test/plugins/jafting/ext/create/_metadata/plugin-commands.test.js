//region plugins/jafting/ext/create/_metadata/plugin-commands.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('J-JAFTING-Creation plugin commands (direct src import)', () =>
{
  let handlers;
  let FakeSceneJaftingCreate;

  beforeAll(async () =>
  {
    vi.resetModules();

    FakeSceneJaftingCreate = { callScene: vi.fn() };
    vi.doMock('../../../../../../src/plugins/jafting/ext/create/scenes/Scene_JaftingCreate.js', () => ({ default: FakeSceneJaftingCreate }));

    globalThis.J = {
      JAFTING: {
        EXT: {
          CREATE: {
            Metadata: { name: 'J-JAFTING-Creation' },
            Debug: { prepareFullCreationTest: vi.fn() },
          },
        },
      },
    };

    handlers = {};
    globalThis.PluginManager = {
      registerCommand: vi.fn((pluginName, commandName, handler) =>
      {
        handlers[commandName] = handler;
      }),
    };

    await import('../../../../../../src/plugins/jafting/ext/create/_metadata/pluginCommands.js');
  });

  beforeEach(() =>
  {
    vi.clearAllMocks();
    globalThis.$gameParty = {
      unlockCategory: vi.fn(),
      lockCategory: vi.fn(),
      unlockRecipe: vi.fn(),
      lockRecipe: vi.fn(),
      unlockAllCategories: vi.fn(),
      lockAllCategories: vi.fn(),
      unlockAllRecipes: vi.fn(),
      lockAllRecipes: vi.fn(),
    };
  });

  it('registers all nine commands under the J-JAFTING-Creation plugin name', () =>
  {
    // Arrange/Act (registration happened in beforeAll)

    // Assert
    expect(Object.keys(handlers)).toEqual([
      'call-menu', 'unlock-categories', 'lock-categories', 'unlock-recipes', 'lock-recipes',
      'unlock-all-categories', 'lock-all-categories', 'unlock-all-recipes', 'lock-all-recipes',
      'debug-prepare-creation-testing',
    ]);
  });

  it('call-menu calls the jafting-create scene', () =>
  {
    // Arrange/Act
    handlers['call-menu']();

    // Assert
    expect(FakeSceneJaftingCreate.callScene).toHaveBeenCalled();
  });

  it('unlock-categories unlocks each parsed key', () =>
  {
    // Arrange
    const args = { categoryKeys: JSON.stringify([ 'cat-1', 'cat-2' ]) };

    // Act
    handlers['unlock-categories'](args);

    // Assert
    expect(globalThis.$gameParty.unlockCategory).toHaveBeenCalledWith('cat-1', 0, [ 'cat-1', 'cat-2' ]);
    expect(globalThis.$gameParty.unlockCategory).toHaveBeenCalledWith('cat-2', 1, [ 'cat-1', 'cat-2' ]);
  });

  it('lock-categories locks each parsed key', () =>
  {
    // Arrange
    const args = { categoryKeys: JSON.stringify([ 'cat-1' ]) };

    // Act
    handlers['lock-categories'](args);

    // Assert
    expect(globalThis.$gameParty.lockCategory).toHaveBeenCalledWith('cat-1', 0, [ 'cat-1' ]);
  });

  it('unlock-recipes unlocks each parsed key', () =>
  {
    // Arrange
    const args = { recipeKeys: JSON.stringify([ 'recipe-1' ]) };

    // Act
    handlers['unlock-recipes'](args);

    // Assert
    expect(globalThis.$gameParty.unlockRecipe).toHaveBeenCalledWith('recipe-1', 0, [ 'recipe-1' ]);
  });

  it('lock-recipes locks each parsed key', () =>
  {
    // Arrange
    const args = { recipeKeys: JSON.stringify([ 'recipe-1' ]) };

    // Act
    handlers['lock-recipes'](args);

    // Assert
    expect(globalThis.$gameParty.lockRecipe).toHaveBeenCalledWith('recipe-1', 0, [ 'recipe-1' ]);
  });

  it('unlock-all-categories unlocks all categories', () =>
  {
    // Arrange/Act
    handlers['unlock-all-categories']();

    // Assert
    expect(globalThis.$gameParty.unlockAllCategories).toHaveBeenCalled();
  });

  it('lock-all-categories locks all categories', () =>
  {
    // Arrange/Act
    handlers['lock-all-categories']();

    // Assert
    expect(globalThis.$gameParty.lockAllCategories).toHaveBeenCalled();
  });

  it('unlock-all-recipes unlocks all recipes', () =>
  {
    // Arrange/Act
    handlers['unlock-all-recipes']();

    // Assert
    expect(globalThis.$gameParty.unlockAllRecipes).toHaveBeenCalled();
  });

  it('lock-all-recipes locks all recipes', () =>
  {
    // Arrange/Act
    handlers['lock-all-recipes']();

    // Assert
    expect(globalThis.$gameParty.lockAllRecipes).toHaveBeenCalled();
  });

  describe('debug-prepare-creation-testing', () =>
  {
    it('defaults the multiplier to 15 when no override is provided', () =>
    {
      // Arrange
      const args = {};

      // Act
      handlers['debug-prepare-creation-testing'](args);

      // Assert
      expect(globalThis.J.JAFTING.EXT.CREATE.Debug.prepareFullCreationTest).toHaveBeenCalledWith(15);
    });

    it('defaults the multiplier to 15 when the override is an empty string', () =>
    {
      // Arrange
      const args = { recipeStockMultiplier: '' };

      // Act
      handlers['debug-prepare-creation-testing'](args);

      // Assert
      expect(globalThis.J.JAFTING.EXT.CREATE.Debug.prepareFullCreationTest).toHaveBeenCalledWith(15);
    });

    it('uses the floored parsed override when it is a finite number >= 1', () =>
    {
      // Arrange
      const args = { recipeStockMultiplier: '7.9' };

      // Act
      handlers['debug-prepare-creation-testing'](args);

      // Assert
      expect(globalThis.J.JAFTING.EXT.CREATE.Debug.prepareFullCreationTest).toHaveBeenCalledWith(7);
    });

    it('falls back to the default of 15 when the override is below 1', () =>
    {
      // Arrange
      const args = { recipeStockMultiplier: '0.5' };

      // Act
      handlers['debug-prepare-creation-testing'](args);

      // Assert
      expect(globalThis.J.JAFTING.EXT.CREATE.Debug.prepareFullCreationTest).toHaveBeenCalledWith(15);
    });

    it('falls back to the default of 15 when the override is not a finite number', () =>
    {
      // Arrange
      const args = { recipeStockMultiplier: 'not-a-number' };

      // Act
      handlers['debug-prepare-creation-testing'](args);

      // Assert
      expect(globalThis.J.JAFTING.EXT.CREATE.Debug.prepareFullCreationTest).toHaveBeenCalledWith(15);
    });
  });
});
//endregion plugins/jafting/ext/create/_metadata/plugin-commands.test.js
