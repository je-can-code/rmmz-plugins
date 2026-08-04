//region plugins/_base/ext/save/_metadata/metadata.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { installJBaseHostGlobals } from '../../../core/_component/fixtures/install-j-base-host-globals.js';
import { installPluginManagerWithParams } from '../../../../../setup/install-plugin-manager-with-params.js';

const jBaseInitPath = '../../../../../../src/plugins/_base/core/_metadata/initialization.js';
const saveInitPath = '../../../../../../src/plugins/_base/ext/save/_metadata/initialization.js';
const pluginMetadataPath = '../../../../../../src/plugins/_base/core/models/PluginMetadata.js';

describe('J-Base-Save metadata (direct src import)', () =>
{
  /**
   * The J umbrella as J-Base built it, captured once and handed back to each test.
   *
   * J-Base's bootstrap runs once per realm - it ends by making `Array.empty` non-configurable, and a
   * second evaluation dies redefining it. So the umbrella is built a single time and restored by
   * reference rather than rebuilt.
   * @type {object}
   */
  let realJ;

  /**
   * Boots J-Base-Save's bootstrap file against a given set of plugin parameters.
   *
   * The parameters arrive as the strings RMMZ hands over, because that is what the parser is for: a
   * test passing a number would prove the metadata works on input it never receives.
   * @param {Object<string, string>} parameterStrings The raw parameters for this plugin.
   * @returns {Promise<object>} The metadata instance the bootstrap built.
   */
  const bootWithParameters = async parameterStrings =>
  {
    installPluginManagerWithParams(globalThis, 'J-Base-Save', parameterStrings);

    // PluginMetadata tracks registered plugins on a private static field and throws on a duplicate
    // name, so each boot needs a freshly imported class to register into.
    const { default: FreshPluginMetadata } = await import(pluginMetadataPath);
    globalThis.PluginMetadata = FreshPluginMetadata;

    globalThis.__PLUGIN_NAME__ = 'J-Base-Save';
    globalThis.__PLUGIN_VERSION__ = '1.0.0';

    await import(saveInitPath);

    return globalThis.J.BASE.EXT.SAVE.Metadata;
  };

  beforeAll(async () =>
  {
    installJBaseHostGlobals();

    globalThis.__PLUGIN_NAME__ = 'J-Base';
    globalThis.__PLUGIN_VERSION__ = '3.2.0';

    await import(jBaseInitPath);

    realJ = globalThis.J;
  });

  beforeEach(() =>
  {
    // drop only the save half of the module graph; J-Base's evaluated modules stay where they are.
    vi.resetModules();

    globalThis.J = realJ;
    delete globalThis.J.BASE.EXT.SAVE;
  });

  describe('retainedSaveGenerations', () =>
  {
    it('takes the configured number of generations to keep', async () =>
    {
      // Arrange
      // Act
      const metadata = await bootWithParameters({ retainedSaveGenerations: '7' });

      // Assert
      expect(metadata.retainedSaveGenerations).toBe(7);
    });

    it('keeps three when unconfigured, so a bad save costs the last save and never the file', async () =>
    {
      // Arrange
      // Act
      const metadata = await bootWithParameters({});

      // Assert
      expect(metadata.retainedSaveGenerations).toBe(3);
    });
  });

  describe('the bootstrap shell', () =>
  {
    it('declares an alias map for every engine global this ship augments', async () =>
    {
      // Arrange
      // Act
      await bootWithParameters({ retainedSaveGenerations: '3' });

      // Assert
      const { Aliased } = globalThis.J.BASE.EXT.SAVE;
      expect(Aliased.ConfigManager).toBeInstanceOf(Map);
      expect(Aliased.DataManager).toBeInstanceOf(Map);
      expect(Aliased.Game_System).toBeInstanceOf(Map);
      expect(Aliased.Scene_Boot).toBeInstanceOf(Map);
      expect(Aliased.Scene_Map).toBeInstanceOf(Map);
    });

    it('opens an extension umbrella of its own, so a save extension has somewhere to land', async () =>
    {
      // Arrange
      // Act
      await bootWithParameters({ retainedSaveGenerations: '3' });

      // Assert
      expect(globalThis.J.BASE.EXT.SAVE.EXT).toEqual({});
    });
  });
});
//endregion plugins/_base/ext/save/_metadata/metadata.test.js