//region plugins/abs/ext/time/_metadata/metadata.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import {
  installAbsHostGlobals,
  setPluginContextToJAbs,
  setPluginContextToJBase,
} from '../../../_component/fixtures/install-abs-host-globals.js';
import { installJTimeVersionStub, setPluginContextToJabsTime } from '../_component/fixtures/install-abs-time-host-globals.js';
import { installPluginManagerWithParams } from '../../../../../setup/install-plugin-manager-with-params.js';

describe('J-ABS-Time metadata (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installAbsHostGlobals();

    setPluginContextToJBase();
    await import('../../../../../../src/plugins/_base/core/_metadata/initialization.js');

    setPluginContextToJAbs();
    await import('../../../../../../src/plugins/abs/core/_metadata/initialization.js');

    // the ship declares no parameters of its own; the base metadata still parses the (empty) set.
    installPluginManagerWithParams(globalThis, 'J-ABS-Time', {});

    installJTimeVersionStub();

    setPluginContextToJabsTime();
    await import('../../../../../../src/plugins/abs/ext/time/_metadata/initialization.js');
  });

  it('establishes the extension namespace with its metadata', () =>
  {
    // Arrange & Act
    const { Metadata } = globalThis.J.ABS.EXT.TIME;

    // Assert
    expect(Metadata.parsedPluginParameters).toBeDefined();
  });

  describe('host version requirements', () =>
  {
    it('throws when J-Base does not satisfy the minimum required version', async () =>
    {
      // Arrange: drop the already-installed J-Base metadata below this extension's floor.
      vi.resetModules();
      const originalVersion = globalThis.J.BASE.Metadata.Version;
      globalThis.J.BASE.Metadata.Version = '0.0.1';
      setPluginContextToJabsTime();

      // Act & Assert
      await expect(import('../../../../../../src/plugins/abs/ext/time/_metadata/initialization.js'))
        .rejects.toThrow(/missing J-Base/);

      // restore the satisfying version so later tests in this file are unaffected.
      globalThis.J.BASE.Metadata.Version = originalVersion;
    });

    it('throws when J-ABS does not satisfy the minimum required version', async () =>
    {
      // Arrange: J-Base has to keep passing so the J-ABS check is the one that trips.
      vi.resetModules();
      const originalVersion = globalThis.J.ABS.Metadata.version.version;
      globalThis.J.ABS.Metadata.version.version = () => '0.0.1';
      setPluginContextToJabsTime();

      // Act & Assert
      await expect(import('../../../../../../src/plugins/abs/ext/time/_metadata/initialization.js'))
        .rejects.toThrow(/missing J-ABS/);

      // restore the real accessor rather than relying on restoreAllMocks.
      globalThis.J.ABS.Metadata.version.version = originalVersion;
    });

    it('throws when J-TIME does not satisfy the minimum required version', async () =>
    {
      // Arrange: J-Base and J-ABS have to keep passing so the J-TIME check is the one that trips.
      vi.resetModules();
      globalThis.J.TIME.Metadata.version.version = () => '0.0.1';
      setPluginContextToJabsTime();

      // Act & Assert
      await expect(import('../../../../../../src/plugins/abs/ext/time/_metadata/initialization.js'))
        .rejects.toThrow(/missing J-TIME/);

      // restore the satisfying stub so later tests in this file are unaffected.
      installJTimeVersionStub();
    });
  });
});
//endregion plugins/abs/ext/time/_metadata/metadata.test.js