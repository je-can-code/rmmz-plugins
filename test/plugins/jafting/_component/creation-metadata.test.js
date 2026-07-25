//region plugins/jafting/_component/creation-metadata.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { installJBaseHostGlobals } from '../../_base/_component/fixtures/install-j-base-host-globals.js';
import PluginMetadata from '../../../../src/plugins/_base/models/PluginMetadata.js';
import ExternalJsonConfigLoader from '../../../../src/plugins/_base/managers/ExternalJsonConfigLoader.js';
import ExternalJsonConfigLoaderOptions from '../../../../src/plugins/_base/models/ExternalJsonConfigLoaderOptions.js';
import PluginVersion from '../../../../src/plugins/_base/models/PluginVersion.js';

export const DEFAULT_JAFTING_CREATE_PLUGIN_PARAMS = {
  'menu-switch': '222',
  'menu-name': 'Vitest Creation',
  'menu-icon': '88',
};

const VITEST_MINIMAL_CRAFTING_JSON = JSON.stringify({
  recipes: [
    {
      name: 'Vitest Recipe',
      key: 'vitest_recipe',
      categoryKeys: [ 'vitest_cat' ],
      iconIndex: 1,
      description: 'vitest recipe description',
      unlockedByDefault: true,
      maskedUntilCrafted: false,
      tools: [],
      ingredients: [ { id: 1, type: 'i', count: 1 } ],
      outputs: [ { id: 2, type: 'i', count: 1 } ],
    },
  ],
  categories: [
    {
      name: 'Vitest Category',
      key: 'vitest_cat',
      iconIndex: 0,
      description: 'vitest category description',
      unlockedByDefault: true,
    },
  ],
});

async function bootJaftingCreate(craftingJson, { bootBase = true, pluginName = 'J-JAFTING-Creation' } = {})
{
  vi.resetModules();

  // _base/_metadata/initialization.js Object.defineProperty(Array, "empty", { configurable: false })
  // throws if re-run in the same realm, so only boot _base once (globalThis.J.BASE/PluginMetadata/etc.
  // survive vi.resetModules()- it only clears the module cache, not global state). installJBaseHostGlobals
  // resets StorageManager to {}, so it must run before fsReadFile is assigned below.
  if (bootBase)
  {
    installJBaseHostGlobals();
    globalThis.PluginMetadata = PluginMetadata;
    globalThis.ExternalJsonConfigLoader = ExternalJsonConfigLoader;
    globalThis.ExternalJsonConfigLoaderOptions = ExternalJsonConfigLoaderOptions;
    globalThis.PluginVersion = PluginVersion;

    globalThis.__PLUGIN_NAME__ = 'J-Base';
    globalThis.__PLUGIN_VERSION__ = '3.2.0';
    await import('../../../../src/plugins/_base/_metadata/initialization.js');

    globalThis.__PLUGIN_NAME__ = 'J-JAFTING';
    globalThis.__PLUGIN_VERSION__ = '2.1.0';
    await import('../../../../src/plugins/jafting/core/_metadata/initialization.js');
  }

  globalThis.StorageManager.fsReadFile = () => craftingJson;
  globalThis.PluginManager = {
    parameters: name =>
    {
      if (name === pluginName)
      {
        return DEFAULT_JAFTING_CREATE_PLUGIN_PARAMS;
      }

      return {};
    },
    registerCommand()
    {
    },
  };

  globalThis.__PLUGIN_NAME__ = pluginName;
  globalThis.__PLUGIN_VERSION__ = '2.1.0';
  await import('../../../../src/plugins/jafting/ext/create/_metadata/initialization.js');
}

describe('J-JAFTING + J-JAFTING-Creation metadata (direct src import)', () =>
{
  beforeAll(async () =>
  {
    await bootJaftingCreate(VITEST_MINIMAL_CRAFTING_JSON);
  });

  it('exposes core metadata on J.JAFTING.Metadata', () =>
  {
    // Arrange & Act & Assert
    expect(globalThis.J.JAFTING.Metadata.name).toBe('J-JAFTING');
  });

  describe('J.JAFTING.EXT.CREATE.Metadata', () =>
  {
    it('sets the metadata name to J-JAFTING-Creation', () =>
    {
      // Arrange & Act & Assert
      expect(globalThis.J.JAFTING.EXT.CREATE.Metadata.name).toBe('J-JAFTING-Creation');
    });

    it('parses the menu switch id from plugin parameters', () =>
    {
      // Arrange & Act & Assert
      expect(globalThis.J.JAFTING.EXT.CREATE.Metadata.menuSwitchId)
        .toBe(Number(DEFAULT_JAFTING_CREATE_PLUGIN_PARAMS['menu-switch']));
    });

    it('reads the command name from plugin parameters', () =>
    {
      // Arrange & Act & Assert
      expect(globalThis.J.JAFTING.EXT.CREATE.Metadata.commandName).toBe(DEFAULT_JAFTING_CREATE_PLUGIN_PARAMS['menu-name']);
    });

    it('parses the command icon index from plugin parameters', () =>
    {
      // Arrange & Act & Assert
      expect(globalThis.J.JAFTING.EXT.CREATE.Metadata.commandIconIndex)
        .toBe(Number(DEFAULT_JAFTING_CREATE_PLUGIN_PARAMS['menu-icon']));
    });

    it('classifies exactly one recipe from the crafting config', () =>
    {
      // Arrange & Act & Assert
      expect(globalThis.J.JAFTING.EXT.CREATE.Metadata.recipes.length).toBe(1);
    });

    it('classifies exactly one category from the crafting config', () =>
    {
      // Arrange & Act & Assert
      expect(globalThis.J.JAFTING.EXT.CREATE.Metadata.categories.length).toBe(1);
    });

    it('indexes the recipe in recipesMap by its key', () =>
    {
      // Arrange
      const recipe = globalThis.J.JAFTING.EXT.CREATE.Metadata.recipesMap.get('vitest_recipe');

      // Act & Assert
      expect(recipe.key).toBe('vitest_recipe');
    });

    it('preserves the recipe name through classification', () =>
    {
      // Arrange
      const recipe = globalThis.J.JAFTING.EXT.CREATE.Metadata.recipesMap.get('vitest_recipe');

      // Act & Assert
      expect(recipe.name).toBe('Vitest Recipe');
    });

    it('indexes the category in categoriesMap by its key', () =>
    {
      // Arrange
      const category = globalThis.J.JAFTING.EXT.CREATE.Metadata.categoriesMap.get('vitest_cat');

      // Act & Assert
      expect(category.key).toBe('vitest_cat');
    });
  });

  it('throws with the config path in the message when crafting config JSON is invalid', async () =>
  {
    // Arrange & Act & Assert
    await expect(bootJaftingCreate('{ not valid json', { bootBase: false, pluginName: 'J-JAFTING-Creation-badjson' }))
      .rejects.toThrow(/failed to parse JSON at data\/config\.crafting\.json/i);
  });
});
//endregion plugins/jafting/_component/creation-metadata.test.js
