//region plugins/__ca-mods/game-enemy.test.js
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { installCaModsHostGlobals } from './fixtures/install-ca-mods-host-globals.js';

describe('CAMods Game_Enemy.dropSources (real engine direct import)', () =>
{
  beforeAll(async () =>
  {
    installCaModsHostGlobals();

    await import('../../../src/plugins/_base/_metadata/initialization.js');
    await import('../../../src/plugins/__ca-mods/core/_metadata/initialization.js');

    // dropSources() itself is defined by another plugin (not vanilla RMMZ, not __ca-mods)- stand
    // in a minimal base implementation so the alias captured by __ca-mods's patch has something
    // real to call through to.
    globalThis.Game_Enemy.prototype.dropSources = function()
    {
      return [ 'base-drop-source' ];
    };

    // the file under test- aliases and extends the stand-in dropSources() above.
    await import('../../../src/plugins/__ca-mods/core/objects/Game_Enemy.js');
  });

  afterAll(() =>
  {
    delete globalThis.PluginManager;
    delete globalThis.PluginMetadata;
    delete globalThis.__PLUGIN_NAME__;
    delete globalThis.__PLUGIN_VERSION__;
    delete globalThis.J;
  });

  afterEach(() =>
  {
    delete globalThis.$gameParty;
  });

  it('appends the enemy\'s own passive states and the party\'s extra drop sources', () =>
  {
    const enemy = Object.create(globalThis.Game_Enemy.prototype);
    enemy.allStates = () => [ 'enemy-passive-state' ];

    globalThis.$gameParty = { extraDropSources: () => [ 'party-passive-state' ] };

    expect(enemy.dropSources()).toEqual([ 'base-drop-source', 'enemy-passive-state', 'party-passive-state' ]);
  });
});
//endregion plugins/__ca-mods/game-enemy.test.js
