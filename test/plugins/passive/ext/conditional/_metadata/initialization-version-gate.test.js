//region plugins/passive/ext/conditional/_metadata/initialization-version-gate.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  installPassiveHostGlobals,
  setPluginContextToJBase,
  setPluginContextToJPassive,
} from '../../../_component/fixtures/install-passive-host-globals.js';
import {
  installPassiveConditionalHostGlobals,
  setPluginContextToJPassiveConditional,
} from '../../../_component/fixtures/install-passive-conditional-host-globals.js';

/**
 * The J umbrella as J-Base and J-Passive built it, captured once and handed back before every test.
 *
 * J-Base's bootstrap can only run once per realm, so it is built a single time, and any case that lowers the
 * recorded version undoes that here rather than by re-importing.
 * @type {Object}
 */
let realJ;

describe('J-Passive-Conditional initialization version gate (direct src import)', () =>
{
  beforeAll(async () =>
  {
    installPassiveHostGlobals();

    setPluginContextToJBase();
    await import('../../../../../../src/plugins/_base/core/_metadata/initialization.js');

    setPluginContextToJPassive();
    await import('../../../../../../src/plugins/passive/core/_metadata/initialization.js');

    installPassiveConditionalHostGlobals();

    realJ = globalThis.J;
  });

  beforeEach(async () =>
  {
    // drop only this plugin's half of the module graph; J-Base's evaluated state stays put.
    vi.resetModules();

    globalThis.J = realJ;
    delete globalThis.J.PASSIVE.EXT.CONDITIONAL;

    // a fresh copy of the class, since its registry refuses the same plugin name twice.
    const { default: FreshPluginMetadata } =
      await import('../../../../../../src/plugins/_base/core/models/PluginMetadata.js');
    globalThis.PluginMetadata = FreshPluginMetadata;

    setPluginContextToJPassiveConditional();
  });

  it('loads when J-Base is exactly the required version', async () =>
  {
    // Arrange
    globalThis.J.BASE.Metadata.Version = '4.0.0';

    // Act
    await import('../../../../../../src/plugins/passive/ext/conditional/_metadata/initialization.js');

    // Assert
    expect(globalThis.J.PASSIVE.EXT.CONDITIONAL.Metadata.name)
      .toBe('J-Passive-Conditional');
  });

  it('refuses to load against a J-Base older than it needs', async () =>
  {
    // Arrange- the release just below the floor.
    globalThis.J.BASE.Metadata.Version = '3.20.0';

    // Act
    const attempt = import('../../../../../../src/plugins/passive/ext/conditional/_metadata/initialization.js');

    // Assert
    await expect(attempt)
      .rejects
      .toThrow('Either missing J-Base or has a lower version than the required: 4.0.0');
  });
});
//endregion plugins/passive/ext/conditional/_metadata/initialization-version-gate.test.js
