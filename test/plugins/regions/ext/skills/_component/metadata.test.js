//region plugins/regions/ext/skills/_component/metadata.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import {
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
    await import('../../../../../../src/plugins/_base/_metadata/initialization.js');

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
});
//endregion plugins/regions/ext/skills/_component/metadata.test.js
