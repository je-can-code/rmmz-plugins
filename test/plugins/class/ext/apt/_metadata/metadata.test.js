//region plugins/class/ext/apt/_metadata/metadata.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { installClassAptRealm } from '../_component/fixtures/install-class-apt-realm.js';

/**
 * J-Classes-Aptitude's bootstrap, and the three hosts it refuses to boot without.
 */
describe('J-Classes-Aptitude metadata', () =>
{
  beforeAll(async () =>
  {
    await installClassAptRealm();
  });

  it('identifies itself under the J-Classes extension namespace', () =>
  {
    // Arrange & Act & Assert
    expect(globalThis.J.CLASS.EXT.APT.Metadata.name)
      .toBe('J-Classes-Aptitude');
  });

  describe('host version requirements', () =>
  {
    /**
     * Re-runs the extension's bootstrap with one host's version dropped below its floor.
     * @param {function(): function(): void} lowerVersion Lowers a host's version and returns its undo.
     * @returns {Promise<void>} Rejects with the bootstrap's error.
     */
    const bootWithLoweredHost = async lowerVersion =>
    {
      vi.resetModules();
      const restore = lowerVersion();

      try
      {
        await import('../../../../../../src/plugins/class/ext/apt/_metadata/initialization.js');
      }
      finally
      {
        restore();
      }
    };

    it('throws when J-Base does not satisfy the minimum required version', async () =>
    {
      // Arrange
      const lowerBase = () =>
      {
        const original = globalThis.J.BASE.Metadata.Version;
        globalThis.J.BASE.Metadata.Version = '0.0.1';

        return () =>
        {
          globalThis.J.BASE.Metadata.Version = original;
        };
      };

      // Act & Assert
      await expect(bootWithLoweredHost(lowerBase))
        .rejects.toThrow(/missing J-Base/);
    });

    it('throws when J-Classes does not satisfy the minimum required version', async () =>
    {
      // Arrange
      const lowerClasses = () =>
      {
        const original = globalThis.J.CLASS.Metadata.version.version;
        globalThis.J.CLASS.Metadata.version.version = () => '0.0.1';

        return () =>
        {
          globalThis.J.CLASS.Metadata.version.version = original;
        };
      };

      // Act & Assert
      await expect(bootWithLoweredHost(lowerClasses))
        .rejects.toThrow(/missing J-Classes/);
    });

    it('throws when J-Aptitude does not satisfy the minimum required version', async () =>
    {
      // Arrange
      const lowerAptitude = () =>
      {
        const original = globalThis.J.APT.Metadata.version.version;
        globalThis.J.APT.Metadata.version.version = () => '0.0.1';

        return () =>
        {
          globalThis.J.APT.Metadata.version.version = original;
        };
      };

      // Act & Assert
      await expect(bootWithLoweredHost(lowerAptitude))
        .rejects.toThrow(/missing J-Aptitude/);
    });
  });
});
//endregion plugins/class/ext/apt/_metadata/metadata.test.js