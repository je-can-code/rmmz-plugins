//region plugins/regions/ext/states/_component/metadata.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import {
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
});
//endregion plugins/regions/ext/states/_component/metadata.test.js
