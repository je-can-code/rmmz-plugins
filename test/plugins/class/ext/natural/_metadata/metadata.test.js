//region plugins/class/ext/natural/_metadata/metadata.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { installClassNaturalRealm } from '../_component/fixtures/install-class-natural-realm.js';

/**
 * J-Classes-Natural's bootstrap, and the three hosts it refuses to boot without.
 */
describe('J-Classes-Natural metadata', () =>
{
  beforeAll(async () =>
  {
    await installClassNaturalRealm();
  });

  it('identifies itself under the J-Classes extension namespace', () =>
  {
    // Arrange & Act & Assert
    expect(globalThis.J.CLASS.EXT.NATURAL.Metadata.name)
      .toBe('J-Classes-Natural');
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
        await import('../../../../../../src/plugins/class/ext/natural/_metadata/initialization.js');
      }
      finally
      {
        restore();
      }
    };

    /**
     * Builds a lowering for a host whose version is read through its metadata's version object.
     * @param {function(): object} versionHolderOf Resolves the host's `Metadata.version`.
     * @returns {function(): function(): void} The lowering, returning its undo.
     */
    const lowerThrough = versionHolderOf => () =>
    {
      const holder = versionHolderOf();
      const original = holder.version;
      holder.version = () => '0.0.1';

      return () =>
      {
        holder.version = original;
      };
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
      const lowerClasses = lowerThrough(() => globalThis.J.CLASS.Metadata.version);

      // Act & Assert
      await expect(bootWithLoweredHost(lowerClasses))
        .rejects.toThrow(/missing J-Classes/);
    });

    it('throws when J-NaturalGrowth does not satisfy the minimum required version', async () =>
    {
      // Arrange
      const lowerNatural = lowerThrough(() => globalThis.J.NATURAL.Metadata.version);

      // Act & Assert
      await expect(bootWithLoweredHost(lowerNatural))
        .rejects.toThrow(/missing J-NaturalGrowth/);
    });
  });
});
//endregion plugins/class/ext/natural/_metadata/metadata.test.js