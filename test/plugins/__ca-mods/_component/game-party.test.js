//region plugins/__ca-mods/_component/game-party.test.js
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { installCaModsHostGlobals } from './fixtures/install-ca-mods-host-globals.js';

describe('CAMods Game_Party (real engine direct import)', () =>
{
  beforeAll(async () =>
  {
    installCaModsHostGlobals();

    await import('../../../../src/plugins/_base/core/_metadata/initialization.js');
    await import('../../../../src/plugins/__ca-mods/core/_metadata/initialization.js');

    // the file under test- adds elementalActors/elementalJabsBattlers/isLeaderActor onto the real,
    // engine-provided Game_Party.prototype.
    await import('../../../../src/plugins/__ca-mods/core/objects/Game_Party.js');
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
    delete globalThis.JABS_AiManager;
  });

  it('exposes the CA elemental ally actor ids as a static list', () =>
  {
    expect(globalThis.Game_Party.ELEMENTAL_ALLY_ACTOR_IDS).toEqual([ 3, 4, 5, 6 ]);
  });

  describe('elementalActors', () =>
  {
    it('filters battle members down to only the known elemental actor ids', () =>
    {
      const party = Object.create(globalThis.Game_Party.prototype);
      const elemental = { actorId: () => 3 };
      const nonElemental = { actorId: () => 99 };

      globalThis.$gameParty = { battleMembers: () => [ elemental, nonElemental ] };

      expect(party.elementalActors()).toEqual([ elemental ]);
    });
  });

  describe('elementalJabsBattlers', () =>
  {
    it('filters JABS_AiManager actor battlers down to only the elemental actor ids', () =>
    {
      const party = Object.create(globalThis.Game_Party.prototype);
      const elementalJabsBattler = { getBattler: () => ({ actorId: () => 4 }) };
      const nonElementalJabsBattler = { getBattler: () => ({ actorId: () => 1 }) };

      globalThis.JABS_AiManager = {
        getActorBattlers: () => [ elementalJabsBattler, nonElementalJabsBattler ],
      };

      expect(party.elementalJabsBattlers()).toEqual([ elementalJabsBattler ]);
    });
  });

  describe('isLeaderActor', () =>
  {
    it('is true when the given actorId matches the party leader\'s actorId', () =>
    {
      const party = Object.create(globalThis.Game_Party.prototype);
      party.leader = () => ({ actorId: () => 1 });

      expect(party.isLeaderActor(1)).toBe(true);
      expect(party.isLeaderActor(2)).toBe(false);
    });
  });
});
//endregion plugins/__ca-mods/_component/game-party.test.js
