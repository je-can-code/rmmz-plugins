//region plugins/lighting/_component/plugin-metadata.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  defaultLightingConfig,
  installLightingComponentGlobals,
  setLightingConfig,
  setPluginContextToJBase,
  setPluginContextToJLighting,
} from './fixtures/install-lighting-component-globals.js';

describe('J-Lighting plugin metadata (direct src import)', () =>
{
  /**
   * The J umbrella as J-Base built it, since its bootstrap can only run once per realm.
   * @type {Object}
   */
  let realJ;

  beforeAll(async () =>
  {
    installLightingComponentGlobals();
    setLightingConfig(defaultLightingConfig());

    setPluginContextToJBase();
    await import('../../../../src/plugins/_base/core/_metadata/initialization.js');

    realJ = globalThis.J;
  });

  beforeEach(() =>
  {
    // drop only the lighting half of the module graph; J-Base's evaluated modules stay put.
    vi.resetModules();

    globalThis.J = realJ;
    delete globalThis.J.LIGHTING;

    setPluginContextToJLighting();
    setLightingConfig(defaultLightingConfig());
  });

  /**
   * Builds this ship's metadata against whatever config the test has arranged.
   *
   * A fresh copy of `PluginMetadata` goes in first: it refuses a duplicate plugin name on a private
   * static registry, so without one the second construction in this file throws.
   * @returns {Object} The constructed metadata.
   */
  const buildMetadata = async () =>
  {
    const { default: FreshPluginMetadata } =
      await import('../../../../src/plugins/_base/core/models/PluginMetadata.js');
    globalThis.PluginMetadata = FreshPluginMetadata;

    const { default: J_LIGHTING_PluginMetadata } =
      await import('../../../../src/plugins/lighting/core/_metadata/_pluginMetadata.js');

    return new J_LIGHTING_PluginMetadata('J-Lighting', '1.0.0');
  };

  describe('the defaults it loads', () =>
  {
    it('reads what a light with nothing spelled out falls back to', async () =>
    {
      // Arrange
      const metadata = await buildMetadata();

      // Act
      const result = metadata.lightDefaults;

      // Assert
      expect(result.radius).toBe(5);
      expect(result.color).toBe('#FFFFFF');
      expect(result.intensity).toBe(0);
    });

    it('reads what the dark itself falls back to', async () =>
    {
      // Arrange
      const metadata = await buildMetadata();

      // Act
      const result = metadata.ambientDefaults;

      // Assert
      expect(result.color).toBe('#000000');
    });
  });

  describe('tuningFor', () =>
  {
    it('hands back the numbers configured for the effect it was asked about', async () =>
    {
      // Arrange
      const metadata = await buildMetadata();

      // Act
      const result = metadata.tuningFor('pulse');

      // Assert
      // the config holds three effects, so pinning pulse's own numbers is what separates "looked the
      // effect up" from "handed back whatever was first".
      expect(result.depth).toBe(0.45);
      expect(result.period).toBe(165);
      expect(result.variance).toBe(0.22);
    });

    it('hands back a different set for a different effect', async () =>
    {
      // Arrange
      const metadata = await buildMetadata();

      // Act
      const result = metadata.tuningFor('glitch');

      // Assert
      expect(result.depth).toBe(0.85);
      expect(result.period).toBe(55);
      expect(result.chance).toBe(0.28);
    });

    it('hands back a tuning that does nothing for a light that does not animate', async () =>
    {
      // Arrange
      const metadata = await buildMetadata();

      // Act
      const result = metadata.tuningFor('steady');

      // Assert
      // `steady` is deliberately absent from the config, because there is nothing about it to tune -
      // so the answer has to come from somewhere, and a depth of zero is a light that never moves.
      expect(result.depth).toBe(0);
      expect(result.chance).toBe(0);
    });

    it('hands back the same do-nothing tuning for an effect nobody has configured', async () =>
    {
      // Arrange
      const metadata = await buildMetadata();

      // Act
      const result = metadata.tuningFor('wobble');

      // Assert
      // the parser refuses an unknown effect long before this is reached, so this is the answer to a
      // question that should never be asked rather than a supported way to invent a behaviour.
      expect(result.depth).toBe(0);
      expect(result.period).toBe(1);
    });
  });
});
//endregion plugins/lighting/_component/plugin-metadata.test.js