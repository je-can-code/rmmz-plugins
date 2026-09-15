//region plugins/lighting/_component/initialization-version-gate.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  defaultLightingConfig,
  defaultLightingTimeConfig,
  installLightingComponentGlobals,
  setLightingConfig,
  setPluginContextToJBase,
  setPluginContextToJLighting,
  setPluginContextToJLightingTime,
} from './fixtures/install-lighting-component-globals.js';

/**
 * The J umbrella as J-Base built it, captured once and handed back before every test.
 *
 * J-Base's bootstrap can only run once per realm: it finishes with
 * `Object.defineProperty(Array, 'empty', { configurable: false })`, and evaluating it a second time
 * dies on "Cannot redefine property". So it is built a single time, and any test that lowers the
 * recorded version has to undo that here rather than by re-importing.
 * @type {Object}
 */
let realJ;

describe('J-Lighting initialization version gates (direct src import)', () =>
{
  beforeAll(async () =>
  {
    installLightingComponentGlobals();
    setLightingConfig(defaultLightingConfig());

    setPluginContextToJBase();
    await import('../../../../src/plugins/_base/core/_metadata/initialization.js');

    realJ = globalThis.J;
  });

  beforeEach(async () =>
  {
    // drop only the lighting half of the module graph; J-Base's evaluated modules stay put.
    vi.resetModules();

    // undo whatever the previous case did to the shared umbrella.
    globalThis.J = realJ;
    globalThis.J.BASE.Metadata.Version = '3.5.0';
    delete globalThis.J.LIGHTING;
    globalThis.J.TIME = { Metadata: { UseRealTime: false, version: { version: () => '1.0.0' } } };

    // PluginMetadata refuses a duplicate plugin name on a private static registry, so a fresh copy
    // of the class is what lets this ship's metadata be constructed more than once in one file.
    const { default: FreshPluginMetadata } =
      await import('../../../../src/plugins/_base/core/models/PluginMetadata.js');
    globalThis.PluginMetadata = FreshPluginMetadata;

    setPluginContextToJLighting();
    setLightingConfig(defaultLightingConfig());
  });

  describe('J-Lighting', () =>
  {
    it('loads when J-Base is exactly the required version', async () =>
    {
      // Arrange
      globalThis.J.BASE.Metadata.Version = '3.5.0';

      // Act
      await import('../../../../src/plugins/lighting/core/_metadata/initialization.js');

      // Assert
      expect(globalThis.J.LIGHTING.Metadata.name).toBe('J-Lighting');
    });

    it('loads when J-Base is newer than required', async () =>
    {
      // Arrange
      globalThis.J.BASE.Metadata.Version = '9.9.9';

      // Act
      await import('../../../../src/plugins/lighting/core/_metadata/initialization.js');

      // Assert
      expect(globalThis.J.LIGHTING.Metadata.name).toBe('J-Lighting');
    });

    it('refuses to load against a J-Base older than it needs', async () =>
    {
      // Arrange
      globalThis.J.BASE.Metadata.Version = '3.4.9';

      // Act
      const attempt = import('../../../../src/plugins/lighting/core/_metadata/initialization.js');

      // Assert
      await expect(attempt).rejects.toThrow(/J-Base/);
    });
  });

  describe('J-Lighting-Time', () =>
  {
    /**
     * Brings J-Lighting up, which the extension insists on before it will load at all.
     */
    const loadLighting = async () =>
    {
      setPluginContextToJLighting();
      setLightingConfig(defaultLightingConfig());
      await import('../../../../src/plugins/lighting/core/_metadata/initialization.js');

      setPluginContextToJLightingTime();
      setLightingConfig(defaultLightingTimeConfig());
    };

    it('loads when everything it depends on is present and current', async () =>
    {
      // Arrange
      await loadLighting();

      // Act
      await import('../../../../src/plugins/lighting/ext/time/_metadata/initialization.js');

      // Assert
      expect(globalThis.J.LIGHTING.EXT.TIME.Metadata.name).toBe('J-Lighting-Time');
    });

    it('refuses to load against a J-Base older than it needs', async () =>
    {
      // Arrange
      await loadLighting();
      globalThis.J.BASE.Metadata.Version = '3.4.9';

      // Act
      const attempt = import('../../../../src/plugins/lighting/ext/time/_metadata/initialization.js');

      // Assert
      await expect(attempt).rejects.toThrow(/J-Base/);
    });

    it('refuses to load against a J-Lighting older than it needs', async () =>
    {
      // Arrange
      await loadLighting();
      globalThis.J.LIGHTING.Metadata.version = { version: () => '0.9.0' };

      // Act
      const attempt = import('../../../../src/plugins/lighting/ext/time/_metadata/initialization.js');

      // Assert
      await expect(attempt).rejects.toThrow(/J-Lighting/);
    });

    it('refuses to load against a J-TIME older than it needs', async () =>
    {
      // Arrange
      await loadLighting();
      globalThis.J.TIME.Metadata.version = { version: () => '0.9.0' };

      // Act
      const attempt = import('../../../../src/plugins/lighting/ext/time/_metadata/initialization.js');

      // Assert
      await expect(attempt).rejects.toThrow(/J-TIME/);
    });
  });
});
//endregion plugins/lighting/_component/initialization-version-gate.test.js