//region plugins/drops/ext/passive/objects/game-enemy.test.js
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import {
  installBaseDropSources,
  installDropsPassiveHostGlobals,
  setPluginContextToJBase,
  setPluginContextToJDrops,
  setPluginContextToJDropsPassive,
} from '../_component/fixtures/install-drops-passive-host-globals.js';

describe('J-Drops-Passive Game_Enemy.dropSources (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installDropsPassiveHostGlobals();

    setPluginContextToJBase();
    await import('../../../../../../src/plugins/_base/core/_metadata/initialization.js');

    setPluginContextToJDrops();
    await import('../../../../../../src/plugins/drops/core/_metadata/initialization.js');

    setPluginContextToJDropsPassive();
    await import('../../../../../../src/plugins/drops/ext/passive/_metadata/initialization.js');

    // the base implementation has to exist before the alias captures it.
    installBaseDropSources([ 'base-drop-source' ]);

    // the file under test- aliases the stand-in above.
    await import('../../../../../../src/plugins/drops/ext/passive/objects/Game_Enemy.js');
  });

  afterAll(() =>
  {
    delete globalThis.$gameParty;
    delete globalThis.PluginManager;
    delete globalThis.PluginMetadata;
    delete globalThis.__PLUGIN_NAME__;
    delete globalThis.__PLUGIN_VERSION__;
    delete globalThis.J;
  });

  it('appends the enemy\'s own states and the party\'s states onto the base sources', () =>
  {
    // Arrange
    const enemy = Object.create(globalThis.Game_Enemy.prototype);
    enemy.allStates = () => [ 'enemy-state' ];
    globalThis.$gameParty = { extraDropSources: () => [ 'party-state' ] };

    // Act
    const sources = enemy.dropSources();

    // Assert- order matters, since it is what tells a reader which source contributed which drop
    // when a drop shows up twice.
    expect(sources).toEqual([ 'base-drop-source', 'enemy-state', 'party-state' ]);
  });

  it('preserves what the base implementation reported rather than replacing it', () =>
  {
    // Arrange- an enemy carrying nothing and a party carrying nothing is the case where a naive
    // implementation that returned its own list instead of extending the base one would lose the
    // enemy's authored drops entirely, and would look correct in the test above.
    const enemy = Object.create(globalThis.Game_Enemy.prototype);
    enemy.allStates = () => [];
    globalThis.$gameParty = { extraDropSources: () => [] };

    // Act
    const sources = enemy.dropSources();

    // Assert
    expect(sources).toEqual([ 'base-drop-source' ]);
  });
});
//endregion plugins/drops/ext/passive/objects/game-enemy.test.js