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
        dropUpgradeCount: () => 0,
        dropQuantityBonus: () => 0,
      };

      // Act
      const found = enemy.makeDropItems(killer);

      // Assert: the base roll plus both bonus rolls, each landing at a guaranteed rate.
      expect(found.length).toBe(3);
    });

    it('skips an empty drop slot without rolling for it', () =>
    {
      // Arrange: RPG Maker pads drop lists with kind-zero placeholders, so a real enemy carries
      // them right alongside genuine drops. Rolling one anyway resolves to no item, and the
      // unresolvable-drop warning then names a database row that is not actually broken - which is
      // the only difference the skip makes, since neither path adds anything to the loot. The real
      // drop beside it has to come through regardless, or nothing here has been proven to run.
      globalThis.$dataItems[1] = { id: 1, name: 'Potion' };
      enemy._enemyDb.originalDropItems = () => [
        { kind: 0, dataId: 0, denominator: 100 },
        { kind: 1, dataId: 1, denominator: 100 },
      ];

      // a guaranteed rate on both entries, so the "found nothing" guard downstream cannot be what
      // spares the placeholder.
      const warn = vi.spyOn(console, 'warn')
        .mockImplementation(() => {});

      // Act
      const found = enemy.makeDropItems();

      // Assert
      expect(found).toEqual([ { id: 1, name: 'Potion' } ]);
      expect(warn).not.toHaveBeenCalled();

      // restore manually so the spy cannot leak into whichever test runs next in this file.
      warn.mockRestore();
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

  //region loot modifiers
  /**
   * Quality and quantity are separate axes from rate, and the whole point of applying them after the
   * roll is that they cannot silently become a rate change. What makes them easy to get wrong is the
   * interaction: quantity counts distinct items, promotion changes what "distinct" means, and the two
   * orders disagree wherever clamping lands two rows on the same rung.
   */
  describe('postProcessDroppedLoot', () =>
  {
    const ITEM = 1;

    /**
     * Seeds the item table and its ladder, then hands back rows for assembling expectations.
     * @param {Object<number, string>} notesById Note text per row id.
     * @param {number} size How many rows the table holds.
     */
    const seedItemLadder = (notesById, size) =>
    {
      globalThis.$dataItems = [ null ];

      for (let id = 1; id <= size; id++)
      {
        globalThis.$dataItems.push({
          id,
          kind: ITEM,
          name: `item ${id}`,
          note: notesById[id] ?? '',
        });
      }

      globalThis.J.DROPS.Metadata.buildDropLadders([
        {
          kind: ITEM,
          name: 'item',
          rows: globalThis.$dataItems,
        },
      ]);
    };

    /**
     * A killer carrying whatever loot modifiers the test needs and nothing else.
     * @param {number} upgrade The rungs this killer promotes by.
     * @param {number} quantity The extra copies this killer grants.
     */
    const killerWith = (upgrade, quantity) => ({
      dropUpgradeCount: () => upgrade,
      dropQuantityBonus: () => quantity,
    });

    /**
     * Counts how many of each item id came out, so expectations read as plain totals.
     * @param {object[]} loot The processed loot.
     */
    const tallyIds = loot =>
    {
      const tally = {};

      loot.forEach(item =>
      {
        tally[item.id] = (tally[item.id] ?? 0) + 1;
      });

      return tally;
    };

    beforeEach(() =>
    {
      enemy._enemyDb.note = '';
    });

    it('leaves loot untouched when nothing carries a modifier', () =>
    {
      // Arrange: two different rows in a deliberate order, so a pass that rebuilt the list by
      // grouping would reorder them and be caught. Most kills in the game take this path.
      seedItemLadder({ 1: '<dropUpgradeId:2>' }, 3);
      const dropped = [
        globalThis.$dataItems[1],
        globalThis.$dataItems[3],
        globalThis.$dataItems[1],
      ];

      // Act
      const result = enemy.postProcessDroppedLoot(dropped, killerWith(0, 0));

      // Assert: the very same array, not a copy and not a regrouping of it.
      expect(result).toBe(dropped);
      expect(result.map(item => item.id)).toEqual([ 1, 3, 1 ]);
    });

    it('resolves a database row only for loot that actually moved', () =>
    {
      // Arrange: item 1 climbs to 2, item 3 sits on no ladder, and the panel unlock has no row at
      // all. Only the first has anything to look up- resolving the other two would either waste a
      // lookup or, for the synthetic entry, ask the database for a row that does not exist.
      seedItemLadder({ 1: '<dropUpgradeId:2>' }, 3);
      const lookups = [];
      const originalItemObject = globalThis.Game_Enemy.prototype.itemObject;
      globalThis.Game_Enemy.prototype.itemObject = function(kind, dataId)
      {
        lookups.push([ kind, dataId ]);

        return originalItemObject.call(this, kind, dataId);
      };

      const dropped = [
        globalThis.$dataItems[1],
        globalThis.$dataItems[3],
        {
          id: 0,
          sdpKey: 'some-panel',
        },
      ];

      // Act
      enemy.postProcessDroppedLoot(dropped, killerWith(1, 0));

      // Assert: exactly one lookup, for the one row that changed.
      expect(lookups).toEqual([ [ 1, 2 ] ]);

      // restore by hand; a bare-global prototype patch outlives this file's other tests otherwise.
      globalThis.Game_Enemy.prototype.itemObject = originalItemObject;
    });

    it('promotes a dropped row up its ladder', () =>
    {
      // Arrange: item 3 is the near-miss sibling - same table, on no ladder, must survive unpromoted.
      seedItemLadder({ 1: '<dropUpgradeId:2>' }, 3);
      const dropped = [ globalThis.$dataItems[1], globalThis.$dataItems[3] ];

      // Act
      const result = enemy.postProcessDroppedLoot(dropped, killerWith(1, 0));

      // Assert
      expect(tallyIds(result)).toEqual({
        2: 1,
        3: 1,
      });
    });

    it('sums the enemy and the killer when deciding how far to promote', () =>
    {
      // Arrange: one rung from each side reaches rung three, which neither could reach alone.
      seedItemLadder({
        1: '<dropUpgradeId:2>',
        2: '<dropUpgradeId:3>',
      }, 4);
      enemy._enemyDb.note = '<dropUpgrade:1>';
      const dropped = [ globalThis.$dataItems[1] ];

      // Act
      const result = enemy.postProcessDroppedLoot(dropped, killerWith(1, 0));

      // Assert
      expect(tallyIds(result)).toEqual({ 3: 1 });
    });

    it('promotes on the enemy alone when the killer is unknown', () =>
    {
      // Arrange: an affixed enemy felled by nothing identifiable still owes what its affix promised.
      seedItemLadder({ 1: '<dropUpgradeId:2>' }, 3);
      enemy._enemyDb.note = '<dropUpgrade:1>';
      const dropped = [ globalThis.$dataItems[1] ];

      // Act
      const result = enemy.postProcessDroppedLoot(dropped, null);

      // Assert
      expect(tallyIds(result)).toEqual({ 2: 1 });
    });

    it('walks downward when the summed count is negative', () =>
    {
      // Arrange
      seedItemLadder({ 1: '<dropUpgradeId:2>' }, 3);
      const dropped = [ globalThis.$dataItems[2] ];

      // Act
      const result = enemy.postProcessDroppedLoot(dropped, killerWith(-1, 0));

      // Assert
      expect(tallyIds(result)).toEqual({ 1: 1 });
    });

    it('grants the quantity bonus once per distinct item, not once per drop entry', () =>
    {
      // Arrange: four copies of item 1 and one of item 3, exactly as five drop entries would land.
      // Two different items are what stop "groups correctly" from passing as "adds to everything".
      seedItemLadder({}, 3);
      const dropped = [
        globalThis.$dataItems[1],
        globalThis.$dataItems[1],
        globalThis.$dataItems[1],
        globalThis.$dataItems[1],
        globalThis.$dataItems[3],
      ];

      // Act
      const result = enemy.postProcessDroppedLoot(dropped, killerWith(0, 2));

      // Assert: six and three. Applying the bonus per entry would yield twelve and three.
      expect(tallyIds(result)).toEqual({
        1: 6,
        3: 3,
      });
    });

    it('removes copies when the quantity bonus is negative', () =>
    {
      // Arrange
      seedItemLadder({}, 3);
      const dropped = [ globalThis.$dataItems[1], globalThis.$dataItems[1], globalThis.$dataItems[1] ];

      // Act
      const result = enemy.postProcessDroppedLoot(dropped, killerWith(0, -2));

      // Assert
      expect(tallyIds(result)).toEqual({ 1: 1 });
    });

    it('removes an item entirely when the negative exceeds what dropped', () =>
    {
      // Arrange: item 3 dropped once and item 1 three times, so one is wiped and one merely dented.
      seedItemLadder({}, 3);
      const dropped = [
        globalThis.$dataItems[1],
        globalThis.$dataItems[1],
        globalThis.$dataItems[1],
        globalThis.$dataItems[3],
      ];

      // Act
      const result = enemy.postProcessDroppedLoot(dropped, killerWith(0, -2));

      // Assert: the thin drop is erased despite having passed its roll; the plentiful one survives.
      expect(tallyIds(result)).toEqual({ 1: 1 });
      expect(result.length).toBe(1);
    });

    it('counts distinct items after promotion, not before', () =>
    {
      // Arrange: THE ordering case. Item 1 promotes into 2, and 2 is the top rung, so both dropped
      // rows land on item 2. Grouping before promotion would see two distinct drops and grant the
      // bonus twice; grouping after sees one kind of thing and grants it once.
      seedItemLadder({ 1: '<dropUpgradeId:2>' }, 3);
      const dropped = [ globalThis.$dataItems[1], globalThis.$dataItems[2] ];

      // Act
      const result = enemy.postProcessDroppedLoot(dropped, killerWith(1, 2));

      // Assert: two dropped rows plus one bonus of two. Grouping first would produce six.
      expect(tallyIds(result)).toEqual({ 2: 4 });
    });

    it('passes synthetic loot through without promoting or duplicating it', () =>
    {
      // Arrange: J-SDP pushes panel unlocks straight into the found list with no database row behind
      // them. The real drop beside it is the near-miss - it must still take the bonus, or "skips
      // synthetic" and "skips everything" would be the same program.
      seedItemLadder({ 1: '<dropUpgradeId:2>' }, 3);
      const panelUnlock = {
        id: 0,
        sdpKey: 'some-panel',
      };
      const dropped = [ panelUnlock, globalThis.$dataItems[1] ];

      // Act
      const result = enemy.postProcessDroppedLoot(dropped, killerWith(1, 2));

      // Assert: exactly one panel unlock survives, while the real drop promoted and tripled.
      expect(result.filter(item => item.sdpKey === 'some-panel').length).toBe(1);
      expect(tallyIds(result)['2']).toBe(3);
    });

    it('applies the quantity bonus from the enemy alone when the killer is unknown', () =>
    {
      // Arrange
      seedItemLadder({}, 3);
      enemy._enemyDb.note = '<dropQuantity:2>';
      const dropped = [ globalThis.$dataItems[1] ];

      // Act
      const result = enemy.postProcessDroppedLoot(dropped, null);

      // Assert
      expect(tallyIds(result)).toEqual({ 1: 3 });
    });

    it('cancels out when the enemy and killer carry opposing counts', () =>
    {
      // Arrange: a positive and a negative that sum to nothing must behave as no tag at all, which
      // is a different claim from either side being ignored.
      seedItemLadder({ 1: '<dropUpgradeId:2>' }, 3);
      enemy._enemyDb.note = '<dropUpgrade:2>';
      const dropped = [ globalThis.$dataItems[1] ];

      // Act
      const result = enemy.postProcessDroppedLoot(dropped, killerWith(-2, 0));

      // Assert
      expect(tallyIds(result)).toEqual({ 1: 1 });
    });
  });
  //endregion loot modifiers
});
//endregion plugins/drops/core/objects/game-enemy.test.js