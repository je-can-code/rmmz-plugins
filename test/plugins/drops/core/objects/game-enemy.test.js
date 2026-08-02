//region plugins/drops/core/objects/game-enemy.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  installDropsHostGlobals,
  setPluginContextToJBase,
  setPluginContextToJDrops,
} from '../../_component/fixtures/install-drops-host-globals.js';

/**
 * The whole point of this plugin is that a database "denominator" is reinterpreted as a straight
 * percentage rather than RPG Maker's one-in-N, so the arithmetic between the authored number and
 * the dice roll is the thing that matters. Two identities summing into one multiplier, or a
 * party-wide modifier being applied on both sides of that arithmetic, silently changes every drop
 * in the game - so these assert the exact rate a given authored number rolls at.
 */
describe('J-DropsControl Game_Enemy drop pipeline (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installDropsHostGlobals();

    setPluginContextToJBase();
    await import('../../../../../src/plugins/_base/core/_metadata/initialization.js');

    ({ default: globalThis.RPGManager } = await import('../../../../../src/plugins/_base/core/managers/RPGManager.js'));

    await import('../../../../../src/plugins/_base/core/objects/Game_BattlerBase.js');
    await import('../../../../../src/plugins/_base/core/objects/Game_Battler.js');

    ({ default: globalThis.RPG_DropItem } = await import('../../../../../src/plugins/_base/core/database/_data/RPG_DropItem.js'));

    setPluginContextToJDrops();
    await import('../../../../../src/plugins/drops/core/_metadata/initialization.js');

    // the extra-drop parser builds real drop items, so both the type enum extension and the
    // builder have to be present as the bare globals the plugin reaches for.
    await import('../../../../../src/plugins/drops/core/database/RPG_DropItem.js');
    ({ default: globalThis.RPG_DropItemBuilder } = await import('../../../../../src/plugins/drops/core/database/RPG_DropItemBuilder.js'));

    await import('../../../../../src/plugins/drops/core/objects/Game_Battler.js');
    await import('../../../../../src/plugins/drops/core/objects/Game_Actor.js');
    await import('../../../../../src/plugins/drops/core/objects/Game_Party.js');
    await import('../../../../../src/plugins/drops/core/objects/Game_Enemy.js');
  });

  let enemy;

  beforeEach(() =>
  {
    enemy = new globalThis.Game_Enemy();
    enemy.initMembers();
    enemy._enemyDb = {
      id: 1,
      name: 'Testy',
      note: '',
      gold: 100,
      dropItems: [],
      originalDropItems: () => [],
    };

    const party = new globalThis.Game_Party();
    party.__battleMembers = [];
    globalThis.$gameParty = party;
  });

  //region multiplier arithmetic
  describe('getDropMultiplierBonus', () =>
  {
    it('leaves the authored rate alone when nobody carries a bonus', () =>
    {
      // Arrange: a party with nothing equipped must not change drop rates at all. The enemy's
      // own base rate is the sole identity in this sum.
      // Act
      const result = enemy.getDropMultiplierBonus();

      // Assert
      expect(result).toBe(1);
    });

    it('adds party bonuses on top of the neutral base', () =>
    {
      // Arrange
      globalThis.$gameParty.__battleMembers = [ { getDropMultiplierBonus: () => 0.5 } ];

      // Act
      const result = enemy.getDropMultiplierBonus();

      // Assert
      expect(result).toBeCloseTo(1.5, 10);
    });

    it('doubles exactly once for the double-drop accessory', () =>
    {
      // Arrange: the accessory is consulted by the engine's own dropItemRate here. It must not
      // also be consulted again during the roll, or a single accessory would apply twice.
      globalThis.$gameParty.hasDropItemDouble = () => true;

      // Act
      const result = enemy.getDropMultiplierBonus();

      // Assert
      expect(result).toBe(2);
    });

    it('scales party bonuses by the double-drop accessory too', () =>
    {
      // Arrange
      globalThis.$gameParty.hasDropItemDouble = () => true;
      globalThis.$gameParty.__battleMembers = [ { getDropMultiplierBonus: () => 0.5 } ];

      // Act
      const result = enemy.getDropMultiplierBonus();

      // Assert
      expect(result).toBeCloseTo(3, 10);
    });
  });

  describe('authored rate to rolled rate', () =>
  {
    it('rolls an authored twenty five percent drop at twenty five percent', () =>
    {
      // Arrange: this is the contract the whole plugin exists to provide- the number in the
      // database is the percentage, unmodified, when nothing else is in play.
      // Act
      const rolledRate = 25 * enemy.getDropMultiplierBonus();

      // Assert
      expect(rolledRate).toBe(25);
    });

    it('rolls that same drop at fifty percent with the double-drop accessory', () =>
    {
      // Arrange
      globalThis.$gameParty.hasDropItemDouble = () => true;

      // Act
      const rolledRate = 25 * enemy.getDropMultiplierBonus();

      // Assert
      expect(rolledRate).toBe(50);
    });
  });
  //endregion multiplier arithmetic

  //region roll behavior
  describe('didFindLoot', () =>
  {
    it('never finds loot at a zero percent rate', () =>
    {
      // Arrange & Act
      const found = enemy.didFindLoot(0);

      // Assert
      expect(found).toBe(false);
    });

    it('always finds loot at a hundred percent rate', () =>
    {
      // Arrange & Act
      const found = enemy.didFindLoot(100);

      // Assert
      expect(found).toBe(true);
    });

    it('does not re-apply the double-drop accessory to a rate that already includes it', () =>
    {
      // Arrange: the rate handed in has already been through getDropMultiplierBonus. If the
      // accessory were consulted again here, a 50% rate would become a guaranteed find.
      globalThis.$gameParty.hasDropItemDouble = () => true;

      // Act: run enough rolls that a silently-doubled 50 would show as always-true.
      const results = Array.from({ length: 200 }, () => enemy.didFindLoot(50));

      // Assert
      expect(results.includes(false)).toBe(true);
    });
  });

  describe('canFindLoot', () =>
  {
    it('declines an empty drop slot', () =>
    {
      // Arrange: RPG Maker pads enemy drop lists with kind-zero placeholders.
      // Act
      const result = enemy.canFindLoot({ kind: 0, dataId: 0, denominator: 1 });

      // Assert
      expect(result).toBe(false);
    });

    it('accepts a populated drop slot', () =>
    {
      // Arrange & Act
      const result = enemy.canFindLoot({ kind: 1, dataId: 1, denominator: 50 });

      // Assert
      expect(result).toBe(true);
    });
  });
  //endregion roll behavior

  //region making drops
  describe('makeDropItems', () =>
  {
    it('finds nothing from an enemy with no drops authored', () =>
    {
      // Arrange & Act
      const found = enemy.makeDropItems();

      // Assert
      expect(found).toEqual([]);
    });

    it('always yields a drop whose rate reaches a hundred percent', () =>
    {
      // Arrange: at or above 100 the dice are skipped entirely, which is what makes a heavily
      // buffed party feel deterministic rather than merely lucky.
      globalThis.$dataItems[1] = { id: 1, name: 'Potion' };
      enemy._enemyDb.originalDropItems = () => [ { kind: 1, dataId: 1, denominator: 100 } ];

      // Act
      const found = enemy.makeDropItems();

      // Assert
      expect(found).toEqual([ { id: 1, name: 'Potion' } ]);
    });

    it('yields several copies of one drop when the killer accumulates', () =>
    {
      // Arrange: a drop is a repeatable outcome, so a killer whose extra rolls all land should
      // walk away with a stack rather than the surplus rolls being discarded.
      globalThis.$dataItems[1] = { id: 1, name: 'Potion' };
      enemy._enemyDb.originalDropItems = () => [ { kind: 1, dataId: 1, denominator: 100 } ];
      const killer = {
        getPositiveRolls: () => 2,
        getNegativeRolls: () => 0,
        isVeryLucky: () => false,
        isVeryCursed: () => false,
        isAccumulating: () => true,
        getEncoreRepeats: () => 0,
      };

      // Act
      const found = enemy.makeDropItems(killer);

      // Assert: the base roll plus both bonus rolls, each landing at a guaranteed rate.
      expect(found.length).toBe(3);
    });

    it('skips an empty drop slot without rolling for it', () =>
    {
      // Arrange
      enemy._enemyDb.originalDropItems = () => [ { kind: 0, dataId: 0, denominator: 100 } ];

      // Act
      const found = enemy.makeDropItems();

      // Assert
      expect(found).toEqual([]);
    });

    it('yields nothing when the roll fails', () =>
    {
      // Arrange
      globalThis.$dataItems[1] = { id: 1, name: 'Potion' };
      enemy._enemyDb.originalDropItems = () => [ { kind: 1, dataId: 1, denominator: 0 } ];

      // Act
      const found = enemy.makeDropItems();

      // Assert
      expect(found).toEqual([]);
    });
  });

  describe('findLoot', () =>
  {
    it('adds a resolved item to the running list', () =>
    {
      // Arrange
      globalThis.$dataItems[2] = { id: 2, name: 'Elixir' };
      const itemsFound = [];

      // Act
      enemy.findLoot({ kind: 1, dataId: 2, denominator: 100 }, itemsFound);

      // Assert
      expect(itemsFound).toEqual([ { id: 2, name: 'Elixir' } ]);
    });

    it('refuses to add a drop that resolves to nothing', () =>
    {
      // Arrange: a drop pointing at a deleted database row would otherwise put undefined into
      // the reward list, which surfaces much later as an unreadable item in the loot popup.
      const warn = vi.spyOn(console, 'warn')
        .mockImplementation(() => {});
      const itemsFound = [];

      // Act
      enemy.findLoot({ kind: 1, dataId: 9999, denominator: 100 }, itemsFound);

      // Assert
      expect(itemsFound).toEqual([]);

      // restore manually so the spy cannot leak into whichever test runs next in this file.
      warn.mockRestore();
    });

    it('names the unresolvable drop so the database row can be found', () =>
    {
      // Arrange
      const warn = vi.spyOn(console, 'warn')
        .mockImplementation(() => {});

      // Act
      enemy.findLoot({ kind: 1, dataId: 9999, denominator: 100 }, []);

      // Assert
      expect(warn).toHaveBeenCalled();

      warn.mockRestore();
    });
  });
  //endregion making drops

  //region extra drops
  describe('extra drops', () =>
  {
    it('has no extra drop sources beyond the enemy itself by default', () =>
    {
      // Arrange & Act
      const sources = enemy.dropSources();

      // Assert
      expect(sources).toEqual([]);
    });

    it('finds no extras on an enemy with no extra-drop tags', () =>
    {
      // Arrange & Act
      const extras = enemy.extraDrops();

      // Assert
      expect(extras).toEqual([]);
    });

    it('builds a drop item from an extra-drop tag', () =>
    {
      // Arrange: extra drops are authored as a type letter, a database id, and a percentage.
      const referenceData = { note: '<drops:[i,3,25]>' };

      // Act
      const extras = enemy.extractExtraDrops(referenceData);

      // Assert
      expect(extras.length).toBe(1);
    });

    it('carries the authored id and chance onto the built drop', () =>
    {
      // Arrange
      const referenceData = { note: '<drops:[i,3,25]>' };

      // Act
      const [ drop ] = enemy.extractExtraDrops(referenceData);

      // Assert
      expect([ drop.dataId, drop.denominator ]).toEqual([ 3, 25 ]);
    });

    it('gathers extras from every source it is given', () =>
    {
      // Arrange: the source list is empty by default but exists so other plugins can widen where
      // loot comes from- a region, a state, a difficulty modifier. Anything added has to be read.
      enemy.dropSources = () => [ { note: '<drops:[i,3,25]>' }, { note: '<drops:[w,7,10]>' } ];

      // Act
      const extras = enemy.extraDrops();

      // Assert
      expect(extras.map(drop => drop.dataId)).toEqual([ 3, 7 ]);
    });

    it('finds no extras on reference data carrying no tags', () =>
    {
      // Arrange & Act
      const extras = enemy.extractExtraDrops({ note: '' });

      // Assert
      expect(extras).toEqual([]);
    });
  });
  //endregion extra drops
});
//endregion plugins/drops/core/objects/game-enemy.test.js