//region plugins/apt/ext/typed/_component/metadata-and-commands.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const typedInitPath = '../../../../../../src/plugins/apt/ext/typed/_metadata/initialization.js';
const typedCommandsPath = '../../../../../../src/plugins/apt/ext/typed/_metadata/pluginCommands.js';
const pluginMetadataPath = '../../../../../../src/plugins/_base/models/PluginMetadata.js';

/**
 * `__PLUGIN_NAME__`/`__PLUGIN_VERSION__` are bare identifiers read once, at import time.
 * @param {object} [sandbox] Defaults to `globalThis`.
 */
function setPluginContextToJAptitudeTyped(sandbox = globalThis)
{
  sandbox.__PLUGIN_NAME__ = 'J-Aptitude-Typed';
  sandbox.__PLUGIN_VERSION__ = '1.0.0';
}

describe('J-Aptitude-Typed metadata and plugin commands (direct src import)', () =>
{
  /** @type {Map<string, Function>} */
  let registeredCommands;
  /** @type {object[]} */
  let partyMembers;

  beforeAll(async () =>
  {
    vi.resetModules();

    // this extension's bootstrap needs only a handful of bare globals, so the environment is built
    // by hand here rather than dragging in the whole aptitude host fixture. That matches how the
    // other apt/ext/typed tests are set up.
    ({ default: globalThis.JsonMapper } = await import('../../../../../../src/plugins/_base/_utilities/JsonMapper.js'));
    ({ default: globalThis.PluginMetadata } = await import(pluginMetadataPath));

    String.empty = '';

    // capture command handlers as they register so they can be invoked directly.
    registeredCommands = new Map();

    globalThis.PluginManager = {
      parameters(name)
      {
        if (name === 'J-Aptitude-Typed')
        {
          // authored the way the parameter panel presents them: percent points, and a JSON list.
          return {
            implicitEnemyElementPercent: '25',
            resistThreshold: '75',
            slayerWeaknessThreshold: '125',
            excludedAlignmentElements: '["physical","7"]',
          };
        }

        return {};
      },
      registerCommand(pluginName, commandName, handler)
      {
        registeredCommands.set(commandName, handler);
      },
    };

    setPluginContextToJAptitudeTyped();
    await import(typedInitPath);
    await import(typedCommandsPath);
  });

  beforeEach(() =>
  {
    partyMembers = [ { name: 'first' }, { name: 'second' } ];

    globalThis.$gameParty = { members: () => partyMembers };
    globalThis.$gameActors = { actor: id => ({ name: `actor-${id}` }) };
    globalThis.ApManager = { gainTypedAp: vi.fn() };
  });

  describe('namespace construction', () =>
  {
    it('creates an aliased-method map for every class the plugin patches', () =>
    {
      // Arrange & Act
      const { Aliased } = globalThis.J.APT.EXT.TYPED;

      // Assert- a missing map surfaces later as "cannot read set of undefined" at patch time.
      expect(Aliased.ApManager).toBeInstanceOf(Map);
      expect(Aliased.Game_Temp).toBeInstanceOf(Map);
      expect(Aliased.JABS_Engine).toBeInstanceOf(Map);
      expect(Aliased.RPG_Base).toBeInstanceOf(Map);
      expect(Aliased.RPG_Enemy).toBeInstanceOf(Map);
      expect(Aliased.Window_AptitudeSourceDetails).toBeInstanceOf(Map);
      expect(Aliased.Window_AptitudeAggregateDetails).toBeInstanceOf(Map);
    });

    it('publishes the typed-reward regular expression', () =>
    {
      // Arrange & Act- the note reader and this pattern have to stay in lockstep.
      const { ApTypedReward } = globalThis.J.APT.EXT.TYPED.RegExp;

      // Assert
      expect(ApTypedReward).toBeInstanceOf(RegExp);
      expect('<apTyped:[6, element, fire]>').toMatch(ApTypedReward);
    });
  });

  describe('parsed plugin parameters', () =>
  {
    it('reads the implicit enemy element percentage', () =>
    {
      // Arrange & Act & Assert- this scales how much typed AP a kill grants for inferred types.
      expect(globalThis.J.APT.EXT.TYPED.Metadata.ImplicitEnemyElementPercent).toBe(25);
    });

    it('converts the authored resistance percentage into an element-rate factor', () =>
    {
      // Arrange & Act & Assert- element rates are decimal factors, so 75% has to arrive as 0.75 or
      // every element would read as resisted.
      expect(globalThis.J.APT.EXT.TYPED.Metadata.ResistThreshold).toBe(0.75);
    });

    it('converts the authored weakness percentage into an element-rate factor', () =>
    {
      // Arrange & Act & Assert
      expect(globalThis.J.APT.EXT.TYPED.Metadata.SlayerWeaknessThreshold).toBe(1.25);
    });

    it('reads the excluded alignment elements list with its JSON quoting stripped', () =>
    {
      // Arrange & Act- RMMZ hands string-list parameters over as a JSON string; the quotes have to
      // come off or neither the name nor the id form can ever match downstream.
      const { ExcludedAlignmentElements } = globalThis.J.APT.EXT.TYPED.Metadata;

      // Assert- a numeric entry also lands as a real number rather than a quoted token.
      expect(ExcludedAlignmentElements).toEqual([ 'physical', 7 ]);
    });

    it('keeps auto-state inference switched off', () =>
    {
      // Arrange & Act & Assert- reserved for future use and hard-coded off for now.
      expect(globalThis.J.APT.EXT.TYPED.Metadata.IncludeAutoStatesInInference).toBe(false);
    });
  });

  describe('mod-ap-all command', () =>
  {
    it('grants the typed AP to every party member', () =>
    {
      // Arrange- arguments arrive from the editor as strings.
      const handler = registeredCommands.get('mod-ap-all');

      // Act
      handler({ points: '15', domain: 'Element', id: '4' });

      // Assert
      expect(globalThis.ApManager.gainTypedAp).toHaveBeenCalledTimes(2);
      partyMembers.forEach(member =>
      {
        expect(globalThis.ApManager.gainTypedAp)
          .toHaveBeenCalledWith(member, 15, 'element', 4, 'plugin-command');
      });
    });

    it('lowercases the authored domain before granting', () =>
    {
      // Arrange- domains are matched case-insensitively downstream, so normalising here keeps the
      // editor's casing from silently missing.
      const handler = registeredCommands.get('mod-ap-all');

      // Act
      handler({ points: '5', domain: 'WEAPONTYPE', id: '7' });

      // Assert
      expect(globalThis.ApManager.gainTypedAp)
        .toHaveBeenCalledWith(expect.anything(), 5, 'weapontype', 7, 'plugin-command');
    });
  });

  describe('mod-ap command', () =>
  {
    it('grants the typed AP to the chosen actor only', () =>
    {
      // Arrange
      const handler = registeredCommands.get('mod-ap');

      // Act
      handler({ actorId: '3', points: '15', domain: 'Element', id: '4' });

      // Assert
      expect(globalThis.ApManager.gainTypedAp).toHaveBeenCalledTimes(1);
      expect(globalThis.ApManager.gainTypedAp)
        .toHaveBeenCalledWith({ name: 'actor-3' }, 15, 'element', 4, 'plugin-command');
    });
  });
});
//endregion plugins/apt/ext/typed/_component/metadata-and-commands.test.js
