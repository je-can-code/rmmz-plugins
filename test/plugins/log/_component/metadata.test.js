//region plugins/log/_component/metadata.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { installLogHostGlobals, setPluginContextToJBase, setPluginContextToJLog } from './fixtures/install-log-host-globals.js';

describe('J-Log metadata (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installLogHostGlobals();

    setPluginContextToJBase();
    await import('../../../../src/plugins/_base/core/_metadata/initialization.js');

    setPluginContextToJLog();
    await import('../../../../src/plugins/log/core/_metadata/initialization.js');
  });

  it('parses the log window inactivity duration out of the plugin parameters', () =>
  {
    // Arrange & Act & Assert
    expect(globalThis.J.LOG.Metadata.InactivityTimerDuration).toBe(60);
  });

  it('throws when J-Base does not satisfy the minimum required version', async () =>
  {
    // Arrange: drop the already-installed J-Base metadata below this plugin's floor.
    vi.resetModules();
    const originalVersion = globalThis.J.BASE.Metadata.Version;
    globalThis.J.BASE.Metadata.Version = '0.0.1';
    setPluginContextToJLog();

    // Act & Assert
    await expect(import('../../../../src/plugins/log/core/_metadata/initialization.js'))
      .rejects.toThrow(/missing J-Base/);

    // restore the satisfying version so later tests in this file are unaffected.
    globalThis.J.BASE.Metadata.Version = originalVersion;
  });
});
//endregion plugins/log/_component/metadata.test.js
