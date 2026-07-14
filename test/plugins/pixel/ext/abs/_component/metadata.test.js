//region plugins/pixel/ext/abs/_component/metadata.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { DEFAULT_PIXEL_ABS_EXT_PLUGIN_PARAMS } from '../../../_component/fixtures/pixel-plugin-params.js';
import {
  installPixelCoreHostGlobals,
  setPluginContextToJBase,
  setPluginContextToJPixel,
} from '../../../_component/fixtures/install-pixel-host-globals.js';
import { installPluginManagerWithParams } from '../../../../../setup/install-plugin-manager-with-params.js';

describe('J-ABS-Pixelistics metadata (direct src import)', () =>
{
  let JAbsPixelistics_PluginMetadata;
  let scenarioCounter = 0;

  beforeAll(async () =>
  {
    vi.resetModules();

    installPixelCoreHostGlobals();

    setPluginContextToJBase();
    await import('../../../../../../src/plugins/_base/_metadata/initialization.js');

    setPluginContextToJPixel();
    await import('../../../../../../src/plugins/pixel/core/_metadata/initialization.js');

    // the class itself, not the initialization.js side-effect file- lets each scenario below build
    // a fresh metadata instance from different plugin params without re-registering the same
    // plugin name against PluginMetadata's append-only static registry.
    ({ default: JAbsPixelistics_PluginMetadata } = await import('../../../../../../src/plugins/pixel/ext/abs/_metadata/_pluginMetadata.js'));
  });

  /**
   * Builds a fresh J.PIXEL.EXT.ABS.Metadata instance from the given extension plugin parameters.
   * @param {Record<string, string>} extParams
   * @returns {object}
   */
  function buildMetadata(extParams)
  {
    scenarioCounter += 1;
    const name = `J-ABS-Pixelistics-test-${scenarioCounter}`;
    installPluginManagerWithParams(globalThis, name, extParams);
    return new JAbsPixelistics_PluginMetadata(name, '1.0.6');
  }

  describe('default extension params', () =>
  {
    it('exposes IdleWanderRadius', () =>
    {
      // Arrange & Act
      const metadata = buildMetadata(DEFAULT_PIXEL_ABS_EXT_PLUGIN_PARAMS);

      // Assert
      expect(metadata.IdleWanderRadius).toBe(1.50);
    });

    it('exposes default enemy hitbox dimensions', () =>
    {
      // Arrange & Act
      const metadata = buildMetadata(DEFAULT_PIXEL_ABS_EXT_PLUGIN_PARAMS);

      // Assert
      expect(metadata.DefaultEnemyHitboxWidth).toBe(0.80);
      expect(metadata.DefaultEnemyHitboxHeight).toBe(0.50);
    });

    it('exposes hitbox reveal configuration', () =>
    {
      // Arrange & Act
      const metadata = buildMetadata(DEFAULT_PIXEL_ABS_EXT_PLUGIN_PARAMS);

      // Assert
      expect(metadata.EnemyHitboxOutlineAlwaysActive).toBe(false);
      expect(metadata.DefaultEnemyHitboxRevealRange).toBe(6.00);
    });
  });

  describe('custom extension params', () =>
  {
    const customParams = {
      ...DEFAULT_PIXEL_ABS_EXT_PLUGIN_PARAMS,
      idleWanderRadius: '2.75',
      defaultEnemyHitboxWidth: '1.20',
      defaultEnemyHitboxHeight: '0.65',
      outlineAlwaysActive: 'true',
      defaultHitboxRevealRange: '9.50',
    };

    it('parses IdleWanderRadius from strings', () =>
    {
      // Arrange & Act
      const metadata = buildMetadata(customParams);

      // Assert
      expect(metadata.IdleWanderRadius).toBe(2.75);
    });

    it('parses default enemy hitbox dimensions from strings', () =>
    {
      // Arrange & Act
      const metadata = buildMetadata(customParams);

      // Assert
      expect(metadata.DefaultEnemyHitboxWidth).toBe(1.20);
      expect(metadata.DefaultEnemyHitboxHeight).toBe(0.65);
    });

    it('parses hitbox reveal configuration from strings', () =>
    {
      // Arrange & Act
      const metadata = buildMetadata(customParams);

      // Assert
      expect(metadata.EnemyHitboxOutlineAlwaysActive).toBe(true);
      expect(metadata.DefaultEnemyHitboxRevealRange).toBe(9.50);
    });
  });

  describe('missing reveal params', () =>
  {
    it('falls back to the intended reveal defaults when plugin manager data is stale', () =>
    {
      // Arrange & Act
      const metadata = buildMetadata({
        idleWanderRadius: '1.50',
        defaultEnemyHitboxWidth: '0.80',
        defaultEnemyHitboxHeight: '0.50',
      });

      // Assert
      expect(metadata.EnemyHitboxOutlineAlwaysActive).toBe(false);
      expect(metadata.DefaultEnemyHitboxRevealRange).toBe(6.00);
    });
  });
});
//endregion plugins/pixel/ext/abs/_component/metadata.test.js
