//region plugins/regions/core/metadata.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import {
  DEFAULT_REGION_EFFECTS_PLUGIN_PARAMS,
  installRegionsCoreHostGlobals,
  setPluginContextToJBase,
  setPluginContextToJRegions,
} from '../fixtures/install-regions-host-globals.js';

describe('J-RegionEffects metadata (direct src import)', () =>
{
  let J_RegionEffectsPluginMetadata;

  beforeAll(async () =>
  {
    vi.resetModules();

    installRegionsCoreHostGlobals(globalThis, DEFAULT_REGION_EFFECTS_PLUGIN_PARAMS);

    setPluginContextToJBase();
    await import('../../../../src/plugins/_base/_metadata/initialization.js');

    setPluginContextToJRegions();
    await import('../../../../src/plugins/regions/core/_metadata/initialization.js');

    ({ default: J_RegionEffectsPluginMetadata } = await import(
      '../../../../src/plugins/regions/core/_metadata/_pluginMetadata.js'
    ));
  });

  describe('default plugin parameters', () =>
  {
    it('sets the metadata name to J-RegionEffects', () =>
    {
      // Arrange & Act & Assert
      expect(globalThis.J.REGIONS.Metadata.name).toBe('J-RegionEffects');
    });

    it('compiles a usable AllowRegions regex', () =>
    {
      // Arrange & Act & Assert
      expect(typeof globalThis.J.REGIONS.RegExp.AllowRegions.test).toBe('function');
    });

    it('compiles a usable DenyRegions regex', () =>
    {
      // Arrange & Act & Assert
      expect(typeof globalThis.J.REGIONS.RegExp.DenyRegions.test).toBe('function');
    });

    it('parses an empty globalAllowRegions default to an empty array', () =>
    {
      // Arrange & Act & Assert
      expect(globalThis.J.REGIONS.Metadata.globalAllowRegions).toEqual([]);
    });

    it('parses an empty globalDenyRegions default to an empty array', () =>
    {
      // Arrange & Act & Assert
      expect(globalThis.J.REGIONS.Metadata.globalDenyRegions).toEqual([]);
    });
  });

  describe('custom global region params', () =>
  {
    // constructing the metadata class directly (rather than re-importing initialization.js) avoids
    // re-running _base/_metadata/initialization.js's Array.empty/String.empty Object.defineProperty
    // calls a second time in this realm, which throw on redefinition.
    let customMetadata;

    beforeAll(() =>
    {
      const customParams = {
        ...DEFAULT_REGION_EFFECTS_PLUGIN_PARAMS,
        globalAllowRegions: '[1, 2]',
        globalDenyRegions: '[3]',
      };

      globalThis.PluginManager = {
        parameters: name => (name === 'J-RegionEffects-custom' ? customParams : {}),
        registerCommand()
        {
        },
      };

      customMetadata = new J_RegionEffectsPluginMetadata('J-RegionEffects-custom', '1.0.0');
    });

    it('translates the globalAllowRegions ids', () =>
    {
      // Arrange & Act & Assert
      expect(customMetadata.globalAllowRegions).toEqual([ 1, 2 ]);
    });

    it('translates the globalDenyRegions ids', () =>
    {
      // Arrange & Act & Assert
      expect(customMetadata.globalDenyRegions).toEqual([ 3 ]);
    });
  });
});
//endregion plugins/regions/core/metadata.test.js
