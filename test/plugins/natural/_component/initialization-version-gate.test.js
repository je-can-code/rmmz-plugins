//region plugins/natural/_component/initialization-version-gate.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  installNaturalHostGlobals,
  setPluginContextToJBase,
  setPluginContextToJNatural,
} from './fixtures/install-natural-host-globals.js';

/**
 * The J umbrella as J-Base built it, captured once and handed back before every test.
 *
 * J-Base's bootstrap can only run once per realm, so it is built a single time, and any case that lowers the
 * recorded version undoes that here rather than by re-importing.
 * @type {Object}
 */
let realJ;

describe('J-NaturalGrowth initialization version gate (direct src import)', () =>
{
  beforeAll(async () =>
  {
    installNaturalHostGlobals();

    setPluginContextToJBase();
    await import('../../../../src/plugins/_base/core/_metadata/initialization.js');

    realJ = globalThis.J;
  });

  beforeEach(async () =>
  {
    // drop only this plugin's half of the module graph; J-Base's evaluated state stays put.
    vi.resetModules();

    globalThis.J = realJ;
    delete globalThis.J.NATURAL;

    // a fresh copy of the class, since its registry refuses the same plugin name twice.
    const { default: FreshPluginMetadata } =
      await import('../../../../src/plugins/_base/core/models/PluginMetadata.js');
    globalThis.PluginMetadata = FreshPluginMetadata;

    setPluginContextToJNatural();
  });

  it('loads when J-Base is exactly the required version', async () =>
  {
    // Arrange
    globalThis.J.BASE.Metadata.Version = '4.0.0';

    // Act
    await import('../../../../src/plugins/natural/core/_metadata/initialization.js');

    // Assert
    expect(globalThis.J.NATURAL.Metadata.name)
      .toBe('J-NaturalGrowth');
  });

  it('refuses to load against a J-Base older than it needs', async () =>
  {
    // Arrange- the release just below the floor.
    globalThis.J.BASE.Metadata.Version = '3.20.0';

    // Act
    const attempt = import('../../../../src/plugins/natural/core/_metadata/initialization.js');

    // Assert
    await expect(attempt)
      .rejects
      .toThrow('Either missing J-Base or has a lower version than the required: 4.0.0');
  });
});
//endregion plugins/natural/_component/initialization-version-gate.test.js
