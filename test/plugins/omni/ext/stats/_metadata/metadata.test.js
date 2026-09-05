//region plugins/omni/ext/stats/_metadata/metadata.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  installOmniHostGlobals,
  setPluginContextToJBase,
  setPluginContextToJOmnipedia,
  setPluginContextToJOmniStats,
} from '../../../_component/fixtures/install-omni-host-globals.js';

/**
 * The J umbrella as J-Base built it, captured once and handed back before every test.
 *
 * J-Base's bootstrap can only run once per realm- it finishes by making `Array.empty`
 * non-configurable, and a second evaluation dies redefining it. So it is built a single time and any
 * mutation a test makes to the umbrella is undone here instead of by re-importing.
 * @type {object}
 */
let realJ;

describe('J-OMNI-Stats metadata (direct src import)', () =>
{
  beforeAll(async () =>
  {
    installOmniHostGlobals();

    setPluginContextToJBase();
    await import('../../../../../../src/plugins/_base/core/_metadata/initialization.js');

    realJ = globalThis.J;
  });

  beforeEach(async () =>
  {
    // drop only the omni half of the module graph; J-Base's evaluated modules stay put.
    vi.resetModules();

    globalThis.J = realJ;
    globalThis.J.BASE.Metadata.Version = '3.2.0';
    delete globalThis.J.OMNI;

    // PluginMetadata refuses a duplicate plugin name on a static registry, so each test needs its own
    // freshly-imported copy of the class to construct into.
    const { default: FreshPluginMetadata } =
      await import('../../../../../../src/plugins/_base/core/models/PluginMetadata.js');
    globalThis.PluginMetadata = FreshPluginMetadata;

    setPluginContextToJOmnipedia();
    await import('../../../../../../src/plugins/omni/core/_metadata/initialization.js');
  });

  describe('version gates', () =>
  {
    it('refuses to initialize against a J-Base older than it requires', async () =>
    {
      // Arrange.
      globalThis.J.BASE.Metadata.Version = '3.1.0';
      setPluginContextToJOmniStats();

      // Act.
      const boot = import('../../../../../../src/plugins/omni/ext/stats/_metadata/initialization.js');

      // Assert.
      await expect(boot).rejects.toThrow('3.2.0');
    });

    it('refuses to initialize against a J-Omnipedia older than it requires', async () =>
    {
      // Arrange: J-Base is fine, so only the omnipedia gate can be the one that fires.
      globalThis.J.OMNI.Metadata.version.version = () => '0.9.0';
      setPluginContextToJOmniStats();

      // Act.
      const boot = import('../../../../../../src/plugins/omni/ext/stats/_metadata/initialization.js');

      // Assert.
      await expect(boot).rejects.toThrow('1.0.0');
    });

    it('initializes when both requirements are satisfied', async () =>
    {
      // Arrange.
      setPluginContextToJOmniStats();

      // Act.
      await import('../../../../../../src/plugins/omni/ext/stats/_metadata/initialization.js');

      // Assert.
      expect(globalThis.J.OMNI.EXT.STATS.Metadata.name).toBe('J-OMNI-Stats');
    });
  });

  describe('namespace', () =>
  {
    beforeEach(async () =>
    {
      setPluginContextToJOmniStats();
      await import('../../../../../../src/plugins/omni/ext/stats/_metadata/initialization.js');
    });

    it('declares an alias map for every type this plugin augments', () =>
    {
      // Arrange.
      const expectedTypes = [
        'Game_Map',
        'Game_Party',
        'JABS_Engine',
        'Scene_Omnipedia',
        'Window_OmnipediaList',
      ];

      // Act.
      const declared = Object.keys(globalThis.J.OMNI.EXT.STATS.Aliased);

      // Assert.
      expect(declared.sort()).toEqual(expectedTypes);
    });

    it('publishes the omnipedia command this plugin adds', () =>
    {
      // Act.
      const { Command } = globalThis.J.OMNI.EXT.STATS.Metadata;

      // Assert.
      expect(Command.Name).toBe('Statistopedia');
      expect(Command.Symbol).toBe('stats-pedia');
    });

    it('publishes the switch gating the omnipedia command', () =>
    {
      // Act.
      const { EnabledSwitch } = globalThis.J.OMNI.EXT.STATS.Metadata;

      // Assert.
      expect(EnabledSwitch).toBe(111);
    });
  });
});
//endregion plugins/omni/ext/stats/_metadata/metadata.test.js
