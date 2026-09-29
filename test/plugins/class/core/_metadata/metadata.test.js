//region plugins/class/core/_metadata/metadata.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { installClassCoreRealm } from '../_component/fixtures/install-class-core-realm.js';

/**
 * J-Classes' bootstrap: the parameters it reads, and the hosts it refuses to boot without.
 */
describe('J-Classes metadata', () =>
{
  beforeAll(async () =>
  {
    // booted with nothing configured, which is what every default below is read from.
    await installClassCoreRealm();
  });

  describe('defaults', () =>
  {
    it('always shows the menu command when no switch is configured', () =>
    {
      // Arrange & Act & Assert
      expect(globalThis.J.CLASS.Metadata.menuSwitchId)
        .toBe(0);
    });

    it('only views from the menu when no change switch is configured', () =>
    {
      // Arrange & Act & Assert
      expect(globalThis.J.CLASS.Metadata.menuChangeSwitchId)
        .toBe(0);
    });

    it('names the menu command "Classes" when no name is configured', () =>
    {
      // Arrange & Act & Assert
      expect(globalThis.J.CLASS.Metadata.commandName)
        .toBe('Classes');
    });

    it('draws no icons when none are configured', () =>
    {
      // Arrange & Act & Assert
      expect(globalThis.J.CLASS.Metadata.commandIconIndex)
        .toBe(0);
      expect(globalThis.J.CLASS.Metadata.classIconIndex)
        .toBe(0);
    });
  });

  describe('configured parameters', () =>
  {
    /** @type {J_ClassPluginMetadata} */
    let configured;

    beforeAll(async () =>
    {
      // a second metadata under its own name reads a second parameter set without rebooting the realm.
      globalThis.$plugins.push({
        name: 'J-Classes-configured',
        status: true,
        parameters: {
          'menu-switch': '113',
          'menu-change-switch': '9',
          'command-name': 'Class',
          'command-icon': '186',
          'class-icon': '2694',
        },
      });

      const { default: J_ClassPluginMetadata } = await import(
        '../../../../../src/plugins/class/core/_metadata/_pluginMetadata.js');
      configured = new J_ClassPluginMetadata('J-Classes-configured', '1.0.0');
    });

    it('reads the switch that shows the menu command', () =>
    {
      // Arrange & Act & Assert
      expect(configured.menuSwitchId)
        .toBe(113);
    });

    it('reads the switch that lets the menu change classes', () =>
    {
      // Arrange & Act & Assert
      expect(configured.menuChangeSwitchId)
        .toBe(9);
    });

    it('reads the menu command\'s name', () =>
    {
      // Arrange & Act & Assert
      expect(configured.commandName)
        .toBe('Class');
    });

    it('reads the menu command\'s icon and the icon every class is drawn with', () =>
    {
      // Arrange & Act & Assert- two different icons, so one read for both cannot pass.
      expect(configured.commandIconIndex)
        .toBe(186);
      expect(configured.classIconIndex)
        .toBe(2694);
    });
  });

  describe('host version requirements', () =>
  {
    it('throws when J-Base does not satisfy the minimum required version', async () =>
    {
      // Arrange- drop the loaded J-Base below this plugin's floor.
      vi.resetModules();
      const originalVersion = globalThis.J.BASE.Metadata.Version;
      globalThis.J.BASE.Metadata.Version = '0.0.1';

      // Act & Assert
      await expect(import('../../../../../src/plugins/class/core/_metadata/initialization.js'))
        .rejects.toThrow(/missing J-Base/);

      // restore the satisfying version so later tests in this file are unaffected.
      globalThis.J.BASE.Metadata.Version = originalVersion;
    });

    it('throws when J-CMS does not satisfy the minimum required version', async () =>
    {
      // Arrange- J-Base keeps passing, so the J-CMS check is the one that trips.
      vi.resetModules();
      const originalVersion = globalThis.J.CMS.Metadata.version.version;
      globalThis.J.CMS.Metadata.version.version = () => '0.0.1';

      // Act & Assert
      await expect(import('../../../../../src/plugins/class/core/_metadata/initialization.js'))
        .rejects.toThrow(/missing J-CMS/);

      // restore the real accessor rather than relying on restoreAllMocks.
      globalThis.J.CMS.Metadata.version.version = originalVersion;
    });
  });
});
//endregion plugins/class/core/_metadata/metadata.test.js