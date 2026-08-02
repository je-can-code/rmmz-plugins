//region plugins/omni/ext/quest/_metadata/metadata.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import {
  installOmniHostGlobals,
  installQuestConfig,
  setPluginContextToJBase,
  setPluginContextToJOmnipedia,
  setPluginContextToJOmniQuest,
} from '../../../_component/fixtures/install-omni-host-globals.js';
import { installPluginManagerWithParams } from '../../../../../setup/install-plugin-manager-with-params.js';

describe('J-Omni-Questopedia metadata (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installOmniHostGlobals();
    installQuestConfig();

    // the menu switch is the one plugin parameter this metadata actually reads, so it is supplied
    // with a recognizable value rather than left to fall through to its default.
    installPluginManagerWithParams(globalThis, 'J-Omni-Questopedia', { 'menu-switch': '42' });

    setPluginContextToJBase();
    await import('../../../../../../src/plugins/_base/_metadata/initialization.js');

    setPluginContextToJOmnipedia();
    await import('../../../../../../src/plugins/omni/core/_metadata/initialization.js');

    setPluginContextToJOmniQuest();
    await import('../../../../../../src/plugins/omni/ext/quest/_metadata/initialization.js');
  });

  describe('quest classification', () =>
  {
    it('keeps a quest whose name is not an editor-only separator', () =>
    {
      // Arrange & Act
      const { quests } = globalThis.J.OMNI.EXT.QUEST.Metadata;

      // Assert
      expect(quests.map(quest => quest.key)).toContain('gather-herbs');
    });

    it('drops a quest whose name is prefixed with the editor scratch marker', () =>
    {
      // Arrange & Act
      const { quests } = globalThis.J.OMNI.EXT.QUEST.Metadata;

      // Assert
      expect(quests.map(quest => quest.key)).not.toContain('editor-scratch');
    });

    it('drops a quest whose name is prefixed with the editor heading marker', () =>
    {
      // Arrange & Act
      const { quests } = globalThis.J.OMNI.EXT.QUEST.Metadata;

      // Assert
      expect(quests.map(quest => quest.key)).not.toContain('main-separator');
    });

    it('drops a quest whose name is prefixed with the editor dash marker', () =>
    {
      // Arrange & Act
      const { quests } = globalThis.J.OMNI.EXT.QUEST.Metadata;

      // Assert
      expect(quests.map(quest => quest.key)).not.toContain('deprecated-row');
    });

    it('rebuilds each surviving row through the quest builder rather than passing the raw blob along', () =>
    {
      // Arrange & Act
      const { quests } = globalThis.J.OMNI.EXT.QUEST.Metadata;
      const [ herbs ] = quests;

      // Assert: the builder is what populates these, so a pass-through blob would lose them.
      expect(herbs.name).toBe('Gather the Herbs');
      expect(herbs.categoryKey).toBe('side');
      expect(herbs.tagKeys).toEqual([ 'foraging' ]);
      expect(herbs.recommendedLevel).toBe(3);
    });
  });

  describe('lookup maps', () =>
  {
    it('maps every surviving quest by its key', () =>
    {
      // Arrange & Act
      const { questsMap } = globalThis.J.OMNI.EXT.QUEST.Metadata;

      // Assert
      expect(questsMap.get('gather-herbs').name).toBe('Gather the Herbs');
    });

    it('excludes the discarded editor rows from the quest map as well as the list', () =>
    {
      // Arrange & Act
      const { questsMap } = globalThis.J.OMNI.EXT.QUEST.Metadata;

      // Assert
      expect(questsMap.has('main-separator')).toBe(false);
    });

    it('maps every category by its key', () =>
    {
      // Arrange & Act
      const { categoriesMap } = globalThis.J.OMNI.EXT.QUEST.Metadata;

      // Assert
      expect(categoriesMap.get('main').name).toBe('Main');
      expect(categoriesMap.size).toBe(2);
    });

    it('maps every tag by its key', () =>
    {
      // Arrange & Act
      const { tagsMap } = globalThis.J.OMNI.EXT.QUEST.Metadata;

      // Assert
      expect(tagsMap.get('foraging').name).toBe('Foraging');
      expect(tagsMap.size).toBe(1);
    });
  });

  describe('plugin parameter translation', () =>
  {
    it('reads the menu switch id out of the plugin parameters', () =>
    {
      // Arrange & Act & Assert
      expect(globalThis.J.OMNI.EXT.QUEST.Metadata.menuSwitchId).toBe(42);
    });

    it('describes the command it contributes to the omnipedia list', () =>
    {
      // Arrange & Act
      const { Command } = globalThis.J.OMNI.EXT.QUEST.Metadata;

      // Assert
      expect(Command).toMatchObject({
        Name: 'Questopedia',
        Symbol: 'quest-pedia',
        IconIndex: 2564,
      });
    });
  });

  describe('event notetag patterns', () =>
  {
    it('captures a bare quest key from a page condition tag', () =>
    {
      // Arrange
      const { EventQuest } = globalThis.J.OMNI.EXT.QUEST.RegExp;

      // Act
      const [ , captured ] = '<pageQuestCondition:[gather-herbs]>'.match(EventQuest);

      // Assert
      expect(captured).toBe('[gather-herbs]');
    });

    it('captures the key, a negative objective id, and the state from a stateful page condition', () =>
    {
      // Arrange
      const { EventQuestObjectiveForState } = globalThis.J.OMNI.EXT.QUEST.RegExp;

      // Act
      const match = '<pageQuestCondition:[gather-herbs,-1,completed]>'.match(EventQuestObjectiveForState);

      // Assert: the negative id is the "any objective" sentinel, so the sign has to survive.
      expect(match[2]).toBe('gather-herbs');
      expect(match[3]).toBe('-1');
      expect(match[4]).toBe('completed');
    });

    it('refuses a stateful page condition naming a state outside the known set', () =>
    {
      // Arrange
      const { EventQuestObjectiveForState } = globalThis.J.OMNI.EXT.QUEST.RegExp;

      // Act
      const match = '<pageQuestCondition:[gather-herbs,1,abandoned]>'.match(EventQuestObjectiveForState);

      // Assert
      expect(match).toBeNull();
    });

    it('captures a bare quest key from a choice condition tag', () =>
    {
      // Arrange
      const { ChoiceQuest } = globalThis.J.OMNI.EXT.QUEST.RegExp;

      // Act
      const [ , captured ] = '<choiceQuestCondition:[gather-herbs]>'.match(ChoiceQuest);

      // Assert
      expect(captured).toBe('[gather-herbs]');
    });
  });

  describe('host version requirements', () =>
  {
    it('throws when J-Base does not satisfy the minimum required version', async () =>
    {
      // Arrange: drop the already-installed J-Base metadata below questopedia's floor.
      vi.resetModules();
      const originalVersion = globalThis.J.BASE.Metadata.Version;
      globalThis.J.BASE.Metadata.Version = '0.0.1';
      setPluginContextToJOmniQuest();

      // Act & Assert
      await expect(import('../../../../../../src/plugins/omni/ext/quest/_metadata/initialization.js'))
        .rejects.toThrow(/missing J-Base/);

      // restore the satisfying version so later tests in this file are unaffected.
      globalThis.J.BASE.Metadata.Version = originalVersion;
    });

    it('throws when J-Omnipedia does not satisfy the minimum required version', async () =>
    {
      // Arrange: J-Base has to keep passing so the omnipedia check is the one that trips.
      vi.resetModules();
      const originalVersion = globalThis.J.OMNI.Metadata.version.version;
      globalThis.J.OMNI.Metadata.version.version = () => '0.0.1';
      setPluginContextToJOmniQuest();

      // Act & Assert
      await expect(import('../../../../../../src/plugins/omni/ext/quest/_metadata/initialization.js'))
        .rejects.toThrow(/missing J-Omnipedia/);

      // restore the real accessor rather than relying on restoreAllMocks.
      globalThis.J.OMNI.Metadata.version.version = originalVersion;
    });
  });

  describe('configuration load reporting', () =>
  {
    // PluginMetadata keeps a static name:metadata registry and throws on a duplicate name, so a
    // second instance in this same file has to introduce itself under a name of its own. Only the
    // parameter lookup and the registry key care about the name, and neither is what these two
    // tests are measuring.
    const secondaryName = 'J-Omni-Questopedia-Secondary';

    it('still classifies quests when J-Base is too old to report the load summary', async () =>
    {
      // Arrange: drop J-Base beneath the floor the summary logging requires.
      const { default: QuestPluginMetadata } =
        await import('../../../../../../src/plugins/omni/ext/quest/_metadata/_pluginMetadata.js');
      const originalVersion = globalThis.J.BASE.Metadata.Version;
      globalThis.J.BASE.Metadata.Version = '2.0.0';

      // Act
      const metadata = new QuestPluginMetadata(secondaryName, '1.1.0');

      // Assert: reporting is decorative, so the quest data has to survive losing it.
      expect(metadata.quests.map(quest => quest.key)).toEqual([ 'gather-herbs' ]);

      globalThis.J.BASE.Metadata.Version = originalVersion;
    });

    it('reports the rows read off disk when external file load info is enabled', async () =>
    {
      // Arrange
      const { default: QuestPluginMetadata } =
        await import('../../../../../../src/plugins/omni/ext/quest/_metadata/_pluginMetadata.js');
      const logSpy = vi.spyOn(console, 'log')
        .mockImplementation(() => {});
      globalThis.J.BASE.Metadata.ShowExternalFileLoadInfo = true;

      // Act
      const metadata = new QuestPluginMetadata(`${secondaryName}-Logging`, '1.1.0');

      // Assert: the summary counts what the file held, before the editor rows are filtered out.
      const [ [ logged ] ] = logSpy.mock.calls;
      expect(logged).toContain('4 quests');
      expect(logged).toContain('2 categories');
      expect(logged).toContain('1 tags');
      expect(metadata.quests).toHaveLength(1);

      globalThis.J.BASE.Metadata.ShowExternalFileLoadInfo = false;
      logSpy.mockRestore();
    });
  });
});
//endregion plugins/omni/ext/quest/_metadata/metadata.test.js
