//region plugins/_base/ext/save/save-config-manager.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('ConfigManager installation-scope fields (direct src import)', () =>
{
  /**
   * The engine global this module augments, in the shape the engine leaves it in.
   *
   * Only the two aliased methods matter here. Vanilla's `makeData` returns the seven built-in settings
   * and vanilla's `applyData` reads them back; reproducing one of each is what lets the assertions
   * below prove the plugin's fields are *added to* the engine's rather than replacing them.
   */
  const installEngineConfigManager = () =>
  {
    globalThis.ConfigManager = {
      alwaysDash: false,

      /**
       * Vanilla's own data, standing in for all seven built-in settings.
       * @returns {object} The engine's config data.
       */
      makeData()
      {
        return { alwaysDash: this.alwaysDash };
      },

      /**
       * Vanilla's own read-back of that data.
       * @param {object} config The config data read from disk.
       */
      applyData(config)
      {
        this.alwaysDash = config.alwaysDash;
      },
    };
  };

  beforeAll(() =>
  {
    installEngineConfigManager();

    globalThis.J = {
      BASE: {
        EXT: {
          SAVE: {
            Aliased: { ConfigManager: new Map() },
          },
        },
      },
    };
  });

  beforeEach(async () =>
  {
    // the module augments whatever object is standing there at import, and both the alias map and the
    // registered-field map are static- so each test starts from a freshly installed engine global and
    // a fresh module graph rather than inheriting the previous test's registrations.
    installEngineConfigManager();
    globalThis.J.BASE.EXT.SAVE.Aliased.ConfigManager = new Map();

    vi.resetModules();

    await import('../../../../../src/plugins/_base/ext/save/managers/ConfigManager.js');
  });

  describe('registerField()', () =>
  {
    it('seeds the field immediately, so it reads correctly before the document is read', () =>
    {
      // Arrange
      // Act
      ConfigManager.registerField('gamepadRumble', () => true);

      // Assert
      expect(ConfigManager.gamepadRumble).toBe(true);
    });

    it('calls the factory per registration, so no two fields share one mutable default', () =>
    {
      // Arrange
      const factory = () => ({});

      // Act
      ConfigManager.registerField('keyboardMappings', factory);
      ConfigManager.registerField('gamepadMappings', factory);

      // Assert
      expect(ConfigManager.keyboardMappings).not.toBe(ConfigManager.gamepadMappings);
    });
  });

  describe('makeData()', () =>
  {
    it('writes every registered field alongside the engine settings rather than instead of them', () =>
    {
      // Arrange
      ConfigManager.alwaysDash = true;
      ConfigManager.registerField('gamepadRumble', () => true);
      ConfigManager.gamepadRumble = false;

      // Act
      const config = ConfigManager.makeData();

      // Assert
      expect(config.alwaysDash).toBe(true);
      expect(config.gamepadRumble).toBe(false);
    });
  });

  describe('applyData()', () =>
  {
    it('reads a registered field back out of the document', () =>
    {
      // Arrange
      ConfigManager.registerField('gamepadRumble', () => true);

      // Act
      ConfigManager.applyData({ alwaysDash: false, gamepadRumble: false });

      // Assert
      expect(ConfigManager.gamepadRumble).toBe(false);
    });

    it('re-seeds a field the document does not carry rather than leaving the last session value', () =>
    {
      // Arrange
      ConfigManager.registerField('gamepadRumble', () => true);
      ConfigManager.gamepadRumble = false;

      // Act
      ConfigManager.applyData({ alwaysDash: false });

      // Assert
      expect(ConfigManager.gamepadRumble).toBe(true);
    });

    it('still applies the engine settings it aliased', () =>
    {
      // Arrange
      ConfigManager.registerField('gamepadRumble', () => true);

      // Act
      ConfigManager.applyData({ alwaysDash: true, gamepadRumble: true });

      // Assert
      expect(ConfigManager.alwaysDash).toBe(true);
    });
  });
});
//endregion plugins/_base/ext/save/save-config-manager.test.js