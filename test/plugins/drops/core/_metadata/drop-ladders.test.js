//region plugins/drops/core/_metadata/drop-ladders.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  installDropsHostGlobals,
  setPluginContextToJBase,
  setPluginContextToJDrops,
} from '../../_component/fixtures/install-drops-host-globals.js';

/**
 * The ladders are built once at boot and then trusted forever by the drop pipeline, so every defect
 * they can carry has to be caught here or it surfaces as loot quietly turning into the wrong item -
 * or into nothing at all. The three fatal shapes are a link into a row that does not exist, two rows
 * claiming the same row above them, and a chain that loops. Each is tested from the side that would
 * let it through: a dangling link is only visible if the target is looked up, a fork is only visible
 * if the inverse is considered, and a closed loop is only visible if the walk starts from a row
 * inside it rather than from a chain head.
 */
describe('J-DropsControl drop upgrade ladders (direct src import)', () =>
{
  let metadata;

  beforeAll(async () =>
  {
    vi.resetModules();

    installDropsHostGlobals();

    setPluginContextToJBase();
    await import('../../../../../src/plugins/_base/core/_metadata/initialization.js');

    ({ default: globalThis.RPGManager } = await import('../../../../../src/plugins/_base/core/managers/RPGManager.js'));
    ({ default: globalThis.RPG_DropItem } = await import('../../../../../src/plugins/_base/core/database/_data/RPG_DropItem.js'));

    setPluginContextToJDrops();
    await import('../../../../../src/plugins/drops/core/_metadata/initialization.js');

    metadata = globalThis.J.DROPS.Metadata;
  });

  /**
   * Builds a database-shaped table where index zero is the null RPG Maker always pads with.
   * @param {Object<number, string>} notesById The note text to place at each id.
   * @param {number} size How many rows the table holds, so a link can point past the end.
   * @returns {object[]}
   */
  const tableOf = (notesById, size) =>
  {
    const rows = [ null ];

    for (let id = 1; id <= size; id++)
    {
      rows.push({
        id,
        name: `row ${id}`,
        note: notesById[id] ?? '',
      });
    }

    return rows;
  };

  //region construction
  describe('dropLadderTables', () =>
  {
    it('pairs each database table with the drop kind that points into it', () =>
    {
      // Arrange: three distinguishable tables, so a mapping that returned the same one three times
      // or paired a kind with the wrong table cannot pass.
      globalThis.$dataItems = [ null, { id: 1, name: 'an item' } ];
      globalThis.$dataWeapons = [ null, { id: 1, name: 'a weapon' } ];
      globalThis.$dataArmors = [ null, { id: 1, name: 'an armor' } ];

      // Act
      const tables = metadata.dropLadderTables();

      // Assert: the kinds are the same numbers a drop entry carries, or the ladders would be keyed
      // by something no lookup ever asks for.
      expect(tables.length).toBe(3);
      expect(tables[0].kind).toBe(globalThis.RPG_DropItem.Types.Item);
      expect(tables[0].name).toBe('item');
      expect(tables[0].rows).toBe(globalThis.$dataItems);
      expect(tables[1].kind).toBe(globalThis.RPG_DropItem.Types.Weapon);
      expect(tables[1].name).toBe('weapon');
      expect(tables[1].rows).toBe(globalThis.$dataWeapons);
      expect(tables[2].kind).toBe(globalThis.RPG_DropItem.Types.Armor);
      expect(tables[2].name).toBe('armor');
      expect(tables[2].rows).toBe(globalThis.$dataArmors);
    });
  });

  describe('readLadderLinks', () =>
  {
    it('reads a single authored link into the map', () =>
    {
      // Arrange: row 2 is the near-miss sibling - it sits in the same table, adjacent to the linked
      // row, and carries no tag. If it appears in the map, the reader is not reading the tag.
      const rows = tableOf({ 1: '<dropUpgradeId:3>' }, 3);

      // Act
      const upgrades = globalThis.J.DROPS.Metadata.constructor.readLadderLinks('item', rows);

      // Assert
      expect(upgrades.get(1)).toBe(3);
      expect(upgrades.has(2)).toBe(false);
      expect(upgrades.size).toBe(1);
    });

    it('reads a multi-rung chain into the map', () =>
    {
      // Arrange
      const rows = tableOf({
        1: '<dropUpgradeId:2>',
        2: '<dropUpgradeId:3>',
        3: '<dropUpgradeId:4>',
      }, 5);

      // Act
      const upgrades = globalThis.J.DROPS.Metadata.constructor.readLadderLinks('item', rows);

      // Assert: three links, and the top rung and the unrelated row 5 both stay out of the map.
      expect(upgrades.size).toBe(3);
      expect(upgrades.get(1)).toBe(2);
      expect(upgrades.get(2)).toBe(3);
      expect(upgrades.get(3)).toBe(4);
      expect(upgrades.has(4)).toBe(false);
      expect(upgrades.has(5)).toBe(false);
    });

    it('yields an empty map for a table nobody authored a ladder in', () =>
    {
      // Arrange
      const rows = tableOf({}, 3);

      // Act
      const upgrades = globalThis.J.DROPS.Metadata.constructor.readLadderLinks('item', rows);

      // Assert
      expect(upgrades.size).toBe(0);
    });

    it('throws when a link names a row the table does not contain', () =>
    {
      // Arrange: unchecked, this resolves to nothing at kill time and deletes the drop silently.
      const rows = tableOf({ 1: '<dropUpgradeId:9999>' }, 3);

      // Act + Assert
      expect(() => globalThis.J.DROPS.Metadata.constructor.readLadderLinks('item', rows))
        .toThrow(/item row \[1\] has <dropUpgradeId:9999>/);
    });

    it('throws when two rows promote into the same row', () =>
    {
      // Arrange: the forward direction is unambiguous; the inverse is what cannot choose.
      const rows = tableOf({
        1: '<dropUpgradeId:3>',
        2: '<dropUpgradeId:3>',
      }, 3);

      // Act + Assert: both offenders are named, since either could be the mistake.
      expect(() => globalThis.J.DROPS.Metadata.constructor.readLadderLinks('item', rows))
        .toThrow(/rows \[1\] and \[2\] both promote into \[3\]/);
    });
  });

  describe('assertNoLadderCycles', () =>
  {
    it('accepts a chain that terminates', () =>
    {
      // Arrange
      const upgrades = new Map([ [ 1, 2 ], [ 2, 3 ] ]);

      // Act + Assert
      expect(() => globalThis.J.DROPS.Metadata.constructor.assertNoLadderCycles('item', upgrades))
        .not.toThrow();
    });

    it('throws on a closed loop that no chain leads into', () =>
    {
      // Arrange: 1 and 2 point at each other, so neither is a chain head. A sweep that only walked
      // from rows with nothing pointing at them would never enter this loop at all.
      const upgrades = new Map([ [ 1, 2 ], [ 2, 1 ] ]);

      // Act + Assert
      expect(() => globalThis.J.DROPS.Metadata.constructor.assertNoLadderCycles('item', upgrades))
        .toThrow(/circular drop upgrade ladder/);
    });

    it('throws on a loop that a chain does lead into', () =>
    {
      // Arrange: row 1 is a genuine head feeding a 2-3 loop, the shape a root-first sweep would find.
      const upgrades = new Map([ [ 1, 2 ], [ 2, 3 ], [ 3, 2 ] ]);

      // Act + Assert
      expect(() => globalThis.J.DROPS.Metadata.constructor.assertNoLadderCycles('item', upgrades))
        .toThrow(/circular drop upgrade ladder/);
    });

    it('throws on a row that promotes into itself', () =>
    {
      // Arrange
      const upgrades = new Map([ [ 1, 1 ] ]);

      // Act + Assert
      expect(() => globalThis.J.DROPS.Metadata.constructor.assertNoLadderCycles('item', upgrades))
        .toThrow(/row \[1\] is part of a circular drop upgrade ladder/);
    });
  });

  describe('invertLadder', () =>
  {
    it('points each row at the row beneath it', () =>
    {
      // Arrange
      const upgrades = new Map([ [ 1, 2 ], [ 2, 3 ] ]);

      // Act
      const downgrades = globalThis.J.DROPS.Metadata.constructor.invertLadder(upgrades);

      // Assert: the bottom rung has nothing below it and must not appear.
      expect(downgrades.get(2)).toBe(1);
      expect(downgrades.get(3)).toBe(2);
      expect(downgrades.has(1)).toBe(false);
    });
  });
  //endregion construction

  //region walking
  describe('walkDropLadder', () =>
  {
    const ITEM = 1;
    const WEAPON = 2;

    beforeEach(() =>
    {
      // a four-rung item ladder, plus a lone weapon row on no ladder at all.
      metadata.buildDropLadders([
        {
          kind: ITEM,
          name: 'item',
          rows: tableOf({
            1: '<dropUpgradeId:2>',
            2: '<dropUpgradeId:3>',
            3: '<dropUpgradeId:4>',
          }, 5),
        },
        {
          kind: WEAPON,
          name: 'weapon',
          rows: tableOf({}, 2),
        },
      ]);
    });

    it('climbs one rung', () =>
    {
      // Arrange + Act
      const result = metadata.walkDropLadder(ITEM, 1, 1);

      // Assert
      expect(result).toBe(2);
    });

    it('climbs several rungs', () =>
    {
      // Arrange + Act
      const result = metadata.walkDropLadder(ITEM, 1, 3);

      // Assert
      expect(result).toBe(4);
    });

    it('stops at the top rung rather than reporting a problem', () =>
    {
      // Arrange + Act: over-promoting is what a generous roll produces, not a misconfiguration.
      const result = metadata.walkDropLadder(ITEM, 1, 99);

      // Assert
      expect(result).toBe(4);
    });

    it('descends one rung', () =>
    {
      // Arrange + Act
      const result = metadata.walkDropLadder(ITEM, 4, -1);

      // Assert
      expect(result).toBe(3);
    });

    it('stops at the bottom rung', () =>
    {
      // Arrange + Act
      const result = metadata.walkDropLadder(ITEM, 4, -99);

      // Assert
      expect(result).toBe(1);
    });

    it('returns the row unchanged when no rungs are travelled', () =>
    {
      // Arrange + Act
      const result = metadata.walkDropLadder(ITEM, 2, 0);

      // Assert
      expect(result).toBe(2);
    });

    it('returns a row that sits on no ladder unchanged', () =>
    {
      // Arrange + Act: row 5 exists in the same table as the ladder and is deliberately not on it.
      const result = metadata.walkDropLadder(ITEM, 5, 2);

      // Assert
      expect(result).toBe(5);
    });

    it('returns the row unchanged for a table with no ladders at all', () =>
    {
      // Arrange + Act
      const result = metadata.walkDropLadder(WEAPON, 1, 2);

      // Assert
      expect(result).toBe(1);
    });

    it('returns the row unchanged for a kind that was never built', () =>
    {
      // Arrange + Act: armor was not among the tables handed to the builder.
      const result = metadata.walkDropLadder(3, 1, 2);

      // Assert
      expect(result).toBe(1);
    });

    it('keeps each table on its own ladder', () =>
    {
      // Arrange + Act: item 1 climbs, weapon 1 cannot - proving the maps are keyed by kind and a
      // promotion can never wander from one table into another.
      const promotedItem = metadata.walkDropLadder(ITEM, 1, 1);
      const promotedWeapon = metadata.walkDropLadder(WEAPON, 1, 1);

      // Assert
      expect(promotedItem).toBe(2);
      expect(promotedWeapon).toBe(1);
    });
  });
  //endregion walking
});
//endregion plugins/drops/core/_metadata/drop-ladders.test.js