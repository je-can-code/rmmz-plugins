//region plugins/popups/ext/apt/_metadata/metadata.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import {
  installPopupsHostGlobals,
  setPluginContextToJBase,
  setPluginContextToJPopups,
  setPluginContextToJPopupsApt,
} from '../../../_component/fixtures/install-popups-host-globals.js';

const APT_INIT_PATH = '../../../../../../src/plugins/popups/ext/apt/_metadata/initialization.js';

describe('J-Popups-APT metadata (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installPopupsHostGlobals();

    setPluginContextToJBase();
    await import('../../../../../../src/plugins/_base/_metadata/initialization.js');

    // J_EventEmitter extends PIXI.utils.EventEmitter at module-evaluation time, so it can only be
    // imported once the fixture's PIXI stub is already standing.
    ({ default: globalThis.J_EventEmitter } =
      await import('../../../../../../src/plugins/_base/models/J_EventEmitter.js'));

    setPluginContextToJPopups();
    await import('../../../../../../src/plugins/popups/core/_metadata/initialization.js');

    setPluginContextToJPopupsApt();
    await import(APT_INIT_PATH);
  });

  it('declares the aliased-method map for the engine class it patches', () =>
  {
    // Arrange & Act & Assert- JABS_Engine is where the aptitude popup is emitted from.
    expect(globalThis.J.POPUPS.EXT.APT.Aliased.JABS_Engine).toBeInstanceOf(Map);
  });

  it('starts that alias map empty so the patching code owns every entry in it', () =>
  {
    // Arrange & Act & Assert
    expect(globalThis.J.POPUPS.EXT.APT.Aliased.JABS_Engine.size).toBe(0);
  });

  it('completes the base plugin metadata initialization it extends', () =>
  {
    // Arrange & Act & Assert
    expect(globalThis.J.POPUPS.EXT.APT.Metadata.parsedPluginParameters).toBeDefined();
  });

  describe('namespace guards', () =>
  {
    /**
     * Re-imports the extension against a fresh PluginMetadata so its static name registry starts
     * empty; the registry throws on a duplicate name and otherwise survives module resets.
     */
    const rebootExtension = async () =>
    {
      vi.resetModules();

      const { default: FreshPluginMetadata } =
        await import('../../../../../../src/plugins/_base/models/PluginMetadata.js');
      globalThis.PluginMetadata = FreshPluginMetadata;

      setPluginContextToJPopupsApt();
      await import(APT_INIT_PATH);
    };

    it('rebuilds the whole namespace chain when nothing has loaded yet', async () =>
    {
      // Arrange- plugin load order is user-controlled, so every umbrella above this one may be absent.
      delete globalThis.J;

      // Act
      await rebootExtension();

      // Assert
      expect(globalThis.J.POPUPS.EXT.APT.Aliased.JABS_Engine).toBeInstanceOf(Map);
    });

    it('preserves an already-populated APT namespace instead of clobbering it', async () =>
    {
      // Arrange- unlike its sibling extensions this one guards its own namespace with `|| {}`, so
      // anything a prior load put there has to survive.
      globalThis.J = { POPUPS: { EXT: { APT: { PreExisting: 'kept' } } } };

      // Act
      await rebootExtension();

      // Assert
      expect(globalThis.J.POPUPS.EXT.APT.PreExisting).toBe('kept');
    });

    it('preserves an already-populated alias bag on that namespace', async () =>
    {
      // Arrange- the alias bag is guarded separately, so a sibling's entries must survive too.
      globalThis.J = { POPUPS: { EXT: { APT: { Aliased: { Scene_Map: new Map() } } } } };

      // Act
      await rebootExtension();

      // Assert
      expect(globalThis.J.POPUPS.EXT.APT.Aliased.Scene_Map).toBeInstanceOf(Map);
      expect(globalThis.J.POPUPS.EXT.APT.Aliased.JABS_Engine).toBeInstanceOf(Map);
    });
  });
});
//endregion plugins/popups/ext/apt/_metadata/metadata.test.js
