//region plugins/diff/_component/metadata.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import {
  DEFAULT_DIFF_PLUGIN_PARAMS,
  installDiffHostGlobals,
  setPluginContextToJBase,
  setPluginContextToJDiff,
} from './fixtures/install-diff-host-globals.js';

describe('J-Difficulty metadata (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installDiffHostGlobals();

    setPluginContextToJBase();
    await import('../../../../src/plugins/_base/core/_metadata/initialization.js');

    setPluginContextToJDiff();
    await import('../../../../src/plugins/diff/core/_metadata/initialization.js');
  });

  it('parses the starting difficulty point budget out of the plugin parameters', () =>
  {
    // Arrange & Act & Assert
    expect(globalThis.J.DIFFICULTY.Metadata.initialPoints).toBe(Number(DEFAULT_DIFF_PLUGIN_PARAMS.initialPoints));
  });

  it('parses the default difficulty key out of the plugin parameters', () =>
  {
    // Arrange & Act & Assert
    expect(globalThis.J.DIFFICULTY.Metadata.defaultKey).toBe(DEFAULT_DIFF_PLUGIN_PARAMS.defaultDifficulty);
  });

  it('loads every difficulty in the external config into the metadata map', () =>
  {
    // Arrange & Act & Assert
    expect(globalThis.J.DIFFICULTY.Metadata.allMetadatas.size).toBe(2);
  });

  it('keys each loaded difficulty by its own key and keeps its actor effects', () =>
  {
    // Arrange & Act
    const meta = globalThis.J.DIFFICULTY.Metadata.allMetadatas.get('vitest_diff');

    // Assert
    expect(meta.key).toBe('vitest_diff');
    expect(meta.actorEffects.bparams[0]).toBe(80);
  });

  it('keeps the enemy effects of a loaded difficulty distinct from its actor effects', () =>
  {
    // Arrange & Act
    const hard = globalThis.J.DIFFICULTY.Metadata.allMetadatas.get('vitest_hard');

    // Assert
    expect(hard.enemyEffects.bparams[0]).toBe(50);
  });

  it('throws when J-Base does not satisfy the minimum required version', async () =>
  {
    // Arrange: drop the already-installed J-Base metadata below this plugin's floor.
    vi.resetModules();
    const originalVersion = globalThis.J.BASE.Metadata.Version;
    globalThis.J.BASE.Metadata.Version = '0.0.1';
    setPluginContextToJDiff();

    // Act & Assert
    await expect(import('../../../../src/plugins/diff/core/_metadata/initialization.js'))
      .rejects.toThrow(/missing J-Base/);

    // restore the satisfying version so later tests in this file are unaffected.
    globalThis.J.BASE.Metadata.Version = originalVersion;
  });

  describe('layer classification', () =>
  {
    // every config below has to contain the configured default layer, because the metadata
    // resolves that key while it initializes and has nothing to fall back on.
    const defaultKey = DEFAULT_DIFF_PLUGIN_PARAMS.defaultDifficulty;

    /**
     * Builds a second metadata instance against a doctored difficulty config. PluginMetadata keeps
     * a static name registry that rejects duplicates, so each variation introduces itself under a
     * name of its own.
     * @param {object[]} layers The difficulty layers the config should carry.
     * @param {string} name The plugin name this instance registers under.
     */
    const buildWithLayers = async (layers, name) =>
    {
      const { default: DiffPluginMetadata } =
        await import('../../../../src/plugins/diff/core/_metadata/_pluginMetadata.js');
      globalThis.StorageManager.fsReadFile = () => JSON.stringify(layers);

      // the instance resolves its default layer through its own plugin parameters, so the harness
      // parameters have to answer to this name as well as to the real one.
      const previous = globalThis.PluginManager;
      globalThis.PluginManager = {
        parameters: requested => (requested === name
          ? DEFAULT_DIFF_PLUGIN_PARAMS
          : previous.parameters(requested)),
        registerCommand() {},
      };

      const metadata = new DiffPluginMetadata(name, '1.0.0');
      globalThis.PluginManager = previous;

      return metadata;
    };

    /**
     * A single difficulty layer, with every effect bucket populated so the classification of each
     * one is actually exercised.
     * @param {string} key The key this layer answers to.
     */
    const buildLayer = key => ({
      key,
      name: 'Vitest Layer',
      description: 'harness layer',
      iconIndex: 0,
      cost: 0,
      enabled: true,
      unlocked: true,
      hidden: false,
      actorEffects: { bparams: [ 80 ], xparams: [ 110 ], sparams: [ 90 ], cparams: [ 120 ] },
      enemyEffects: { bparams: [ 50 ], xparams: [ 60 ], sparams: [ 70 ], cparams: [ 80 ] },
      rewards: { exp: 100, gold: 100, drops: 100, encounters: 100, sdp: 100 },
    });

    it('carries every effect bucket across, not just the base parameters', async () =>
    {
      // Arrange & Act- the shipped harness config leaves xparams and cparams empty, so those two
      // buckets would otherwise never be seen making the trip.
      const metadata = await buildWithLayers([ buildLayer(defaultKey) ], 'J-Difficulty-FullBuckets');
      const layer = metadata.allMetadatas.get(defaultKey);

      // Assert
      expect(layer.actorEffects.xparams[0]).toBe(110);
      expect(layer.actorEffects.cparams[0]).toBe(120);
      expect(layer.enemyEffects.xparams[0]).toBe(60);
      expect(layer.enemyEffects.cparams[0]).toBe(80);
    });

    it('warns when two layers claim the same key, and keeps the last one', async () =>
    {
      // Arrange- a duplicated key is an authoring mistake in the editor rather than a crash, so it
      // reports itself and lets the later definition win.
      const warnSpy = vi.spyOn(console, 'warn')
        .mockImplementation(() => {});
      const first = buildLayer(defaultKey);
      const second = { ...buildLayer(defaultKey), name: 'Second Definition' };

      // Act
      const metadata = await buildWithLayers([ first, second ], 'J-Difficulty-Duplicate');

      // Assert
      expect(warnSpy)
        .toHaveBeenCalledWith(`Duplicate difficulty key definition detected for [${defaultKey}].`);
      expect(metadata.allMetadatas.get(defaultKey).name).toBe('Second Definition');

      warnSpy.mockRestore();
    });

    it('reports how many layers it loaded when external file load info is enabled', async () =>
    {
      // Arrange
      const logSpy = vi.spyOn(console, 'log')
        .mockImplementation(() => {});
      globalThis.J.BASE.Metadata.ShowExternalFileLoadInfo = true;

      // Act
      await buildWithLayers([ buildLayer(defaultKey) ], 'J-Difficulty-Logged');

      // Assert
      const [ [ logged ] ] = logSpy.mock.calls;
      expect(logged).toContain('1 difficulty layers');

      globalThis.J.BASE.Metadata.ShowExternalFileLoadInfo = false;
      logSpy.mockRestore();
    });

    it('names an unmistakable placeholder default when no default difficulty was configured', async () =>
    {
      // Arrange- the key is looked up against the layer table, so a project that never chose one
      // gets a miss that reads as a configuration mistake rather than silently resolving to
      // whichever layer happened to be first.
      const { default: DiffPluginMetadata } =
        await import('../../../../src/plugins/diff/core/_metadata/_pluginMetadata.js');
      globalThis.StorageManager.fsReadFile = () => JSON.stringify([ buildLayer('default_undefined') ]);
      const previous = globalThis.PluginManager;
      globalThis.PluginManager = {
        parameters: () => ({ initialPoints: '10' }),
        registerCommand() {},
      };

      // Act
      const metadata = new DiffPluginMetadata('J-Difficulty-NoDefault', '1.0.0');
      globalThis.PluginManager = previous;

      // Assert
      expect(metadata.defaultKey).toBe('default_undefined');
    });
  });
});
//endregion plugins/diff/_component/metadata.test.js
