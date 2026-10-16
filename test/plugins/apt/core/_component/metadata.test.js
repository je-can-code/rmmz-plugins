//region plugins/apt/core/_component/metadata.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { installAptHostGlobals } from './fixtures/install-apt-host-globals.js';
import { installPluginManagerWithParams } from '../../../../setup/install-plugin-manager-with-params.js';

describe('J-Aptitude metadata (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    await installAptHostGlobals(globalThis, {
      'max-level-threshold': '-1',
    });
  });

  it('parses the max level threshold out of the plugin parameters', () =>
  {
    // Arrange & Act & Assert
    expect(globalThis.J.APT.Metadata.maxLevelThreshold).toBe(-1);
  });

  it('treats a negative threshold as having no level limit at all', () =>
  {
    // Arrange & Act & Assert: -1 is the "unbounded" sentinel, not a real ceiling.
    expect(globalThis.J.APT.Metadata.usingLevelThresholdLimit).toBe(false);
  });

  describe('a threshold the author actually configured', () =>
  {
    /** @type {JAptitude_PluginMetadata} */
    let configuredMetadata;

    beforeAll(async () =>
    {
      // the host fixture can only boot one parameter set per realm, and it boots the unbounded
      // sentinel- which cannot tell "no limit was configured" from "limits never engage at all".
      // Building a second metadata under its own plugin name gets the other arm without a reboot.
      const { default: JAptitude_PluginMetadata } =
        await import('../../../../../src/plugins/apt/core/_metadata/_pluginMetadata.js');

      installPluginManagerWithParams(globalThis, 'J-Aptitude-configured-threshold', {
        'max-level-threshold': '5',
      });

      configuredMetadata = new JAptitude_PluginMetadata('J-Aptitude-configured-threshold', '1.0.0');
    });

    it('treats a zero-or-greater threshold as the limit being in use', () =>
    {
      // Arrange & Act & Assert
      expect(configuredMetadata.usingLevelThresholdLimit).toBe(true);
    });

    it('keeps the configured ceiling rather than collapsing it to the sentinel', () =>
    {
      // Arrange & Act & Assert: the flag above is only meaningful if the number behind it survived.
      expect(configuredMetadata.maxLevelThreshold).toBe(5);
    });
  });

  describe('host version requirements', () =>
  {
    it('throws when J-Base does not satisfy the minimum required version', async () =>
    {
      // Arrange: drop the already-installed J-Base metadata below this plugin's floor.
      vi.resetModules();
      const originalVersion = globalThis.J.BASE.Metadata.Version;
      globalThis.J.BASE.Metadata.Version = '0.0.1';
      globalThis.__PLUGIN_NAME__ = 'J-Aptitude';
      globalThis.__PLUGIN_VERSION__ = '1.0.0';

      // Act & Assert
      await expect(import('../../../../../src/plugins/apt/core/_metadata/initialization.js'))
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
      globalThis.__PLUGIN_NAME__ = 'J-Aptitude';
      globalThis.__PLUGIN_VERSION__ = '1.0.0';

      // Act & Assert
      await expect(import('../../../../../src/plugins/apt/core/_metadata/initialization.js'))
        .rejects.toThrow(/missing J-ABS/);

      // restore the real accessor rather than relying on restoreAllMocks.
      globalThis.J.ABS.Metadata.version.version = originalVersion;
    });

    it('loads without J-ABS at all, since the J-ABS floor only applies when J-ABS is installed', async () =>
    {
      // Arrange: J-ABS is optional, so take it away entirely, and clear J.APT so only this import can rebuild it.
      // the booted J-Aptitude already holds its own plugin name, so this boot registers under a name of its own.
      vi.resetModules();
      const originalAbs = globalThis.J.ABS;
      const originalApt = globalThis.J.APT;
      delete globalThis.J.ABS;
      delete globalThis.J.APT;
      installPluginManagerWithParams(globalThis, 'J-Aptitude-without-abs', {
        'max-level-threshold': '-1',
      });
      globalThis.__PLUGIN_NAME__ = 'J-Aptitude-without-abs';
      globalThis.__PLUGIN_VERSION__ = '1.0.0';

      // Act
      await import('../../../../../src/plugins/apt/core/_metadata/initialization.js');

      // Assert: the module ran past both version checks and built its metadata under this boot's name.
      expect(globalThis.J.APT.Metadata.name).toBe('J-Aptitude-without-abs');

      // restore J-ABS and the booted J.APT so later tests in this file are unaffected.
      globalThis.J.ABS = originalAbs;
      globalThis.J.APT = originalApt;
    });
  });
});
//endregion plugins/apt/core/_component/metadata.test.js
