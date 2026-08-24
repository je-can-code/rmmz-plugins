//region plugins/diff/ext/affix/_metadata/initialization.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import {
  installDiffAffixHostGlobals,
  installDifficultyMetadata,
} from '../fixtures/install-diff-affix-host-globals.js';
import { installPluginManagerWithParams } from '../../../../../setup/install-plugin-manager-with-params.js';

/**
 * Bootstrap is one file for a reason: a reader should be able to learn the whole shape of a ship by
 * opening it. What is worth asserting is therefore structural - that the namespace this extension
 * hangs itself off gets declared rather than assumed, and that every seam it aliases has somewhere
 * to store the original.
 */
describe('J-Difficulty-Affix initialization (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installDiffAffixHostGlobals();

    // J-Difficulty is loaded first in the real world; the metadata construction below reads it.
    installDifficultyMetadata(new Map([ [ 'default', { key: 'default' } ] ]), new Map(), 'default');

    globalThis.__PLUGIN_NAME__ = 'J-Difficulty-Affix';
    globalThis.__PLUGIN_VERSION__ = '1.0.0';
    installPluginManagerWithParams(globalThis, 'J-Difficulty-Affix', {});

    await import('../../../../../../src/plugins/diff/ext/affix/__models/DifficultyMetadata.js');
    await import('../../../../../../src/plugins/diff/ext/affix/_metadata/initialization.js');
  });

  it('declares the extension shell J-Difficulty itself never creates', () =>
  {
    // Arrange & Act & Assert- this is the first extension of J-Difficulty, so the EXT namespace
    // does not exist until this ship makes it.
    expect(globalThis.J.DIFFICULTY.EXT).toBeDefined();
    expect(globalThis.J.DIFFICULTY.EXT.AFFIX).toBeDefined();
  });

  it('registers the metadata under this plugin\'s own identity', () =>
  {
    // Arrange & Act
    const { Metadata } = globalThis.J.DIFFICULTY.EXT.AFFIX;

    // Assert- the name is what verify:declared-dependencies matches against the built file, and
    // what PluginManager.registerCommand would key on.
    expect(Metadata.name).toBe('J-Difficulty-Affix');

    // and it is this ship's own metadata rather than a bare PluginMetadata, so its calculations
    // are actually present on it.
    expect(Metadata.buildEffectivePools).toBeInstanceOf(Function);
  });

  it('provides an alias map for every type this ship augments', () =>
  {
    // Arrange & Act
    const { Aliased } = globalThis.J.DIFFICULTY.EXT.AFFIX;

    // Assert- a missing map is not a quiet degradation; the augment file throws on the first
    // `.set` it attempts, at boot.
    expect(Aliased.Game_Event).toBeInstanceOf(Map);
    expect(Aliased.Game_Temp).toBeInstanceOf(Map);
    expect(Aliased.JPassiveAffix_PluginMetadata).toBeInstanceOf(Map);
    expect(Aliased.Scene_Boot).toBeInstanceOf(Map);
  });
});
//endregion plugins/diff/ext/affix/_metadata/initialization.test.js