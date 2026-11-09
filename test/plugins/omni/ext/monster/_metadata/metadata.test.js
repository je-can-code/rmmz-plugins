//region plugins/omni/ext/monster/_metadata/metadata.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import {
  installOmniConfig,
  installOmniHostGlobals,
  SAMPLE_OMNI_CONFIG,
  setPluginContextToJBase,
  setPluginContextToJOmnipedia,
  setPluginContextToJOmniMonster,
} from '../../../_component/fixtures/install-omni-host-globals.js';

describe('J-OMNI-Monsters metadata (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installOmniHostGlobals();

    // the metadata reads the monsterpedia's pages from the omnipedia's configuration as it boots.
    installOmniConfig();

    setPluginContextToJBase();
    await import('../../../../../../src/plugins/_base/core/_metadata/initialization.js');

    setPluginContextToJOmnipedia();
    await import('../../../../../../src/plugins/omni/core/_metadata/initialization.js');

    setPluginContextToJOmniMonster();
    await import('../../../../../../src/plugins/omni/ext/monster/_metadata/initialization.js');
  });

  describe('omnipedia command contribution', () =>
  {
    it('describes the command it contributes to the omnipedia list', () =>
    {
      // Arrange & Act
      const { Command } = globalThis.J.OMNI.EXT.MONSTER.Metadata;

      // Assert
      expect(Command).toMatchObject({
        Name: 'Monsterpedia',
        Symbol: 'monster-pedia',
        IconIndex: 14,
      });
    });

    it('gates command visibility behind its own switch', () =>
    {
      // Arrange & Act & Assert
      expect(globalThis.J.OMNI.EXT.MONSTER.Metadata.EnabledSwitch).toBe(103);
    });
  });

  describe('enemy notetags', () =>
  {
    it('matches the hide-from-monsterpedia marker tag', () =>
    {
      // Arrange & Act & Assert
      expect(globalThis.J.OMNI.EXT.MONSTER.RegExp.HideFromMonsterpedia.test('<hideFromMonsterpedia>'))
        .toBe(true);
    });

    it('captures a family icon index', () =>
    {
      // Arrange & Act
      const match = '<monsterFamilyIcon:14>'.match(globalThis.J.OMNI.EXT.MONSTER.RegExp.MonsterpediaFamilyIcon);

      // Assert
      expect(match[1]).toBe('14');
    });

    it('captures a description line carrying sentence punctuation', () =>
    {
      // Arrange & Act
      const match = "<descriptionLine:It's fast, isn't it?>"
        .match(globalThis.J.OMNI.EXT.MONSTER.RegExp.MonsterpediaDescription);

      // Assert: descriptions are prose, so apostrophes and terminal punctuation have to survive.
      expect(match[1]).toBe("It's fast, isn't it?");
    });

    it('refuses a description line containing a character outside the allowed prose set', () =>
    {
      // Arrange & Act
      const match = '<descriptionLine:100% deadly>'
        .match(globalThis.J.OMNI.EXT.MONSTER.RegExp.MonsterpediaDescription);

      // Assert
      expect(match).toBeNull();
    });

    it('captures a monster type key, with or without the optional space', () =>
    {
      // Arrange
      const { MonsterType } = globalThis.J.OMNI.EXT.MONSTER.RegExp;

      // Act
      const tight = '<monsterType:destructible>'.match(MonsterType);
      const spaced = '<monsterType: boss-add>'.match(MonsterType);

      // Assert: a hyphenated key survives whole.
      expect(tight[1]).toBe('destructible');
      expect(spaced[1]).toBe('boss-add');
    });
  });

  describe('monsterpedia pages', () =>
  {
    it('reads its pages from the omnipedia configuration, in the order they were authored', () =>
    {
      // Arrange & Act
      const { monsterTypes } = globalThis.J.OMNI.EXT.MONSTER.Metadata;

      // Assert
      expect(monsterTypes).toEqual(SAMPLE_OMNI_CONFIG.monsterTypes);
      expect(monsterTypes.map(monsterType => monsterType.key)).toEqual([ 'enemy', 'destructible' ]);
    });
  });

  describe('host version requirements', () =>
  {
    it('throws when J-Base does not satisfy the minimum required version', async () =>
    {
      // Arrange: drop the already-installed J-Base metadata below monsterpedia's floor.
      vi.resetModules();
      const originalVersion = globalThis.J.BASE.Metadata.Version;
      globalThis.J.BASE.Metadata.Version = '0.0.1';
      setPluginContextToJOmniMonster();

      // Act & Assert
      await expect(import('../../../../../../src/plugins/omni/ext/monster/_metadata/initialization.js'))
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
      setPluginContextToJOmniMonster();

      // Act & Assert
      await expect(import('../../../../../../src/plugins/omni/ext/monster/_metadata/initialization.js'))
        .rejects.toThrow(/missing J-Omnipedia/);

      // restore the real accessor rather than relying on restoreAllMocks.
      globalThis.J.OMNI.Metadata.version.version = originalVersion;
    });
  });
});
//endregion plugins/omni/ext/monster/_metadata/metadata.test.js
