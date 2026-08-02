//region plugins/_base/_component/game-battler-notes-real-engine-direct.test.js
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import { installRealRmmzEngine } from '../../../../setup/rmmz-engine-loader.js';

/**
 * Proof of concept for test/setup/rmmz-engine-loader.js: identical assertions to
 * game-battler-notes-direct.test.js, but Game_Battler/Game_BattlerBase come from actually executing
 * the vendored project/js/rmmz_core.js + rmmz_objects.js instead of
 * fixtures/install-j-base-host-globals.js's hand-rolled placeholder classes. Everything else J-Base
 * needs that the real engine files don't define- plugin parameters, manager singletons, PIXI, the
 * $data/$game globals RPG Maker normally seeds at boot- is still stubbed here, minimally. This file
 * intentionally leaves install-j-base-host-globals.js untouched so existing suites relying on it are
 * unaffected; it exists to show what a from-scratch direct-import test looks like against the real
 * engine loader.
 */
describe('J-Base Game_Battler getNotesSources / getAllNotes (real engine direct import)', () =>
{
  beforeAll(async () =>
  {
    // fresh module registry per describe block, matching the existing direct-import convention.
    vi.resetModules();

    // the real engine, not a guess- installs the actual Game_Battler/Game_BattlerBase/etc onto globalThis.
    installRealRmmzEngine();

    // J-Base's own requirements neither the vendored engine files nor the loader's minimal PIXI shape
    // stub provide: its plugin parameters and the manager singletons its aliasing touches at parse time.
    globalThis.PluginManager = { parameters: () => ({ actorBaseTp: '0', enemyBaseTp: '100' }) };
    globalThis.ColorManager = { textColor: () => 0, itemBackColor1: () => 0, itemBackColor2: () => 0 };
    globalThis.PanelRarity = { fromRarityToColor: () => 0 };
    globalThis.DataManager = {
      isDatabaseLoaded: () => true,
      setupNewGame: () => {},
      extractSaveContents: () => {},
      setupBattleTest: () => {},
    };
    globalThis.ImageManager = {};
    globalThis.SoundManager = {};
    globalThis.StorageManager = {};
    globalThis.TextManager = {};
    globalThis.IconManager = {};
    globalThis.__PLUGIN_NAME__ = 'J-Base';
    globalThis.__PLUGIN_VERSION__ = '0.0.0-test';

    // RPG Maker seeds these from save data at boot; tests only need the arrays to exist.
    globalThis.$dataStates = [];

    // real production code, not a fixture guess- sets up globalThis.J, J.BASE.Aliased maps, and the
    // String.empty/Array.empty sentinel augmentations relied on elsewhere in this codebase.
    await import('../../../../../src/plugins/_base/core/_metadata/initialization.js');

    // the file under test- patches the real, engine-provided Game_Battler.prototype, no placeholder involved.
    await import('../../../../../src/plugins/_base/core/objects/Game_Battler.js');
  });

  afterAll(() =>
  {
    vi.unstubAllGlobals();
  });

  it('getNotesSources lists databaseData, skills(), and allStates() without __testNoteSources', () =>
  {
    globalThis.$dataStates[9] = { id: 9, note: 'state-note' };

    const battler = new globalThis.Game_Battler();

    battler.initMembers();
    battler.databaseData = function()
    {
      return { note: 'db-note' };
    };
    battler.skills = function()
    {
      return [ { note: 'skill-note' } ];
    };
    battler._states = [ 9 ];

    const sources = battler.getNotesSources();

    expect(sources.length).toBe(3);
    expect(sources[0].note).toBe('db-note');
    expect(sources[1].note).toBe('skill-note');
    expect(sources[2].note).toBe('state-note');
  });

  it('getAllNotes matches getNotesSources for battlers', () =>
  {
    globalThis.$dataStates[1] = { id: 1, note: 's' };

    const battler = new globalThis.Game_Battler();

    battler.initMembers();
    battler.databaseData = () => ({ note: 'd' });
    battler.skills = () => [];
    battler._states = [ 1 ];

    expect(battler.getAllNotes()).toEqual(battler.getNotesSources());
  });
});
//endregion plugins/_base/_component/game-battler-notes-real-engine-direct.test.js
