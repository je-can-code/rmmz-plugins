//region plugins/regions/ext/skills/_component/metadata.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import {
  installRegionsFamilyPluginManager,
  installRegionsSkillsStackHostGlobals,
  setPluginContextToJBase,
  setPluginContextToJRegions,
  setPluginContextToJRegionsSkills,
} from '../../../_component/fixtures/install-regions-host-globals.js';

describe('J-Regions-Skills stack metadata (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installRegionsSkillsStackHostGlobals();

    setPluginContextToJBase();
    await import('../../../../../../src/plugins/_base/core/_metadata/initialization.js');

    setPluginContextToJRegions();
    await import('../../../../../../src/plugins/regions/core/_metadata/initialization.js');

    setPluginContextToJRegionsSkills();
    await import('../../../../../../src/plugins/regions/ext/skills/_metadata/initialization.js');
  });

  it('exposes the skills extension execution delay from plugin parameters', () =>
  {
    // Arrange & Act & Assert
    expect(Number(globalThis.J.REGIONS.EXT.SKILLS.Metadata.delayBetweenExecutions)).toBe(60);
  });

  it('falls back to a one-second cadence when the parameter was never configured', async () =>
  {
    // Arrange: a project that installed the plugin and never opened its parameters still gets a
    // usable cadence. Without the fallback the timer would be built on undefined and every region
    // skill would either fire every frame or never fire at all.
    //
    // Constructed directly under its own name rather than re-imported: `PluginMetadata` keeps a
    // static registry of every plugin it has seen and throws on a duplicate, and that registry
    // outlives `vi.resetModules()` because the class reaches this realm as a bare global.
    const { default: J_RegionSkillsPluginMetadata } = await import(
      '../../../../../../src/plugins/regions/ext/skills/_metadata/_pluginMetadata.js');
    installRegionsFamilyPluginManager(globalThis, { skills: {} });

    // Act
    const metadata = new J_RegionSkillsPluginMetadata('J-Region-Skills-Unconfigured', '1.0.0');

    // Assert
    expect(Number(metadata.delayBetweenExecutions)).toBe(60);
  });
});
//endregion plugins/regions/ext/skills/_component/metadata.test.js
