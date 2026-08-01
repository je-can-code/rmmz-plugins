//region plugins/jafting/core/managers/salvage-unit-ledgers.test.js
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import JaftingSalvageManager from '../../../../../src/plugins/jafting/core/managers/JaftingSalvageManager.js';
import JaftingSalvageLedgerRow from '../../../../../src/plugins/jafting/core/__models/JaftingSalvageLedgerRow.js';
import JaftingSalvageLedgerSnapshot from '../../../../../src/plugins/jafting/core/__models/JaftingSalvageLedgerSnapshot.js';

/**
 * Vanilla stacks track only a count per database id, so several physically distinct crafted copies
 * of one template share a single inventory slot. Salvage needs them distinguishable - dismantling
 * the copy built from rare materials should refund those materials, not the cheap ones - so each
 * physical copy carries its own snapshot in a parallel `unitLedgers` array, with `bag.rows` kept as
 * the merged summary the list and layout code reads.
 *
 * The two therefore have to stay in lockstep with the party's actual stack size. These cover that
 * bookkeeping: growing and shrinking with the stack, rebuilding the merged view from the survivors,
 * and answering for a single ordinal.
 */
describe('JaftingSalvageManager per-unit ledgers (direct src import)', () =>
{
  /**
   * Builds a minimal RPG datum with just the surface the manager reads.
   * @param {'i'|'w'|'a'} kind The datum kind.
   * @param {number} id The database id.
   * @returns {object}
   */
  function fakeDatum(kind, id)
  {
    return {
      id,
      isItem: () => kind === 'i',
      isWeapon: () => kind === 'w',
      isArmor: () => kind === 'a',
    };
  }

  /**
   * Builds a ledger snapshot refunding a single item row.
   * @param {number} itemId The item id refunded.
   * @param {number} [count] How many are refunded.
   * @returns {JaftingSalvageLedgerSnapshot}
   */
  function snapshotOf(itemId, count = 1)
  {
    return new JaftingSalvageLedgerSnapshot([ new JaftingSalvageLedgerRow('i', itemId, count) ]);
  }

  beforeEach(() =>
  {
    globalThis.$gameParty = {
      _counts: {},
      numItems(datum)
      {
        const key = JaftingSalvageManager.containerKeyFromDatum(datum) ?? `?:${datum.id}`;

        return this._counts[key] ?? 0;
      },
      setCount(datum, n)
      {
        this._counts[JaftingSalvageManager.containerKeyFromDatum(datum)] = n;
      },
      gainItem: () => {},
      loseItem: () => {},
      gainGold: () => {},
      members: () => [],
    };

    globalThis.$dataWeapons = {};
    globalThis.$dataArmors = {};
    globalThis.$dataItems = {};
    globalThis.RPG_Weapon = { createEmpty: id => ({ id, empty: true }) };
    globalThis.RPG_Armor = { createEmpty: id => ({ id, empty: true }) };

    JaftingSalvageManager.initPartySalvageStorage();
  });

  afterEach(() =>
  {
    delete globalThis.$gameParty;
    delete globalThis.$dataWeapons;
    delete globalThis.$dataArmors;
    delete globalThis.$dataItems;
    delete globalThis.RPG_Weapon;
    delete globalThis.RPG_Armor;
  });

  //region merged view
  describe('recomputeMergedRowsFromPartyLedgerBag', () =>
  {
    it('produces an empty summary for a bag holding no units', () =>
    {
      // Arrange
      const bag = { unitLedgers: [], rows: [ new JaftingSalvageLedgerRow('i', 9, 5) ] };

      // Act
      JaftingSalvageManager.recomputeMergedRowsFromPartyLedgerBag(bag);

      // Assert: the stale summary is discarded rather than left behind.
      expect(bag.rows).toEqual([]);
    });

    it('produces an empty summary when the unit array is absent entirely', () =>
    {
      // Arrange: a bag restored from an older save may predate per-unit tracking.
      const bag = { rows: [ new JaftingSalvageLedgerRow('i', 9, 5) ] };

      // Act
      JaftingSalvageManager.recomputeMergedRowsFromPartyLedgerBag(bag);

      // Assert
      expect(bag.rows).toEqual([]);
    });

    it('sums matching rows across every stamped unit', () =>
    {
      // Arrange: two copies each refunding the same material.
      const bag = { unitLedgers: [ snapshotOf(1, 2), snapshotOf(1, 3) ], rows: [] };

      // Act
      JaftingSalvageManager.recomputeMergedRowsFromPartyLedgerBag(bag);

      // Assert
      expect(bag.rows.length).toBe(1);
      expect(bag.rows[0].n).toBe(5);
    });

    it('skips unstamped slots without disturbing the summary', () =>
    {
      // Arrange: a slot holding a copy that was never crafted has no ledger of its own.
      const bag = { unitLedgers: [ null, snapshotOf(1, 2), { rows: [] } ], rows: [] };

      // Act
      JaftingSalvageManager.recomputeMergedRowsFromPartyLedgerBag(bag);

      // Assert
      expect(bag.rows.length).toBe(1);
      expect(bag.rows[0].n).toBe(2);
    });
  });
  //endregion merged view

  //region stack synchronization
  describe('syncPartyLedgerUnitCountToStack', () =>
  {
    it('grows the unit array to match a larger stack', () =>
    {
      // Arrange: picking up more copies must leave room for each to be stamped later.
      const datum = fakeDatum('i', 1);
      $gameParty.setCount(datum, 3);
      const bag = { unitLedgers: [], rows: [] };

      // Act
      JaftingSalvageManager.syncPartyLedgerUnitCountToStack(bag, datum);

      // Assert
      expect(bag.unitLedgers.length).toBe(3);
    });

    it('shrinks the unit array to match a smaller stack', () =>
    {
      // Arrange: spending copies drops slots off the tail, matching the LIFO stamping order.
      const datum = fakeDatum('i', 1);
      $gameParty.setCount(datum, 1);
      const bag = { unitLedgers: [ snapshotOf(1), snapshotOf(2), snapshotOf(3) ], rows: [] };

      // Act
      JaftingSalvageManager.syncPartyLedgerUnitCountToStack(bag, datum);

      // Assert
      expect(bag.unitLedgers.length).toBe(1);
    });

    it('keeps the earliest stamped units when shrinking', () =>
    {
      // Arrange
      const datum = fakeDatum('i', 1);
      $gameParty.setCount(datum, 1);
      const bag = { unitLedgers: [ snapshotOf(7), snapshotOf(8) ], rows: [] };

      // Act
      JaftingSalvageManager.syncPartyLedgerUnitCountToStack(bag, datum);

      // Assert
      expect(bag.unitLedgers[0].rows[0].id).toBe(7);
    });

    it('creates the unit array when the bag has none', () =>
    {
      // Arrange
      const datum = fakeDatum('i', 1);
      $gameParty.setCount(datum, 2);
      const bag = { rows: [] };

      // Act
      JaftingSalvageManager.syncPartyLedgerUnitCountToStack(bag, datum);

      // Assert
      expect(bag.unitLedgers.length).toBe(2);
    });

    it('rebuilds the merged summary from whatever survived the resize', () =>
    {
      // Arrange: losing the top copy must not leave its materials in the shared summary.
      const datum = fakeDatum('i', 1);
      $gameParty.setCount(datum, 1);
      const bag = { unitLedgers: [ snapshotOf(1, 2), snapshotOf(1, 3) ], rows: [] };

      // Act
      JaftingSalvageManager.syncPartyLedgerUnitCountToStack(bag, datum);

      // Assert
      expect(bag.rows[0].n).toBe(2);
    });
  });

  describe('coercePartyLedgerBagShapeForDatum', () =>
  {
    it('writes a freshly minted bag back into party storage', () =>
    {
      // Arrange: coercion mints a bag when handed something unusable, and later reads go
      // through party storage rather than the local reference, so it has to be written back.
      const datum = fakeDatum('i', 1);
      $gameParty.setCount(datum, 1);

      // Act
      JaftingSalvageManager.coercePartyLedgerBagShapeForDatum(null, datum);

      // Assert
      expect($gameParty._j._jafting._salvageLedgers['i:1']).toBeTruthy();
    });

    it('gives a bag missing its unit array one that matches the stack', () =>
    {
      // Arrange
      const datum = fakeDatum('i', 1);
      $gameParty.setCount(datum, 2);
      const bag = { rows: [] };
      $gameParty._j._jafting._salvageLedgers['i:1'] = bag;

      // Act
      JaftingSalvageManager.coercePartyLedgerBagShapeForDatum(bag, datum);

      // Assert
      expect($gameParty._j._jafting._salvageLedgers['i:1'].unitLedgers.length).toBe(2);
    });
  });
  //endregion stack synchronization

  //region reading a single unit
  describe('getLedgerUnitForDatum', () =>
  {
    it('reports nothing for a missing datum', () =>
    {
      // Arrange: the salvage window asks during scene creation, before a row is highlighted.
      // Act & Assert
      expect(JaftingSalvageManager.getLedgerUnitForDatum(null, 0)).toBe(null);
    });

    it('reports nothing for an undefined datum', () =>
    {
      // Arrange & Act & Assert
      expect(JaftingSalvageManager.getLedgerUnitForDatum(undefined, 0)).toBe(null);
    });

    it('ignores the ordinal for a refinement row, which owns a single snapshot', () =>
    {
      // Arrange: refined equipment gets its own datastore index, so there is no stack to
      // index into even though the UI still passes a slot ordinal.
      const datum = fakeDatum('w', JaftingSalvageManager.DynamicEquipIndexMin);
      const snapshot = snapshotOf(4);
      datum._jaftingSalvageLedger = snapshot;

      // Act
      const unit = JaftingSalvageManager.getLedgerUnitForDatum(datum, 3);

      // Assert
      expect(unit).toBe(snapshot);
    });

    it('falls back to the merged bag when no ordinal is supplied', () =>
    {
      // Arrange
      const datum = fakeDatum('i', 1);
      $gameParty.setCount(datum, 1);
      JaftingSalvageManager.appendStampedUnitsToPartyStack(datum, snapshotOf(1, 2), 1);

      // Act
      const unit = JaftingSalvageManager.getLedgerUnitForDatum(datum, null);

      // Assert
      expect(unit.rows[0].n).toBe(2);
    });

    it('reports nothing for a datum of no recognizable kind', () =>
    {
      // Arrange: without a container key there is nowhere for a bag to live.
      const datum = {
        id: 1,
        isItem: () => false,
        isWeapon: () => false,
        isArmor: () => false,
      };

      // Act
      const unit = JaftingSalvageManager.getLedgerUnitForDatum(datum, 0);

      // Assert
      expect(unit).toBe(null);
    });

    it('reports nothing for a stack that was never stamped', () =>
    {
      // Arrange
      const datum = fakeDatum('i', 1);
      $gameParty.setCount(datum, 1);

      // Act
      const unit = JaftingSalvageManager.getLedgerUnitForDatum(datum, 0);

      // Assert
      expect(unit).toBe(null);
    });

    it('reports the snapshot belonging to the requested slot', () =>
    {
      // Arrange: two copies stamped with different materials- asking for one must not answer
      // with the other's, which is the whole reason per-unit ledgers exist.
      const datum = fakeDatum('i', 1);
      $gameParty.setCount(datum, 2);
      JaftingSalvageManager.appendStampedUnitsToPartyStack(datum, snapshotOf(7), 1);
      JaftingSalvageManager.appendStampedUnitsToPartyStack(datum, snapshotOf(8), 1);

      // Act
      const unit = JaftingSalvageManager.getLedgerUnitForDatum(datum, 1);

      // Assert
      expect(unit.rows[0].id).toBe(8);
    });

    it('reports nothing for a slot within the stack that carries no snapshot', () =>
    {
      // Arrange: a stack can mix crafted copies with ones bought from a shop.
      const datum = fakeDatum('i', 1);
      $gameParty.setCount(datum, 2);
      JaftingSalvageManager.appendStampedUnitsToPartyStack(datum, snapshotOf(7), 1);

      // Act
      const unit = JaftingSalvageManager.getLedgerUnitForDatum(datum, 0);

      // Assert
      expect(unit).toBe(null);
    });

    it('reports nothing for an ordinal past the end of the stack', () =>
    {
      // Arrange
      const datum = fakeDatum('i', 1);
      $gameParty.setCount(datum, 1);
      JaftingSalvageManager.appendStampedUnitsToPartyStack(datum, snapshotOf(7), 1);

      // Act
      const unit = JaftingSalvageManager.getLedgerUnitForDatum(datum, 9);

      // Assert
      expect(unit).toBe(null);
    });
  });
  //endregion reading a single unit

  //region unrecognized datums
  describe('kindless datums', () =>
  {
    /**
     * Builds a datum belonging to none of the three container kinds, which is what an unexpected
     * database row looks like to this manager.
     * @returns {object}
     */
    function kindlessDatum()
    {
      return {
        id: 1,
        isItem: () => false,
        isWeapon: () => false,
        isArmor: () => false,
      };
    }

    it('stamps nothing onto a datum with no container to stamp', () =>
    {
      // Arrange & Act
      const act = () => JaftingSalvageManager.appendStampedUnitsToPartyStack(kindlessDatum(), snapshotOf(1), 1);

      // Assert
      expect(act).not.toThrow();
    });

    it('clears nothing for a datum with no container', () =>
    {
      // Arrange & Act
      const act = () => JaftingSalvageManager.clearLedgerForDatum(kindlessDatum());

      // Assert
      expect(act).not.toThrow();
    });

    it('does nothing on gain for a datum with no container', () =>
    {
      // Arrange & Act
      const act = () => JaftingSalvageManager.afterPartyGainedItem(kindlessDatum(), 1);

      // Assert
      expect(act).not.toThrow();
    });

    it('does nothing on gain for a stack that was never stamped', () =>
    {
      // Arrange: gaining an ordinary shop item touches no ledger at all.
      const datum = fakeDatum('i', 1);
      $gameParty.setCount(datum, 1);

      // Act
      const act = () => JaftingSalvageManager.afterPartyGainedItem(datum, 1);

      // Assert
      expect(act).not.toThrow();
    });

    it('prunes the bag on gain once a stamped stack is emptied', () =>
    {
      // Arrange: the bag survives only while some slot still carries lineage.
      const datum = fakeDatum('i', 1);
      $gameParty.setCount(datum, 1);
      JaftingSalvageManager.appendStampedUnitsToPartyStack(datum, snapshotOf(7), 1);
      $gameParty.setCount(datum, 0);

      // Act
      JaftingSalvageManager.afterPartyGainedItem(datum, 1);

      // Assert
      expect($gameParty._j._jafting._salvageLedgers['i:1']).toBeUndefined();
    });
  });
  //endregion unrecognized datums

  //region non-item refunds
  describe('refundLedgerRows', () =>
  {
    it('refunds nothing for an amount of nothing', () =>
    {
      // Arrange
      const refunded = [];
      $gameParty.gainItem = (datum, n) => refunded.push([ datum, n ]);

      // Act
      JaftingSalvageManager.refundLedgerRows(snapshotOf(1, 2), 0);

      // Assert
      expect(refunded).toEqual([]);
    });

    it('scales a refund by the number of copies dismantled', () =>
    {
      // Arrange: a row records what one stamped copy is worth, so bulk salvage multiplies it.
      globalThis.$dataItems[1] = { id: 1 };
      const refunded = [];
      $gameParty.gainItem = (datum, n) => refunded.push(n);

      // Act
      JaftingSalvageManager.refundLedgerRows(snapshotOf(1, 2), 3);

      // Assert
      expect(refunded).toEqual([ 6 ]);
    });

    it('refunds gold rows into the party purse', () =>
    {
      // Arrange
      let gold = 0;
      $gameParty.gainGold = amount => { gold += amount; };
      const ledger = new JaftingSalvageLedgerSnapshot([ new JaftingSalvageLedgerRow('g', 0, 50) ]);

      // Act
      JaftingSalvageManager.refundLedgerRows(ledger, 2);

      // Assert
      expect(gold).toBe(100);
    });

    it('refunds SDP rows to every party member', () =>
    {
      // Arrange: the payout is flat per actor rather than divided among them.
      const awarded = [];
      $gameParty.members = () => [
        { modSdpPoints: n => awarded.push(n) },
        { modSdpPoints: n => awarded.push(n) },
      ];
      const ledger = new JaftingSalvageLedgerSnapshot([ new JaftingSalvageLedgerRow('s', 0, 5) ]);

      // Act
      JaftingSalvageManager.refundLedgerRows(ledger, 2);

      // Assert
      expect(awarded).toEqual([ 10, 10 ]);
    });

    it('skips rows marked as banned from refunding', () =>
    {
      // Arrange: some lineage is recorded for display but deliberately not returned.
      globalThis.$dataItems[1] = { id: 1 };
      const refunded = [];
      $gameParty.gainItem = (datum, n) => refunded.push(n);
      const ledger = new JaftingSalvageLedgerSnapshot([ new JaftingSalvageLedgerRow('i', 1, 2, true) ]);

      // Act
      JaftingSalvageManager.refundLedgerRows(ledger, 1);

      // Assert
      expect(refunded).toEqual([]);
    });
  });

  describe('pruneEmptyPartyLedgerBag', () =>
  {
    it('keeps a bag whose unit array is absent rather than assuming it is empty', () =>
    {
      // Arrange: a bag restored from an older save predates per-unit tracking, but its merged
      // rows still describe real lineage that must not be discarded.
      $gameParty._j._jafting._salvageLedgers['i:1'] = {
        rows: [ new JaftingSalvageLedgerRow('i', 7, 1) ],
      };

      // Act
      JaftingSalvageManager.pruneEmptyPartyLedgerBag('i:1');

      // Assert
      expect($gameParty._j._jafting._salvageLedgers['i:1']).toBeTruthy();
    });
  });
  //endregion non-item refunds
});
//endregion plugins/jafting/core/managers/salvage-unit-ledgers.test.js