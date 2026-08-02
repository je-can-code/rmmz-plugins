//region plugins/__ca-mods/_component/metadata.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { installCamodsHostGlobals, setPluginContextToJBase, setPluginContextToJCamods } from './fixtures/install-camods-host-globals.js';

describe('J-CA-Mods metadata (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installCamodsHostGlobals();

    setPluginContextToJBase();
    await import('../../../../src/plugins/_base/_metadata/initialization.js');

    setPluginContextToJCamods();
    await import('../../../../src/plugins/__ca-mods/core/_metadata/initialization.js');
  });

  it('points the enemies-defeated tracker at its game variable', () =>
  {
    // Arrange & Act & Assert
    expect(globalThis.J.CAMods.Tracking.EnemiesDefeated).toBe(101);
  });

  it('points the death-count tracker at its game variable', () =>
  {
    // Arrange & Act & Assert
    expect(globalThis.J.CAMods.Tracking.NumberOfDeaths).toBe(117);
  });
});
//endregion plugins/__ca-mods/_component/metadata.test.js
