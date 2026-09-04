//region plugins/abs/ext/dps/_metadata/metadata.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import {
  installAbsHostGlobals,
  setPluginContextToJAbs,
  setPluginContextToJBase,
} from '../../../_component/fixtures/install-abs-host-globals.js';
import { setPluginContextToJabsDps } from '../_component/fixtures/install-abs-dps-host-globals.js';
import { installPluginManagerWithParams } from '../../../../../setup/install-plugin-manager-with-params.js';

describe('J-ABS-Dps metadata (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installAbsHostGlobals();

    setPluginContextToJBase();
    await import('../../../../../../src/plugins/_base/core/_metadata/initialization.js');

    setPluginContextToJAbs();
    await import('../../../../../../src/plugins/abs/core/_metadata/initialization.js');

    installPluginManagerWithParams(globalThis, 'J-ABS-Dps', { rollingWindowSeconds: '8' });

    setPluginContextToJabsDps();
    await import('../../../../../../src/plugins/abs/ext/dps/_metadata/initialization.js');
  });

  it('publishes itself under the namespace its owner declared', () =>
  {
    // Arrange & Act & Assert- J-ABS owns the EXT namespace; dps is a tenant of it.
    expect(globalThis.J.ABS.EXT.DPS.Metadata.name).toBe('J-ABS-Dps');
  });

  it('takes the rolling window length from its plugin parameters', () =>
  {
    // Arrange & Act & Assert- eight, rather than the five the parameter defaults to.
    expect(globalThis.J.ABS.EXT.DPS.Metadata.rollingWindowSeconds).toBe(8);
  });

  it('expresses the rolling window in the frames the tracker measures in', () =>
  {
    // Arrange & Act & Assert
    expect(globalThis.J.ABS.EXT.DPS.Metadata.rollingWindowFrames).toBe(480);
  });

  it('initializes an empty aliased map for the class it hooks', () =>
  {
    // Arrange & Act
    const { Aliased } = globalThis.J.ABS.EXT.DPS;

    // Assert
    expect(Aliased.JABS_Engine).toBeInstanceOf(Map);
  });

  it('falls back to a five second window when unconfigured', async () =>
  {
    // Arrange- published under a name the plugin manager has no parameters for, because the real
    // ship's own name is already registered and a second registration of it throws.
    const module = await import('../../../../../../src/plugins/abs/ext/dps/_metadata/_pluginMetadata.js');
    const JAbsDps_PluginMetadata = module.default;

    // Act
    const metadata = new JAbsDps_PluginMetadata('J-ABS-Dps-Unconfigured', '1.0.0');

    // Assert
    expect(metadata.rollingWindowSeconds).toBe(5);
  });
});
//endregion plugins/abs/ext/dps/_metadata/metadata.test.js