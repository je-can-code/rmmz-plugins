//region plugins/log/metadata.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { installLogHostGlobals, setPluginContextToJBase, setPluginContextToJLog } from './fixtures/install-log-host-globals.js';

describe('J-Log metadata (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installLogHostGlobals();

    setPluginContextToJBase();
    await import('../../../src/plugins/_base/_metadata/initialization.js');

    setPluginContextToJLog();
    await import('../../../src/plugins/log/core/_metadata/initialization.js');
  });

  it('initializes J.LOG metadata and inactivity duration from parameters', () =>
  {
    // Arrange & Act & Assert
    expect(globalThis.J.LOG.Metadata.name).toBe('J-Log');
    expect(globalThis.J.LOG.Metadata.InactivityTimerDuration).toBe(60);
  });
});
//endregion plugins/log/metadata.test.js
