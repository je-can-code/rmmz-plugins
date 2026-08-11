//region plugins/jafting/ext/create/_metadata/plugin-commands.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('J-JAFTING-Creation plugin commands (direct src import)', () =>
{
  let handlers;
  let FakeSceneJaftingCreate;
  let FakeSceneJaftingStudy;

  beforeAll(async () =>
  {
    vi.resetModules();

    FakeSceneJaftingCreate = { callScene: vi.fn() };
    vi.doMock('../../../../../../src/plugins/jafting/ext/create/scenes/Scene_JaftingCreate.js', () => ({ default: FakeSceneJaftingCreate }));

    // both scenes are stood in for, since importing either would evaluate every window it builds- and
    // a class extending a bare-global Window_Base cannot even be declared without the view layer up.
    FakeSceneJaftingStudy = { callScene: vi.fn() };
    vi.doMock('../../../../../../src/plugins/jafting/ext/create/scenes/Scene_JaftingStudy.js', () => ({ default: FakeSceneJaftingStudy }));

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
      'call-menu', 'call-study-shop', 'unlock-categories', 'lock-categories', 'unlock-recipes',
      'lock-recipes', 'unlock-all-categories', 'lock-all-categories', 'unlock-all-recipes',
      'lock-all-recipes',
    ]);
  });

  it('call-menu calls the jafting-create scene', () =>
  {
    // Arrange/Act
    handlers['call-menu']();

    // Assert- and not the shop, which is the neighbouring scene it could be confused with.
    expect(FakeSceneJaftingCreate.callScene).toHaveBeenCalled();
    expect(FakeSceneJaftingStudy.callScene).not.toHaveBeenCalled();
  });

  it('call-study-shop calls the jafting-study scene', () =>
  {
    // Arrange/Act
    handlers['call-study-shop']();

    // Assert
    expect(FakeSceneJaftingStudy.callScene).toHaveBeenCalled();
    expect(FakeSceneJaftingCreate.callScene).not.toHaveBeenCalled();
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

});
//endregion plugins/jafting/ext/create/_metadata/plugin-commands.test.js
