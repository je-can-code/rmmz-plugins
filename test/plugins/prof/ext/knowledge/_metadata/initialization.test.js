//region plugins/prof/ext/knowledge/_metadata/initialization.test.js
import { afterEach, describe, expect, it, vi } from 'vitest';

/**
 * An extension loaded against a host too old to support it fails in ways that look like anything but a
 * version problem- a method that is not there, a namespace that is empty, a grant that never happens.
 * The gates exist so that the failure names itself at boot instead, and they are only worth having if
 * they actually fire.
 */
describe('J-Proficiency-Knowledge initialization version gates', () =>
{
  afterEach(() =>
  {
    delete globalThis.J;
    delete globalThis.PluginMetadata;
    delete globalThis.__PLUGIN_NAME__;
    delete globalThis.__PLUGIN_VERSION__;
  });

  /**
   * Stands up the smallest world the gates read, with each host reporting whether it satisfies.
   * @param {boolean} baseSatisfies Whether J-Base is to report itself new enough.
   * @param {boolean} proficiencySatisfies Whether J-Proficiency is to report itself new enough.
   */
  function installHostsWhere(baseSatisfies, proficiencySatisfies)
  {
    vi.resetModules();

    globalThis.__PLUGIN_NAME__ = 'J-Proficiency-Knowledge';
    globalThis.__PLUGIN_VERSION__ = '1.0.0';

    // the metadata module is imported before the gates run, and its class declaration extends this as a
    // bare global- so it has to exist even in the runs that never construct one.
    globalThis.PluginMetadata = class
    {
    };

    globalThis.J = {
      BASE: {
        Metadata: { Version: '0.0.0' },
        Helpers: {
          satisfies: currentVersion => (currentVersion === 'base'
            ? baseSatisfies
            : proficiencySatisfies),
        },
      },
      PROF: {
        Metadata: { version: { version: () => 'proficiency' } },
        EXT: {},
      },
    };

    // the base gate reads a bare string while the proficiency gate reads a method, so the stub above
    // tells them apart by what it is handed.
    globalThis.J.BASE.Metadata.Version = 'base';
  }

  it('refuses to load against a J-Base older than it needs', async () =>
  {
    // Arrange
    installHostsWhere(false, true);

    // Act & Assert
    await expect(import('../../../../../../src/plugins/prof/ext/knowledge/_metadata/initialization.js'))
      .rejects
      .toThrow('Either missing J-Base or has a lower version than the required: 3.2.0');
  });

  it('refuses to load against a J-Proficiency older than it needs', async () =>
  {
    // Arrange- base passes, so only the second gate can be what stops it.
    installHostsWhere(true, false);

    // Act & Assert
    await expect(import('../../../../../../src/plugins/prof/ext/knowledge/_metadata/initialization.js'))
      .rejects
      .toThrow('Either missing J-Proficiency or has a lower version than the required: 2.3.0');
  });
});
//endregion plugins/prof/ext/knowledge/_metadata/initialization.test.js