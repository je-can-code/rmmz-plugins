//region plugins/popups/ext/resources/_metadata/metadata.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import {
  installPopupsHostGlobals,
  setPluginContextToJBase,
  setPluginContextToJPopups,
  setPluginContextToJPopupsResources,
} from '../../../_component/fixtures/install-popups-host-globals.js';

const RESOURCES_INIT_PATH = '../../../../../../src/plugins/popups/ext/resources/_metadata/initialization.js';

describe('J-Popups-Resources metadata (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installPopupsHostGlobals();

    setPluginContextToJBase();
    await import('../../../../../../src/plugins/_base/core/_metadata/initialization.js');

    // J_EventEmitter extends PIXI.utils.EventEmitter at module-evaluation time, so it can only be
    // imported once the fixture's PIXI stub is already standing.
    ({ default: globalThis.J_EventEmitter } =
      await import('../../../../../../src/plugins/_base/core/models/J_EventEmitter.js'));

    setPluginContextToJPopups();
    await import('../../../../../../src/plugins/popups/core/_metadata/initialization.js');

    setPluginContextToJPopupsResources();
    await import(RESOURCES_INIT_PATH);
  });

  it('declares the aliased-method map for the battler class it patches', () =>
  {
    // Arrange & Act & Assert- a missing map surfaces later as "cannot read set of undefined".
    expect(globalThis.J.POPUPS.EXT.RESOURCES.Aliased.Game_Battler).toBeInstanceOf(Map);
  });

  it('starts that alias map empty so the patching code owns every entry in it', () =>
  {
    // Arrange & Act & Assert
    expect(globalThis.J.POPUPS.EXT.RESOURCES.Aliased.Game_Battler.size).toBe(0);
  });

  it('completes the base plugin metadata initialization it extends', () =>
  {
    // Arrange & Act & Assert
    expect(globalThis.J.POPUPS.EXT.RESOURCES.Metadata.parsedPluginParameters).toBeDefined();
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
        await import('../../../../../../src/plugins/_base/core/models/PluginMetadata.js');
      globalThis.PluginMetadata = FreshPluginMetadata;

      setPluginContextToJPopupsResources();
      await import(RESOURCES_INIT_PATH);
    };

    it('rebuilds the whole namespace chain when nothing has loaded yet', async () =>
    {
      // Arrange- plugin load order is user-controlled, so every umbrella above this one may be absent.
      delete globalThis.J;

      // Act
      await rebootExtension();

      // Assert
      expect(globalThis.J.POPUPS.EXT.RESOURCES.Aliased.Game_Battler).toBeInstanceOf(Map);
    });

    it('reuses an already-staked popups namespace rather than replacing it', async () =>
    {
      // Arrange- a sibling extension may have claimed J.POPUPS.EXT first, and clobbering it here
      // would erase that sibling's whole surface.
      globalThis.J = { POPUPS: { EXT: { SOMEOTHER: 'claimed' } } };

      // Act
      await rebootExtension();

      // Assert
      expect(globalThis.J.POPUPS.EXT.SOMEOTHER).toBe('claimed');
    });
  });
});
//endregion plugins/popups/ext/resources/_metadata/metadata.test.js
