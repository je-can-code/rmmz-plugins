//region plugins/regions/ext/states/_component/metadata.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import {
  installRegionsFamilyPluginManager,
  installRegionsStatesStackHostGlobals,
  setPluginContextToJBase,
  setPluginContextToJRegions,
  setPluginContextToJRegionsStates,
} from '../../../_component/fixtures/install-regions-host-globals.js';

describe('J-Regions-States stack metadata (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installRegionsStatesStackHostGlobals();

    setPluginContextToJBase();
    await import('../../../../../../src/plugins/_base/core/_metadata/initialization.js');

    setPluginContextToJRegions();
    await import('../../../../../../src/plugins/regions/core/_metadata/initialization.js');

    setPluginContextToJRegionsStates();
    await import('../../../../../../src/plugins/regions/ext/states/_metadata/initialization.js');
  });

  it('exposes the states extension application delay from plugin parameters', () =>
  {
    // Arrange & Act & Assert
    expect(Number(globalThis.J.REGIONS.EXT.STATES.Metadata.delayBetweenApplications)).toBe(15);
  });

  it('falls back to a quarter-second cadence when the parameter was never configured', async () =>
  {
    // Arrange: a project that installed the plugin and never opened its parameters still gets a
    // usable cadence. Without the fallback the timer would be built on undefined and every region
    // state would either apply every frame or never apply at all.
    //
    // Constructed directly under its own name rather than re-imported: `PluginMetadata` keeps a
    // static registry of every plugin it has seen and throws on a duplicate, and that registry
    // outlives `vi.resetModules()` because the class reaches this realm as a bare global.
    const { default: J_RegionStatesPluginMetadata } = await import(
      '../../../../../../src/plugins/regions/ext/states/_metadata/_pluginMetadata.js');
    installRegionsFamilyPluginManager(globalThis, { states: {} });

    // Act
    const metadata = new J_RegionStatesPluginMetadata('J-Region-States-Unconfigured', '1.0.0');

    // Assert
    expect(Number(metadata.delayBetweenApplications)).toBe(15);
  });
});
//endregion plugins/regions/ext/states/_component/metadata.test.js
