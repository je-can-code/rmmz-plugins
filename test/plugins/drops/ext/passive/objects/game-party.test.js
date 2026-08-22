//region plugins/drops/ext/passive/objects/game-party.test.js
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import {
  installDropsPassiveHostGlobals,
  setPluginContextToJBase,
  setPluginContextToJDrops,
  setPluginContextToJDropsPassive,
} from '../_component/fixtures/install-drops-passive-host-globals.js';

describe('J-Drops-Passive Game_Party.extraDropSources (direct src import)', () =>
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

    // the file under test- defines extraDropSources on the real Game_Party.prototype.
    await import('../../../../../../src/plugins/drops/ext/passive/objects/Game_Party.js');
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

  it('flattens allStates() from every battle member into a single list', () =>
  {
    // Arrange
    const party = Object.create(globalThis.Game_Party.prototype);
    const memberA = { allStates: () => [ 'state-a1', 'state-a2' ] };
    const memberB = { allStates: () => [ 'state-b1' ] };
    globalThis.$gameParty = { battleMembers: () => [ memberA, memberB ] };

    // Act
    const sources = party.extraDropSources();

    // Assert
    expect(sources).toEqual([ 'state-a1', 'state-a2', 'state-b1' ]);
  });

  it('asks battleMembers rather than members, so reserve states contribute nothing', () =>
  {
    // Arrange- both lists are populated and they differ, which is what makes the assertion able to
    // tell "read the active party" apart from "read the whole roster".
    const party = Object.create(globalThis.Game_Party.prototype);
    const active = { allStates: () => [ 'active-state' ] };
    const reserve = { allStates: () => [ 'reserve-state' ] };
    globalThis.$gameParty = {
      battleMembers: () => [ active ],
      members: () => [ active, reserve ],
    };

    // Act
    const sources = party.extraDropSources();

    // Assert
    expect(sources).toEqual([ 'active-state' ]);
  });

  it('contributes nothing when nobody in the active party is carrying a state', () =>
  {
    // Arrange- an empty result is also what a method that never ran would produce, so the member is
    // present and merely stateless rather than absent.
    const party = Object.create(globalThis.Game_Party.prototype);
    globalThis.$gameParty = { battleMembers: () => [ { allStates: () => [] } ] };

    // Act
    const sources = party.extraDropSources();

    // Assert
    expect(sources).toEqual([]);
  });
});
//endregion plugins/drops/ext/passive/objects/game-party.test.js