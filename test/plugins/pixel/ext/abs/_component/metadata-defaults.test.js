//region plugins/pixel/ext/abs/_component/metadata-defaults.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import {
  installPixelAbsExtHostGlobals,
  installPixelCoreHostGlobals,
  setPluginContextToJBase,
  setPluginContextToJPixel,
  setPluginContextToJPixelAbsExt,
} from '../../../_component/fixtures/install-pixel-host-globals.js';

/**
 * Boots J-ABS-Pixelistics with *no* configured plugin parameters at all.
 *
 * Every numeric setting in this plugin is written as `parseFloat(param) || fallback`, so the fallback
 * side only runs when the parameter is genuinely absent. That is a real state: it is exactly what a
 * user sees the first time they drop the plugin into a project and press play without opening the
 * parameter panel. Booting with the populated fixture defaults can never reach it.
 */
describe('J-ABS-Pixelistics metadata defaults with no configured parameters (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installPixelCoreHostGlobals();

    setPluginContextToJBase();
    await import('../../../../../../src/plugins/_base/_metadata/initialization.js');

    setPluginContextToJPixel();
    await import('../../../../../../src/plugins/pixel/core/_metadata/initialization.js');

    // the empty object here is the whole point of this file.
    installPixelAbsExtHostGlobals(globalThis, {});

    setPluginContextToJPixelAbsExt();
    await import('../../../../../../src/plugins/pixel/ext/abs/_metadata/initialization.js');
  });

  it('falls back to a 3x3-tile idle wander area', () =>
  {
    // Arrange & Act
    const { IdleWanderRadius } = globalThis.J.PIXEL.EXT.ABS.Metadata;

    // Assert- a radius of 1.5 tiles in each direction spans three tiles across.
    expect(IdleWanderRadius).toBe(1.5);
  });

  it('falls back to a default enemy hitbox width', () =>
  {
    // Arrange & Act
    const { DefaultEnemyHitboxWidth } = globalThis.J.PIXEL.EXT.ABS.Metadata;

    // Assert
    expect(DefaultEnemyHitboxWidth).toBe(0.8);
  });

  it('falls back to a default enemy hitbox height', () =>
  {
    // Arrange & Act
    const { DefaultEnemyHitboxHeight } = globalThis.J.PIXEL.EXT.ABS.Metadata;

    // Assert- shorter than it is wide, matching a feet-anchored footprint rather than a sprite box.
    expect(DefaultEnemyHitboxHeight).toBe(0.5);
  });

  it('falls back to a default hitbox reveal range', () =>
  {
    // Arrange & Act
    const { DefaultEnemyHitboxRevealRange } = globalThis.J.PIXEL.EXT.ABS.Metadata;

    // Assert- this one is guarded by an explicit NaN check rather than a truthiness fallback, so that
    // a deliberately configured 0 stays 0 instead of silently becoming 6.
    expect(DefaultEnemyHitboxRevealRange).toBe(6);
  });

  it('leaves always-active hitbox outlines disabled', () =>
  {
    // Arrange & Act
    const { EnemyHitboxOutlineAlwaysActive } = globalThis.J.PIXEL.EXT.ABS.Metadata;

    // Assert- an absent parameter is not the string 'true', so the feature stays off by default.
    expect(EnemyHitboxOutlineAlwaysActive).toBe(false);
  });
});
//endregion plugins/pixel/ext/abs/_component/metadata-defaults.test.js
