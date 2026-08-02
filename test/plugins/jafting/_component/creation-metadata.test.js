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

  describe('J.JAFTING.EXT.CREATE.Metadata', () =>
  {
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

  describe('configuration load reporting', () =>
  {
    it('reports what it loaded when external file load info is enabled', async () =>
    {
      // Arrange
      const logSpy = vi.spyOn(console, 'log')
        .mockImplementation(() => {});
      globalThis.J.BASE.Metadata.ShowExternalFileLoadInfo = true;

      // Act
      await bootJaftingCreate(VITEST_MINIMAL_CRAFTING_JSON,
        { bootBase: false, pluginName: 'J-JAFTING-Creation-Logged' });

      // Assert
      const [ [ logged ] ] = logSpy.mock.calls;
      expect(logged).toContain('1 recipes');
      expect(logged).toContain('1 categories');

      globalThis.J.BASE.Metadata.ShowExternalFileLoadInfo = false;
      logSpy.mockRestore();
    });

  });

  describe('optional SDP linkage', () =>
  {
    /**
     * Publishes a stand-in J-SDP at the given version: registered in the shared plugin registry so
     * `hasPlugin` finds it, and present on the J umbrella so its version can be compared. Passing
     * null leaves J-SDP entirely absent, which is the "not installed" case.
     * @param {?string} version The semver J-SDP should report.
     * @param {string} registrationName The name this stand-in registers under.
     */
    const publishSdpAt = async (version, registrationName) =>
    {
      if (version === null)
      {
        delete globalThis.J.SDP;
        return;
      }

      const [ major, minor, patch ] = version.split('.');
      globalThis.J.SDP = {
        Metadata: {
          version: PluginVersion.builder.major(major)
            .minor(minor)
            .patch(patch)
            .build(),
        },
      };

      // hasPlugin() keys off the shared registry, so a stand-in has to actually register itself
      // there; the instance is discarded because only its registration matters.
      const registered = new globalThis.PluginMetadata(registrationName, version);
      expect(globalThis.PluginMetadata.hasPlugin(registered.name)).toBe(true);
    };

    /**
     * Rebuilds the creation metadata against a brand-new PluginMetadata, whose static name
     * registry therefore starts empty. That keeps each case below independent: one needs J-SDP
     * absent from the registry, the others need it present, and a shared registry cannot be both.
     */
    const rebuildAgainstEmptyRegistry = async () =>
    {
      const { default: FreshPluginMetadata } =
        await import('../../../../src/plugins/_base/models/PluginMetadata.js');
      globalThis.PluginMetadata = FreshPluginMetadata;

      await bootJaftingCreate(VITEST_MINIMAL_CRAFTING_JSON,
        { bootBase: false, pluginName: 'J-JAFTING-Creation' });

      return globalThis.J.JAFTING.EXT.CREATE.Metadata;
    };

    it('declines the linkage when J-SDP was never registered', async () =>
    {
      // Arrange- crafting recipes may charge SDP points, but the whole feature is optional and its
      // absence must read as "not available" rather than crashing.
      const metadata = await rebuildAgainstEmptyRegistry();
      await publishSdpAt(null, '');

      // Act & Assert
      expect(metadata.usingSdp()).toBe(false);
    });

    it('declines the linkage when J-SDP is present but below the minimum version', async () =>
    {
      // Arrange
      const metadata = await rebuildAgainstEmptyRegistry();
      await publishSdpAt('1.0.0', 'J-SDP');

      // Act & Assert- an old SDP cannot answer the calls this crafting system would make of it.
      expect(metadata.usingSdp()).toBe(false);
    });

    it('accepts the linkage when J-SDP is registered at a satisfying version', async () =>
    {
      // Arrange
      const metadata = await rebuildAgainstEmptyRegistry();
      await publishSdpAt('2.0.0', 'J-SDP');

      // Act & Assert
      expect(metadata.usingSdp()).toBe(true);
    });
  });

  describe('host version requirements', () =>
  {
    it('the core throws when J-Base does not satisfy the minimum required version', async () =>
    {
      // Arrange: drop the already-installed J-Base metadata below the core's floor.
      vi.resetModules();
      const originalVersion = globalThis.J.BASE.Metadata.Version;
      globalThis.J.BASE.Metadata.Version = '0.0.1';
      globalThis.__PLUGIN_NAME__ = 'J-JAFTING';
      globalThis.__PLUGIN_VERSION__ = '2.1.0';

      // Act & Assert
      await expect(import('../../../../src/plugins/jafting/core/_metadata/initialization.js'))
        .rejects.toThrow(/missing J-Base/);

      // restore the satisfying version so later tests in this file are unaffected.
      globalThis.J.BASE.Metadata.Version = originalVersion;
    });

    it('the creation extension throws when J-Base does not satisfy the minimum required version', async () =>
    {
      // Arrange
      vi.resetModules();
      const originalVersion = globalThis.J.BASE.Metadata.Version;
      globalThis.J.BASE.Metadata.Version = '0.0.1';
      globalThis.__PLUGIN_NAME__ = 'J-JAFTING-Creation';
      globalThis.__PLUGIN_VERSION__ = '2.1.0';

      // Act & Assert
      await expect(import('../../../../src/plugins/jafting/ext/create/_metadata/initialization.js'))
        .rejects.toThrow(/missing J-Base/);

      // restore the satisfying version so later tests in this file are unaffected.
      globalThis.J.BASE.Metadata.Version = originalVersion;
    });

    it('the creation extension throws when J-JAFTING does not satisfy the minimum required version', async () =>
    {
      // Arrange: J-Base has to keep passing so the jafting core check is the one that trips.
      vi.resetModules();
      const originalVersion = globalThis.J.JAFTING.Metadata.version.version;
      globalThis.J.JAFTING.Metadata.version.version = () => '0.0.1';
      globalThis.__PLUGIN_NAME__ = 'J-JAFTING-Creation';
      globalThis.__PLUGIN_VERSION__ = '2.1.0';

      // Act & Assert
      await expect(import('../../../../src/plugins/jafting/ext/create/_metadata/initialization.js'))
        .rejects.toThrow(/missing J-JAFTING/);

      // restore the real accessor rather than relying on restoreAllMocks.
      globalThis.J.JAFTING.Metadata.version.version = originalVersion;
    });
  });
});
//endregion plugins/jafting/_component/creation-metadata.test.js
