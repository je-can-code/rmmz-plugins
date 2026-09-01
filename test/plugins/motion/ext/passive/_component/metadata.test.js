//region plugins/motion/ext/passive/_component/metadata.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  installMotionComponentGlobals,
  setMotionConfig,
  setPluginContextToJBase,
  setPluginContextToJMotion,
} from '../../../_component/fixtures/install-motion-component-globals.js';

/**
 * The J umbrella as J-Base built it, captured once and handed back before every test.
 *
 * J-Base's bootstrap can only run once per realm — it ends by defining a non-configurable property
 * on `Array` — so it is built a single time and any case that lowers a version or removes a plugin
 * undoes that here rather than by re-importing.
 * @type {Object}
 */
let realJ;

describe('J-Motion-Passive metadata (direct src import)', () =>
{
  beforeAll(async () =>
  {
    installMotionComponentGlobals();
    setMotionConfig({});

    setPluginContextToJBase();
    await import('../../../../../../src/plugins/_base/core/_metadata/initialization.js');

    setPluginContextToJMotion();
    await import('../../../../../../src/plugins/motion/core/_metadata/initialization.js');

    realJ = globalThis.J;
  });

  beforeEach(async () =>
  {
    // drop only this extension's half of the module graph.
    vi.resetModules();

    globalThis.J = realJ;
    globalThis.J.BASE.Metadata.Version = '3.5.0';
    globalThis.J.MOTION.EXT ??= {};
    delete globalThis.J.MOTION.EXT.PASSIVE;

    // the two peers this extension gates on but does not otherwise touch here.
    globalThis.J.MOTION.EXT.ABS = {
      Metadata: { version: { version: () => '1.0.0' } },
    };
    globalThis.J.PASSIVE = {
      Metadata: { version: { version: () => '2.3.0' } },
    };

    // PluginMetadata refuses a duplicate plugin name on a private static registry, so a fresh copy
    // is what lets this ship's metadata be constructed more than once in one file.
    const { default: FreshPluginMetadata } =
      await import('../../../../../../src/plugins/_base/core/models/PluginMetadata.js');
    globalThis.PluginMetadata = FreshPluginMetadata;

    globalThis.__PLUGIN_NAME__ = 'J-Motion-Passive';
    globalThis.__PLUGIN_VERSION__ = '1.0.0';
  });

  /**
   * Imports this extension's bootstrap.
   * @returns {Promise} The import.
   */
  const importInitialization = () =>
    import('../../../../../../src/plugins/motion/ext/passive/_metadata/initialization.js');

  describe('the namespace', () =>
  {
    it('claims its own umbrella beneath J-Motion rather than beside it', async () =>
    {
      // Act
      await importInitialization();

      // Assert
      expect(globalThis.J.MOTION.EXT.PASSIVE).toBeDefined();
      expect(globalThis.J.MOTION.EXT.PASSIVE.Metadata.name).toBe('J-Motion-Passive');
    });

    it('declares an alias map for each surface it augments', async () =>
    {
      // Act
      await importInitialization();

      // Assert
      expect(globalThis.J.MOTION.EXT.PASSIVE.Aliased.Game_Battler).toBeInstanceOf(Map);
      expect(globalThis.J.MOTION.EXT.PASSIVE.Aliased.JABS_AiManager).toBeInstanceOf(Map);
    });

    it('declares no expressions of its own', async () =>
    {
      // Act
      await importInitialization();

      // Assert
      expect(Object.keys(globalThis.J.MOTION.EXT.PASSIVE.RegExp)).toHaveLength(0);
    });
  });

  describe('the version gates', () =>
  {
    it('loads when every plugin it needs is present and current', async () =>
    {
      // Act
      await importInitialization();

      // Assert
      expect(globalThis.J.MOTION.EXT.PASSIVE).toBeDefined();
    });

    it('refuses to load against a J-Base that is too old', async () =>
    {
      // Arrange
      globalThis.J.BASE.Metadata.Version = '1.0.0';

      // Act & Assert
      await expect(importInitialization()).rejects.toThrow('Either missing J-Base');
    });

    it('refuses to load against a J-Motion that is too old', async () =>
    {
      // Arrange
      globalThis.J.MOTION.Metadata.version = { version: () => '0.1.0' };

      // Act & Assert
      await expect(importInitialization()).rejects.toThrow('Either missing J-Motion or');

      // Cleanup- the umbrella is shared, so the lowered version has to be put back.
      globalThis.J.MOTION.Metadata.version = { version: () => '1.2.0' };
    });

    it('refuses to load against a J-Motion-ABS that is too old', async () =>
    {
      // Arrange
      globalThis.J.MOTION.EXT.ABS.Metadata.version = { version: () => '0.1.0' };

      // Act & Assert
      await expect(importInitialization()).rejects.toThrow('Either missing J-Motion-ABS');
    });

    it('refuses to load against a J-Passive that is too old', async () =>
    {
      // Arrange
      globalThis.J.PASSIVE.Metadata.version = { version: () => '1.0.0' };

      // Act & Assert
      await expect(importInitialization()).rejects.toThrow('Either missing J-Passive');
    });
  });
});
//endregion plugins/motion/ext/passive/_component/metadata.test.js