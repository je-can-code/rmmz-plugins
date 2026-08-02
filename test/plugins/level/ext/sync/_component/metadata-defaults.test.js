//region plugins/level/ext/sync/_component/metadata-defaults.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import {
  installLevelHostGlobals,
  setPluginContextToJBase,
  setPluginContextToJLevel,
} from '../../../_component/fixtures/install-level-host-globals.js';
import { installPluginManagerWithParams } from '../../../../../setup/install-plugin-manager-with-params.js';

/**
 * Boots J-Level-Sync with no configured plugin parameters.
 *
 * The icon index is written as `Number(param) || 75`, so the fallback only runs when the parameter is
 * genuinely absent — which is exactly what a project sees the first time the plugin is dropped in and
 * played without opening the parameter panel.
 */
describe('J-Level-Sync metadata defaults with no configured parameters (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installLevelHostGlobals();

    setPluginContextToJBase();
    await import('../../../../../../src/plugins/_base/core/_metadata/initialization.js');

    setPluginContextToJLevel();
    await import('../../../../../../src/plugins/level/core/_metadata/initialization.js');

    // the empty parameter object here is the whole point of this file.
    installPluginManagerWithParams(globalThis, 'J-Level-Sync', {});

    globalThis.__PLUGIN_NAME__ = 'J-Level-Sync';
    globalThis.__PLUGIN_VERSION__ = '1.0.0';
    await import('../../../../../../src/plugins/level/ext/sync/_metadata/initialization.js');
  });

  it('falls back to the default sync indicator icon', () =>
  {
    // Arrange & Act
    const { syncIndicatorIconIndex } = globalThis.J.LEVEL.EXT.SYNC.Metadata;

    // Assert
    expect(syncIndicatorIconIndex).toBe(75);
  });

  it('leaves synced-level exp calculation disabled by default', () =>
  {
    // Arrange & Act
    const metadata = globalThis.J.LEVEL.EXT.SYNC.Metadata;

    // Assert- defaulting this off is what preserves J-Level-Flat's level-difference exp policy for
    // projects that never opt in.
    expect(metadata.syncAffectsExp).toBe(false);
  });
});
//endregion plugins/level/ext/sync/_component/metadata-defaults.test.js
