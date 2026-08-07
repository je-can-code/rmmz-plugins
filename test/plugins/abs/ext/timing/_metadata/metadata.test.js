//region plugins/abs/ext/timing/_metadata/metadata.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import {
  installAbsHostGlobals,
  setPluginContextToJAbs,
  setPluginContextToJBase,
} from '../../../_component/fixtures/install-abs-host-globals.js';
import { setPluginContextToJabsTiming } from '../_component/fixtures/install-abs-timing-host-globals.js';
import { installPluginManagerWithParams } from '../../../../../setup/install-plugin-manager-with-params.js';

const INIT_PATH = '../../../../../../src/plugins/abs/ext/timing/_metadata/initialization.js';

describe('J-ABS-Timing metadata (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installAbsHostGlobals();

    setPluginContextToJBase();
    await import('../../../../../../src/plugins/_base/core/_metadata/initialization.js');

    setPluginContextToJAbs();
    await import('../../../../../../src/plugins/abs/core/_metadata/initialization.js');

    installPluginManagerWithParams(globalThis, 'J-ABS-Timing', {
      'baseCastSpeed': '12',
      'minimumCastTime': '4',
      'baseFastCooldown': '9',
      'minimumCooldown': '3',
    });

    setPluginContextToJabsTiming();
    await import(INIT_PATH);
  });

  it('declares an aliased-method map for every class the plugin patches', () =>
  {
    // Arrange & Act
    const { Aliased } = globalThis.J.ABS.EXT.TIMING;

    // Assert- a missing map surfaces later as "cannot read set of undefined" at patch time.
    expect(Aliased.Game_Actor).toBeInstanceOf(Map);
    expect(Aliased.Game_Battler).toBeInstanceOf(Map);
    expect(Aliased.Game_BattlerBase).toBeInstanceOf(Map);
    expect(Aliased.Game_Enemy).toBeInstanceOf(Map);
    expect(Aliased.JABS_Action).toBeInstanceOf(Map);
  });

  it('starts every alias map empty so the patching code owns each entry', () =>
  {
    // Arrange & Act
    const { Aliased } = globalThis.J.ABS.EXT.TIMING;

    // Assert
    expect(Aliased.Game_Actor.size).toBe(0);
    expect(Aliased.Game_Battler.size).toBe(0);
    expect(Aliased.Game_BattlerBase.size).toBe(0);
    expect(Aliased.Game_Enemy.size).toBe(0);
    expect(Aliased.JABS_Action.size).toBe(0);
  });

  it('completes the base plugin metadata initialization it extends', () =>
  {
    // Arrange & Act & Assert
    expect(globalThis.J.ABS.EXT.TIMING.Metadata.parsedPluginParameters).toBeDefined();
  });

  describe('plugin parameter translation', () =>
  {
    it('parses the cast timing floors into numbers', () =>
    {
      // Arrange & Act
      const { Metadata } = globalThis.J.ABS.EXT.TIMING;

      // Assert
      expect(Metadata.BaseCastSpeed).toBe(12);
      expect(Metadata.MinimumCastTime).toBe(4);
    });

    it('parses the cooldown timing floors into numbers', () =>
    {
      // Arrange & Act
      const { Metadata } = globalThis.J.ABS.EXT.TIMING;

      // Assert
      expect(Metadata.BaseFastCooldown).toBe(9);
      expect(Metadata.MinimumCooldown).toBe(3);
    });
  });

  describe('host version requirements', () =>
  {
    it('throws when J-Base does not satisfy the minimum required version', async () =>
    {
      // Arrange: drop the already-installed J-Base metadata below this extension's floor.
      vi.resetModules();
      const originalVersion = globalThis.J.BASE.Metadata.Version;
      globalThis.J.BASE.Metadata.Version = '0.0.1';
      setPluginContextToJabsTiming();

      // Act & Assert
      await expect(import(INIT_PATH)).rejects.toThrow(/missing J-Base/);

      // restore the satisfying version so later tests in this file are unaffected.
      globalThis.J.BASE.Metadata.Version = originalVersion;
    });

    it('throws when J-ABS does not satisfy the minimum required version', async () =>
    {
      // Arrange: J-Base has to keep passing so the J-ABS check is the one that trips.
      vi.resetModules();
      const originalVersion = globalThis.J.ABS.Metadata.version.version;
      globalThis.J.ABS.Metadata.version.version = () => '0.0.1';
      setPluginContextToJabsTiming();

      // Act & Assert
      await expect(import(INIT_PATH)).rejects.toThrow(/missing J-ABS/);

      // restore the real accessor rather than relying on restoreAllMocks.
      globalThis.J.ABS.Metadata.version.version = originalVersion;
    });
  });
describe('unconfigured parameters', () =>
  {
    it('falls back to its shipped defaults when the project never set any parameters', async () =>
    {
      // Arrange- a project that installs the plugin and never opens its parameter panel gets an
      // empty parameter object, and every default below is what stands in for the missing value.
      //
      // Constructed directly under its own name rather than re-imported: `PluginMetadata` keeps a
      // static registry of every plugin it has seen and throws on a duplicate, and that registry
      // outlives `vi.resetModules()` because the class reaches this realm as a bare global.
      const { default: Metadata } = await import(
        '../../../../../../src/plugins/abs/ext/timing/_metadata/_pluginMetadata.js');
      const previous = globalThis.PluginManager;
      globalThis.PluginManager = {
        parameters: () => ({}),
        registerCommand() {},
      };

      // Act
      const metadata = new Metadata('J-ABS-Timing-Unconfigured', '1.0.0');
      globalThis.PluginManager = previous;

      // Assert
      expect(metadata.BaseCastSpeed).toEqual(0);
      expect(metadata.MinimumCastTime).toEqual(0);
      expect(metadata.BaseFastCooldown).toEqual(0);
      expect(metadata.MinimumCooldown).toEqual(0);
    });
  });
});
//endregion plugins/abs/ext/timing/_metadata/metadata.test.js
