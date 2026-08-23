//region plugins/omni/ext/monster/_metadata/metadata.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import {
  installOmniHostGlobals,
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

    it('captures a region name', () =>
    {
      // Arrange & Act
      const match = '<region:Frozen Wastes>'.match(globalThis.J.OMNI.EXT.MONSTER.RegExp.MonsterpediaRegion);

      // Assert
      expect(match[1]).toBe('Frozen Wastes');
    });

    it('refuses a description line containing a character outside the allowed prose set', () =>
    {
      // Arrange & Act
      const match = '<descriptionLine:100% deadly>'
        .match(globalThis.J.OMNI.EXT.MONSTER.RegExp.MonsterpediaDescription);

      // Assert
      expect(match).toBeNull();
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
