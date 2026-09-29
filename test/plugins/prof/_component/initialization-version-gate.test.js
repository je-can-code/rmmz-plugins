//region plugins/prof/_component/initialization-version-gate.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  installProfHostGlobals,
  setPluginContextToJBase,
  setPluginContextToJProf,
} from './fixtures/install-prof-host-globals.js';

/**
 * The J umbrella as J-Base built it, captured once and handed back before every test.
 *
 * J-Base's bootstrap can only run once per realm, so it is built a single time, and any case that lowers the
 * recorded version undoes that here rather than by re-importing.
 * @type {Object}
 */
let realJ;

describe('J-Proficiency initialization version gate (direct src import)', () =>
{
  beforeAll(async () =>
  {
    installProfHostGlobals();

    setPluginContextToJBase();
    await import('../../../../src/plugins/_base/core/_metadata/initialization.js');

    // this plugin registers its formula context on J-Base's action as it loads.
    await import('../../../../src/plugins/_base/core/objects/Game_Action.js');

    realJ = globalThis.J;
  });

  beforeEach(async () =>
  {
    // drop only this plugin's half of the module graph; J-Base's evaluated state stays put.
    vi.resetModules();

    globalThis.J = realJ;
    delete globalThis.J.PROF;

    // a fresh copy of the class, since its registry refuses the same plugin name twice.
    const { default: FreshPluginMetadata } =
      await import('../../../../src/plugins/_base/core/models/PluginMetadata.js');
    globalThis.PluginMetadata = FreshPluginMetadata;

    setPluginContextToJProf();
  });

  it('loads when J-Base is exactly the required version', async () =>
  {
    // Arrange
    globalThis.J.BASE.Metadata.Version = '4.0.0';

    // Act
    await import('../../../../src/plugins/prof/core/_metadata/initialization.js');

    // Assert
    expect(globalThis.J.PROF.Metadata.name)
      .toBe('J-Proficiency');
  });

  it('refuses to load against a J-Base older than it needs', async () =>
  {
    // Arrange- the release just below the floor.
    globalThis.J.BASE.Metadata.Version = '3.20.0';

    // Act
    const attempt = import('../../../../src/plugins/prof/core/_metadata/initialization.js');

    // Assert
    await expect(attempt)
      .rejects
      .toThrow('Either missing J-Base or has a lower version than the required: 4.0.0');
  });
});
//endregion plugins/prof/_component/initialization-version-gate.test.js
