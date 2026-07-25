//region plugins/pixel/core/_component/metadata.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { DEFAULT_PIXEL_CORE_PLUGIN_PARAMS } from '../../_component/fixtures/pixel-plugin-params.js';
import {
  installPixelCoreHostGlobals,
  setPluginContextToJBase,
  setPluginContextToJPixel,
} from '../../_component/fixtures/install-pixel-host-globals.js';
import { installPluginManagerWithParams } from '../../../../setup/install-plugin-manager-with-params.js';

describe('J-Pixelistics (core) metadata (direct src import)', () =>
{
  let JPixelistics_PluginMetadata;

  beforeAll(async () =>
  {
    vi.resetModules();

    installPixelCoreHostGlobals();

    setPluginContextToJBase();
    await import('../../../../../src/plugins/_base/_metadata/initialization.js');

    setPluginContextToJPixel();

    // the class itself, not the initialization.js side-effect file- lets each scenario below build
    // a fresh J_PixelisticsPluginMetadata instance from different plugin params without needing to
    // re-run _base's initialization.js (which defines non-configurable properties like Array.empty
    // that throw if defined a second time against the same globalThis).
    ({ default: JPixelistics_PluginMetadata } = await import('../../../../../src/plugins/pixel/core/_metadata/_pluginMetadata.js'));
  });

  let scenarioCounter = 0;

  /**
   * Builds a fresh J.PIXEL.Metadata instance from the given plugin parameters. Each call uses a
   * distinct plugin name- PluginMetadata keeps an append-only static registry keyed by name and
   * throws on a repeat registration, so re-using "J-Pixelistics" across scenarios in one file
   * would collide with the first scenario's registration.
   * @param {Record<string, string>} coreParams
   * @returns {object}
   */
  function buildMetadata(coreParams)
  {
    scenarioCounter += 1;
    const name = `J-Pixelistics-test-${scenarioCounter}`;
    installPluginManagerWithParams(globalThis, name, coreParams);
    return new JPixelistics_PluginMetadata(name, '1.0.1');
  }

  it('parses plugin params into J.PIXEL.Metadata', () =>
  {
    // Arrange & Act
    const metadata = buildMetadata(DEFAULT_PIXEL_CORE_PLUGIN_PARAMS);

    // Assert
    expect(metadata.CollisionStepCount).toBe(4);
    expect(metadata.CollisionRadius).toBe(0.30);
    expect(metadata.VectorMovementEnabled).toBe(false);
    expect(metadata.OverlayInitiallyVisible).toBe(false);
  });

  it('reflects overridden numerics and flags', () =>
  {
    // Arrange & Act
    const metadata = buildMetadata({
      ...DEFAULT_PIXEL_CORE_PLUGIN_PARAMS,
      collisionStepCount: '2',
      collisionRadius: '0.15',
      vectorMovementEnabled: 'true',
      overlayInitiallyVisible: 'true',
    });

    // Assert
    expect(metadata.CollisionStepCount).toBe(2);
    expect(metadata.CollisionRadius).toBe(0.15);
    expect(metadata.VectorMovementEnabled).toBe(true);
    expect(metadata.OverlayInitiallyVisible).toBe(true);
  });

  it('defaults CollisionStepCount when parseInt yields NaN', () =>
  {
    // Arrange & Act
    const metadata = buildMetadata({
      ...DEFAULT_PIXEL_CORE_PLUGIN_PARAMS,
      collisionStepCount: 'not-a-number',
    });

    // Assert
    expect(metadata.CollisionStepCount).toBe(4);
  });
});
//endregion plugins/pixel/core/_component/metadata.test.js
