//region plugins/regions/core/_component/metadata.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import {
  DEFAULT_REGION_EFFECTS_PLUGIN_PARAMS,
  installRegionsCoreHostGlobals,
  setPluginContextToJBase,
  setPluginContextToJRegions,
} from '../../_component/fixtures/install-regions-host-globals.js';

describe('J-RegionEffects metadata (direct src import)', () =>
{
  let J_RegionEffectsPluginMetadata;

  beforeAll(async () =>
  {
    vi.resetModules();

    installRegionsCoreHostGlobals(globalThis, DEFAULT_REGION_EFFECTS_PLUGIN_PARAMS);

    setPluginContextToJBase();
    await import('../../../../../src/plugins/_base/core/_metadata/initialization.js');

    setPluginContextToJRegions();
    await import('../../../../../src/plugins/regions/core/_metadata/initialization.js');

    ({ default: J_RegionEffectsPluginMetadata } = await import(
      '../../../../../src/plugins/regions/core/_metadata/_pluginMetadata.js'
    ));
  });

  describe('default plugin parameters', () =>
  {
    it('captures a bracketed region list from an allow tag', () =>
    {
      // Arrange & Act
      const [ first ] = [ ...'<allowRegions:[1, 2, 3]>'.matchAll(globalThis.J.REGIONS.RegExp.AllowRegions) ];

      // Assert
      expect(first[1]).toBe('[1, 2, 3]');
    });

    it('captures a bracketed region list from a deny tag', () =>
    {
      // Arrange & Act
      const [ first ] = [ ...'<denyRegions:[7]>'.matchAll(globalThis.J.REGIONS.RegExp.DenyRegions) ];

      // Assert
      expect(first[1]).toBe('[7]');
    });

    it('refuses a region list holding a non-numeric entry', () =>
    {
      // Arrange & Act
      const matches = [ ...'<allowRegions:[grass]>'.matchAll(globalThis.J.REGIONS.RegExp.AllowRegions) ];

      // Assert: regions are numeric ids, so a named entry means the tag is simply invalid.
      expect(matches).toHaveLength(0);
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
//endregion plugins/regions/core/_component/metadata.test.js
