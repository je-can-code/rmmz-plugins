//region plugins/abs/ext/allyai/_metadata/metadata.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import {
  installAbsHostGlobals,
  setPluginContextToJAbs,
  setPluginContextToJBase,
} from '../../../_component/fixtures/install-abs-host-globals.js';
import { setPluginContextToJabsAllyAi } from '../_component/fixtures/install-abs-allyai-host-globals.js';
import { installPluginManagerWithParams } from '../../../../../setup/install-plugin-manager-with-params.js';

describe('J-ABS-AllyAI metadata (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installAbsHostGlobals();

    setPluginContextToJBase();
    await import('../../../../../../src/plugins/_base/core/_metadata/initialization.js');

    setPluginContextToJAbs();
    await import('../../../../../../src/plugins/abs/core/_metadata/initialization.js');

    installPluginManagerWithParams(globalThis, 'J-ABS-AllyAI', {
      'jabsMenuAllyAiCommandName': 'Ally AI',
      'jabsMenuAllyAiCommandIconIndex': '2564',
      'jabsMenuAllyAiCommandSwitchId': '21',
      'partyWidePassiveText': 'Passive',
      'partyWidePassiveIconIndex': '73',
      'partyWideAggressiveText': 'Aggressive',
      'partyWideAggressiveIconIndex': '74',
      'aiModeEquipped': '91',
      'aiModeNotEquipped': '92',
      'allyFormationsCommandName': 'Formations',
      'allyFormationsCommandIconIndex': '75',
    });

    setPluginContextToJabsAllyAi();
    await import('../../../../../../src/plugins/abs/ext/allyai/_metadata/initialization.js');
  });

  it('declares an aliased-method map for every class the plugin patches', () =>
  {
    // Arrange & Act
    const { Aliased } = globalThis.J.ABS.EXT.ALLYAI;

    // Assert- a missing map surfaces later as "cannot read set of undefined" at patch time.
    expect(Aliased.Game_Actor).toBeInstanceOf(Map);
    expect(Aliased.Game_Battler).toBeInstanceOf(Map);
    expect(Aliased.Game_Follower).toBeInstanceOf(Map);
    expect(Aliased.Game_Followers).toBeInstanceOf(Map);
    expect(Aliased.Game_Interpreter).toBeInstanceOf(Map);
    expect(Aliased.Game_Map).toBeInstanceOf(Map);
    expect(Aliased.Game_Party).toBeInstanceOf(Map);
    expect(Aliased.Game_Player).toBeInstanceOf(Map);
    expect(Aliased.JABS_AiManager).toBeInstanceOf(Map);
    expect(Aliased.JABS_Battler).toBeInstanceOf(Map);
    expect(Aliased.JABS_Engine).toBeInstanceOf(Map);
    expect(Aliased.Scene_Map).toBeInstanceOf(Map);
    expect(Aliased.Scene_Menu).toBeInstanceOf(Map);
    expect(Aliased.Spriteset_Map).toBeInstanceOf(Map);
    expect(Aliased.Window_AllyAiSelect).toBeInstanceOf(Map);
    expect(Aliased.Window_MenuCommand).toBeInstanceOf(Map);
  });

  it('starts every alias map empty so the patching code owns each entry', () =>
  {
    // Arrange & Act
    const { Aliased } = globalThis.J.ABS.EXT.ALLYAI;

    // Assert
    expect(Aliased.Game_Actor.size).toBe(0);
    expect(Aliased.Game_Battler.size).toBe(0);
    expect(Aliased.Game_Follower.size).toBe(0);
    expect(Aliased.Game_Followers.size).toBe(0);
    expect(Aliased.Game_Interpreter.size).toBe(0);
    expect(Aliased.Game_Map.size).toBe(0);
    expect(Aliased.Game_Party.size).toBe(0);
    expect(Aliased.Game_Player.size).toBe(0);
    expect(Aliased.JABS_AiManager.size).toBe(0);
    expect(Aliased.JABS_Battler.size).toBe(0);
    expect(Aliased.JABS_Engine.size).toBe(0);
    expect(Aliased.Scene_Map.size).toBe(0);
    expect(Aliased.Scene_Menu.size).toBe(0);
    expect(Aliased.Spriteset_Map.size).toBe(0);
    expect(Aliased.Window_AllyAiSelect.size).toBe(0);
    expect(Aliased.Window_MenuCommand.size).toBe(0);
  });

  it('completes the base plugin metadata initialization it extends', () =>
  {
    // Arrange & Act & Assert
    expect(globalThis.J.ABS.EXT.ALLYAI.Metadata.parsedPluginParameters).toBeDefined();
  });

  describe('plugin parameter translation', () =>
  {
    it('carries the configured menu command name across', () =>
    {
      // Arrange & Act
      const { Metadata } = globalThis.J.ABS.EXT.ALLYAI;

      // Assert
      expect(Metadata.AllyAiCommandName).toBe("Ally AI");
    });

    it('parses the menu command icon and switch into numbers', () =>
    {
      // Arrange & Act
      const { Metadata } = globalThis.J.ABS.EXT.ALLYAI;

      // Assert
      expect(Metadata.AllyAiCommandIconIndex).toBe(2564);
      expect(Metadata.AllyAiCommandSwitchId).toBe(21);
    });

    it('keeps the passive and aggressive party-wide labels distinct', () =>
    {
      // Arrange & Act
      const { Metadata } = globalThis.J.ABS.EXT.ALLYAI;

      // Assert
      expect(Metadata.PartyAiPassiveText).toBe("Passive");
      expect(Metadata.PartyAiAggressiveText).toBe("Aggressive");
    });

    it('parses the equipped-mode icon index into a number', () =>
    {
      // Arrange & Act
      const { Metadata } = globalThis.J.ABS.EXT.ALLYAI;

      // Assert
      expect(Metadata.AiModeEquippedIconIndex).toBe(91);
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
      setPluginContextToJabsAllyAi();

      // Act & Assert
      await expect(import('../../../../../../src/plugins/abs/ext/allyai/_metadata/initialization.js'))
        .rejects.toThrow(/missing J-Base/);

      // restore the satisfying version so later tests in this file are unaffected.
      globalThis.J.BASE.Metadata.Version = originalVersion;
    });

    it('throws when J-ABS does not satisfy the minimum required version', async () =>
    {
      // Arrange: J-Base has to keep passing so the J-ABS check is the one that trips.
      vi.resetModules();
      const originalVersion = globalThis.J.ABS.Metadata.version.version;
      globalThis.J.ABS.Metadata.version.version = () => '0.0.1';
      setPluginContextToJabsAllyAi();

      // Act & Assert
      await expect(import('../../../../../../src/plugins/abs/ext/allyai/_metadata/initialization.js'))
        .rejects.toThrow(/missing J-ABS/);

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
        '../../../../../../src/plugins/abs/ext/allyai/_metadata/_pluginMetadata.js');
      const previous = globalThis.PluginManager;
      globalThis.PluginManager = {
        parameters: () => ({}),
        registerCommand() {},
      };

      // Act
      const metadata = new Metadata('J-ABS-AllyAI-Unconfigured', '1.0.0');
      globalThis.PluginManager = previous;

      // Assert
      expect(metadata.AllyFormationsCommandName).toEqual('Ally Formations');
      expect(metadata.AllyFormationsCommandIconIndex).toEqual(289);
    });
  });
});
//endregion plugins/abs/ext/allyai/_metadata/metadata.test.js
