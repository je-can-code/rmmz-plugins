//region plugins/motion/ext/abs/_component/metadata.test.js
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

describe('J-Motion-ABS metadata (direct src import)', () =>
{
  beforeAll(async () =>
  {
    installMotionComponentGlobals();
    setMotionConfig({
      death: {
        defaultStyle: 'moderate',
        durations: { swift: 12, moderate: 34, slow: 56 },
      },
    });

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
    delete globalThis.J.MOTION.EXT.ABS;

    // J-ABS is a peer this extension gates on but does not otherwise touch here.
    globalThis.J.ABS = {
      Metadata: { version: { version: () => '4.16.0' } },
    };

    // PluginMetadata refuses a duplicate plugin name on a private static registry, so a fresh copy
    // is what lets this ship's metadata be constructed more than once in one file.
    const { default: FreshPluginMetadata } =
      await import('../../../../../../src/plugins/_base/core/models/PluginMetadata.js');
    globalThis.PluginMetadata = FreshPluginMetadata;

    globalThis.__PLUGIN_NAME__ = 'J-Motion-ABS';
    globalThis.__PLUGIN_VERSION__ = '1.0.0';
  });

  /**
   * Imports this extension's bootstrap.
   * @returns {Promise} The import.
   */
  const importInitialization = () =>
    import('../../../../../../src/plugins/motion/ext/abs/_metadata/initialization.js');

  describe('the namespace', () =>
  {
    it('claims its own umbrella beneath J-Motion rather than beside it', async () =>
    {
      // Act
      await importInitialization();

      // Assert
      expect(globalThis.J.MOTION.EXT.ABS).toBeDefined();
      expect(globalThis.J.MOTION.EXT.ABS.Metadata.name).toBe('J-Motion-ABS');
    });

    it('declares an alias map for each engine class it augments', async () =>
    {
      // Act
      await importInitialization();

      // Assert
      expect(globalThis.J.MOTION.EXT.ABS.Aliased.Game_Battler).toBeInstanceOf(Map);
      expect(globalThis.J.MOTION.EXT.ABS.Aliased.JABS_Engine).toBeInstanceOf(Map);
    });
  });

  describe('the version gates', () =>
  {
    it('loads when every plugin it needs is present and current', async () =>
    {
      // Act
      await importInitialization();

      // Assert
      expect(globalThis.J.MOTION.EXT.ABS).toBeDefined();
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
      await expect(importInitialization()).rejects.toThrow('Either missing J-Motion');

      // Cleanup- the umbrella is shared, so the lowered version has to be put back.
      globalThis.J.MOTION.Metadata.version = { version: () => '1.2.0' };
    });

    it('refuses to load against a J-ABS that is too old', async () =>
    {
      // Arrange
      globalThis.J.ABS.Metadata.version = { version: () => '1.0.0' };

      // Act & Assert
      await expect(importInitialization()).rejects.toThrow('Either missing J-ABS');
    });
  });

  describe('the death notetags', () =>
  {
    it('captures a death style', async () =>
    {
      // Arrange
      await importInitialization();

      // Act
      const match = '<deathMotion:slow>'.match(globalThis.J.MOTION.EXT.ABS.RegExp.DeathMotion);

      // Assert
      expect(match[1]).toBe('slow');
    });

    it('tolerates the space after the colon being left in', async () =>
    {
      // Arrange
      await importInitialization();

      // Act
      const match = '<deathMotion: moderate>'.match(globalThis.J.MOTION.EXT.ABS.RegExp.DeathMotion);

      // Assert
      expect(match[1]).toBe('moderate');
    });

    it('does not mistake the opt-out for a style', async () =>
    {
      // Arrange
      await importInitialization();

      // Act
      const match = '<noDeathMotion>'.match(globalThis.J.MOTION.EXT.ABS.RegExp.DeathMotion);

      // Assert
      expect(match).toBeNull();
    });

    it('recognises the opt-out', async () =>
    {
      // Arrange
      await importInitialization();

      // Act
      const match = '<noDeathMotion>'.match(globalThis.J.MOTION.EXT.ABS.RegExp.NoDeathMotion);

      // Assert
      expect(match).not.toBeNull();
    });
  });

  describe('the death pacing', () =>
  {
    it('reads the configured durations', async () =>
    {
      // Arrange
      await importInitialization();
      const { Metadata } = globalThis.J.MOTION.EXT.ABS;

      // Assert
      expect(Metadata.deathDurationFor('swift')).toBe(12);
      expect(Metadata.deathDurationFor('moderate')).toBe(34);
      expect(Metadata.deathDurationFor('slow')).toBe(56);
    });

    it('reads the configured default style', async () =>
    {
      // Arrange
      await importInitialization();

      // Assert
      expect(globalThis.J.MOTION.EXT.ABS.Metadata.defaultDeathStyle).toBe('moderate');
    });

    it('falls back to the default pacing for a style nobody configured', async () =>
    {
      // Arrange
      await importInitialization();

      // Act
      const duration = globalThis.J.MOTION.EXT.ABS.Metadata.deathDurationFor('spectacular');

      // Assert
      expect(duration).toBe(34);
    });

    it('recognises the styles it was configured with, and only those', async () =>
    {
      // Arrange
      await importInitialization();
      const { Metadata } = globalThis.J.MOTION.EXT.ABS;

      // Assert
      expect(Metadata.isKnownDeathStyle('slow')).toBe(true);
      expect(Metadata.isKnownDeathStyle('spectacular')).toBe(false);
    });

    it('still buries the dead when the config says nothing about death at all', async () =>
    {
      // Arrange
      setMotionConfig({});

      // Act
      await importInitialization();
      const { Metadata } = globalThis.J.MOTION.EXT.ABS;

      // Assert
      expect(Metadata.defaultDeathStyle).toBe('swift');
      expect(Metadata.deathDurationFor('slow')).toBe(120);

      // Cleanup- the config is shared across cases in this file.
      setMotionConfig({
        death: {
          defaultStyle: 'moderate',
          durations: { swift: 12, moderate: 34, slow: 56 },
        },
      });
    });
  });
});
//endregion plugins/motion/ext/abs/_component/metadata.test.js