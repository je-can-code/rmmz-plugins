//region plugins/jafting/_component/core-data-manager-game-party-direct.test.js
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import JaftingSalvageManager from '../../../../src/plugins/jafting/core/managers/JaftingSalvageManager.js';

// both source files under test import JaftingSalvageManager as a real ES module binding (see
// core/objects/DataManager.js and core/objects/Game_Party.js), so vi.mock intercepts the import
// itself- the same technique refinement-workflow-session.test.js uses for JaftingManager.
vi.mock('../../../../src/plugins/jafting/core/managers/JaftingSalvageManager.js', () => ({
  default: {
    initPartySalvageStorage: vi.fn(),
    afterPartyGainedItem: vi.fn(),
    afterPartyLostItem: vi.fn(),
  },
}));

describe('JAFTING core prototype patches (direct src import)', () =>
{
  describe('core/objects/DataManager.js', () =>
  {
    let aliasedGetCalls;

    beforeAll(async () =>
    {
      // minimal aliasing map matching J.JAFTING.Aliased.DataManager.set/get(name)- a real Map works
      // fine since the source only ever calls .set then .get with the same string key.
      globalThis.J = { JAFTING: { Aliased: { DataManager: new Map() } } };

      globalThis.DataManager = {
        createGameObjects: vi.fn(function original()
        {
          aliasedGetCalls.push('createGameObjects');
        }),
        extractSaveContents: vi.fn(function original(contents)
        {
          aliasedGetCalls.push([ 'extractSaveContents', contents ]);
        }),
      };

      // the file under test- patches globalThis.DataManager directly, importing exactly once for
      // this whole describe block since ES module evaluation only runs its top-level code once.
      await import('../../../../src/plugins/jafting/core/objects/DataManager.js');
    });

    beforeEach(() =>
    {
      aliasedGetCalls = [];
      JaftingSalvageManager.initPartySalvageStorage.mockClear();
    });

    afterAll(() =>
    {
      delete globalThis.J;
      delete globalThis.DataManager;
    });

    it('createGameObjects calls original logic then initializes party salvage storage', () =>
    {
      DataManager.createGameObjects();

      expect(aliasedGetCalls).toEqual([ 'createGameObjects' ]);
      expect(JaftingSalvageManager.initPartySalvageStorage).toHaveBeenCalledTimes(1);
    });

    it('extractSaveContents forwards contents to original logic then re-initializes storage', () =>
    {
      const contents = { save: true };

      DataManager.extractSaveContents(contents);

      expect(aliasedGetCalls).toEqual([ [ 'extractSaveContents', contents ] ]);
      expect(JaftingSalvageManager.initPartySalvageStorage).toHaveBeenCalledTimes(1);
    });
  });

  describe('core/objects/Game_Party.js', () =>
  {
    let aliasedGetCalls;

    beforeAll(async () =>
    {
      globalThis.J = { JAFTING: { Aliased: { Game_Party: new Map() } } };

      function Game_Party()
      {
      }

      Game_Party.prototype.gainItem = vi.fn(function original(item, amount)
      {
        aliasedGetCalls.push([ 'gainItem', item, amount ]);
      });
      Game_Party.prototype.loseItem = vi.fn(function original(item, amount)
      {
        aliasedGetCalls.push([ 'loseItem', item, amount ]);
      });

      globalThis.Game_Party = Game_Party;

      await import('../../../../src/plugins/jafting/core/objects/Game_Party.js');
    });

    beforeEach(() =>
    {
      aliasedGetCalls = [];
      JaftingSalvageManager.afterPartyGainedItem.mockClear();
      JaftingSalvageManager.afterPartyLostItem.mockClear();
    });

    afterAll(() =>
    {
      delete globalThis.J;
      delete globalThis.Game_Party;
    });

    it('gainItem calls the original method then notifies JaftingSalvageManager of the gain', () =>
    {
      const party = new Game_Party();
      const item = { id: 7 };

      party.gainItem(item, 3, false);

      expect(aliasedGetCalls).toEqual([ [ 'gainItem', item, 3 ] ]);
      expect(JaftingSalvageManager.afterPartyGainedItem).toHaveBeenCalledWith(item, 3);
    });

    it('loseItem calls the original method then notifies JaftingSalvageManager of the loss', () =>
    {
      const party = new Game_Party();
      const item = { id: 8 };

      party.loseItem(item, 2, true);

      expect(aliasedGetCalls).toEqual([ [ 'loseItem', item, 2 ] ]);
      expect(JaftingSalvageManager.afterPartyLostItem).toHaveBeenCalledWith(item, 2);
    });
  });
});
//endregion plugins/jafting/_component/core-data-manager-game-party-direct.test.js
