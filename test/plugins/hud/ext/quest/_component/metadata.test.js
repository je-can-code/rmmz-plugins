//region plugins/hud/ext/quest/_component/metadata.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  installHudHostGlobals,
  setPluginContextToJBase,
  setPluginContextToJHudQuest,
} from '../../../_component/fixtures/install-hud-host-globals.js';

describe('J-HUD-QuestFrame metadata (direct src import)', () =>
{
  /** @type {object} the J umbrella as J-Base built it; J-Base's bootstrap is once-per-realm. */
  let realJ;

  beforeAll(async () =>
  {
    installHudHostGlobals();

    setPluginContextToJBase();
    await import('../../../../../../src/plugins/_base/core/_metadata/initialization.js');

    realJ = globalThis.J;
  });

  beforeEach(async () =>
  {
    vi.resetModules();

    globalThis.J = realJ;
    globalThis.J.BASE.Metadata.Version = '3.2.0';

    // this extension gates on the *parent* plugin's version as well as J-Base's, so a minimal HUD
    // umbrella has to exist before the extension will load at all.
    globalThis.J.HUD = {
      Metadata: { version: { version: () => '2.0.0' } },
      EXT: {},
    };

    // PluginMetadata's registry is a private static that throws on a duplicate name; re-importing the
    // class after the module reset hands each test a private, empty registry.
    const { default: FreshPluginMetadata } = await import(
      '../../../../../../src/plugins/_base/core/models/PluginMetadata.js');
    globalThis.PluginMetadata = FreshPluginMetadata;

    setPluginContextToJHudQuest();
  });

  describe('version gates', () =>
  {
    it('initializes when both J-Base and J-HUD satisfy their required versions', async () =>
    {
      // Arrange & Act
      await import('../../../../../../src/plugins/hud/ext/quest/_metadata/initialization.js');

      // Assert: the alias surface is declared after the version gate, so its presence is what
      // proves initialization ran all the way through rather than throwing partway.
      expect(Object.keys(globalThis.J.HUD.EXT.QUEST.Aliased))
        .toEqual([ 'Scene_Map', 'Scene_Questopedia', 'TrackedOmniQuest', 'TrackedOmniObjective', 'HudManager' ]);
    });

    it('throws when J-Base is below the required version', async () =>
    {
      // Arrange
      globalThis.J.BASE.Metadata.Version = '1.0.0';

      // Act & Assert
      await expect(import('../../../../../../src/plugins/hud/ext/quest/_metadata/initialization.js'))
        .rejects.toThrow('Either missing J-Base or has a lower version than the required: 3.2.0');
    });

    it('throws when J-HUD is below the required version', async () =>
    {
      // Arrange- the quest frame draws inside the HUD's own layout, so an older parent would not
      // expose the surfaces it patches.
      globalThis.J.HUD.Metadata.version.version = () => '1.0.0';

      // Act & Assert
      await expect(import('../../../../../../src/plugins/hud/ext/quest/_metadata/initialization.js'))
        .rejects.toThrow('Either missing J-HUD or has a lower version than the required: 2.0.0');
    });

    it('reuses the existing J umbrella rather than replacing it', async () =>
    {
      // Arrange
      const umbrellaBeforeImport = globalThis.J;

      // Act
      await import('../../../../../../src/plugins/hud/ext/quest/_metadata/initialization.js');

      // Assert- the truthy side of `globalThis.J ||= {}` keeps every J plugin sharing one namespace.
      expect(globalThis.J).toBe(umbrellaBeforeImport);
    });

    it('throws when J-Base has not been loaded at all', async () =>
    {
      // Arrange- the falsy side of `globalThis.J ||= {}` creates a bare object with no BASE on it,
      // which is what a wrong plugin load order looks like in the editor.
      delete globalThis.J;

      // Act & Assert
      await expect(import('../../../../../../src/plugins/hud/ext/quest/_metadata/initialization.js'))
        .rejects.toThrow(TypeError);
    });
  });

  describe('J.HUD.EXT.QUEST namespace', () =>
  {
    beforeEach(async () =>
    {
      await import('../../../../../../src/plugins/hud/ext/quest/_metadata/initialization.js');
    });

    it('creates an aliased-method map for every class the plugin patches', () =>
    {
      // Arrange & Act
      const { Aliased } = globalThis.J.HUD.EXT.QUEST;

      // Assert- a missing map surfaces later as "cannot read set of undefined" at patch time.
      expect(Aliased.Scene_Map).toBeInstanceOf(Map);
      expect(Aliased.Scene_Questopedia).toBeInstanceOf(Map);
      expect(Aliased.TrackedOmniQuest).toBeInstanceOf(Map);
      expect(Aliased.TrackedOmniObjective).toBeInstanceOf(Map);
      expect(Aliased.HudManager).toBeInstanceOf(Map);
    });

    it('still performs the base PluginMetadata initialization it extends', () =>
    {
      // Arrange & Act
      const metadata = globalThis.J.HUD.EXT.QUEST.Metadata;

      // Assert- postInitialize is an extension, so the parent's parameter parsing must also have run.
      expect(metadata.parsedPluginParameters).toBeDefined();
    });

    it('preserves an existing QUEST namespace rather than replacing it', async () =>
    {
      // Arrange- `J.HUD.EXT.QUEST ||= {}` lets a sibling file stake out the namespace first.
      vi.resetModules();
      globalThis.J.HUD.EXT.QUEST = { placedEarlier: true };
      const { default: FreshPluginMetadata } = await import(
        '../../../../../../src/plugins/_base/core/models/PluginMetadata.js');
      globalThis.PluginMetadata = FreshPluginMetadata;

      // Act
      await import('../../../../../../src/plugins/hud/ext/quest/_metadata/initialization.js');

      // Assert
      expect(globalThis.J.HUD.EXT.QUEST.placedEarlier).toBe(true);
      expect(globalThis.J.HUD.EXT.QUEST.Metadata).toBeDefined();
    });
  });
});
//endregion plugins/hud/ext/quest/_component/metadata.test.js
