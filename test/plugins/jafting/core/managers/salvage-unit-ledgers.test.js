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
  function fakeDatum(kind, id, index = id)
  {
    return {
      id,
      index,
      _key()
      {
        return this.index;
      },
      isItem: () => kind === 'i',
      isWeapon: () => kind === 'w',
      isArmor: () => kind === 'a',
    };
  }

  /**
   * The key a real `Game_Party` container uses: kind plus instance slot, never the template id.
   *
   * J-Base overwrites `numItems` and `gainItem` to key on `_key()`, so a stub keyed on `id` cannot tell a dynamic
   * instance apart from the base stack it was cloned from.
   * @param {object} datum The datum to key.
   * @returns {string}
   */
  function instanceKey(datum)
  {
    if (datum.isItem()) return `i:${datum._key()}`;

    if (datum.isWeapon()) return `w:${datum._key()}`;

    if (datum.isArmor()) return `a:${datum._key()}`;

    return `?:${datum._key()}`;
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
        return this._counts[instanceKey(datum)] ?? 0;
      },
      setCount(datum, n)
      {
        this._counts[instanceKey(datum)] = n;
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

    // per-copy ledgers are sized against every copy held, and a worn copy is held without being in the container -
    // so the manager asks the actors too. an empty cast is the "nobody is wearing anything" baseline.
    globalThis.$gameActors = { existingActors: () => [] };

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
    delete globalThis.$gameActors;
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

    it('refuses to shrink, because a copy out of the bag may still be held', () =>
    {
      // Arrange: this runs on every loss, and at that instant a copy that was equipped looks exactly like one that
      // was sold. Trimming here would throw away the provenance of gear somebody is wearing.
      const datum = fakeDatum('i', 1);
      $gameParty.setCount(datum, 1);
      const bag = { unitLedgers: [ snapshotOf(1), snapshotOf(2), snapshotOf(3) ], rows: [] };

      // Act
      JaftingSalvageManager.syncPartyLedgerUnitCountToStack(bag, datum);

      // Assert
      expect(bag.unitLedgers.length).toBe(3);
    });

    it('counts a worn copy toward the stack it grows to', () =>
    {
      // Arrange: two in the bag and one on an actor is three copies held, even though the container says two.
      const datum = fakeDatum('i', 1);
      $gameParty.setCount(datum, 2);
      globalThis.$gameActors = { existingActors: () => [ { equips: () => [ datum ] } ] };
      const bag = { unitLedgers: [], rows: [] };

      // Act
      JaftingSalvageManager.syncPartyLedgerUnitCountToStack(bag, datum);

      // Assert
      expect(bag.unitLedgers.length).toBe(3);
    });

    it('counts two worn copies of one row separately', () =>
    {
      // Arrange: two accessory slots can hold two of the same thing, so worn copies are tallied rather than
      // merely detected. The roster deliberately mixes in an empty slot and a *different* armor, because a
      // roster holding nothing but copies of the row under test cannot tell "counts this slot" apart from
      // "counts every equip an actor has on" - both answer two, and the slot comparison could be deleted.
      const datum = fakeDatum('a', 4);
      const otherArmor = fakeDatum('a', 5);
      $gameParty.setCount(datum, 0);
      globalThis.$gameActors = {
        existingActors: () => [ { equips: () => [ datum, null, otherArmor, datum ] } ],
      };
      const bag = { unitLedgers: [], rows: [] };

      // Act
      JaftingSalvageManager.syncPartyLedgerUnitCountToStack(bag, datum);

      // Assert
      expect(bag.unitLedgers.length).toBe(2);
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

    it('rebuilds the merged summary from every surviving copy', () =>
    {
      // Arrange
      const datum = fakeDatum('i', 1);
      $gameParty.setCount(datum, 2);
      const bag = { unitLedgers: [ snapshotOf(1, 2), snapshotOf(1, 3) ], rows: [] };

      // Act
      JaftingSalvageManager.syncPartyLedgerUnitCountToStack(bag, datum);

      // Assert
      expect(bag.rows[0].n).toBe(5);
    });
  });

  describe('resizeTemplateLedgerBags', () =>
  {
    it('trims the tail down to the copies actually held', () =>
    {
      // Arrange: the deferred half of sizing, run from a settled state where a missing copy really is gone.
      const datum = fakeDatum('i', 1);
      $dataItems[1] = datum;
      $gameParty.setCount(datum, 3);
      JaftingSalvageManager.appendStampedUnitsToPartyStack(datum, snapshotOf(9), 3);
      $gameParty.setCount(datum, 1);

      // Act
      JaftingSalvageManager.resizeTemplateLedgerBags();

      // Assert
      expect($gameParty._j._jafting._salvageLedgers['i:1'].unitLedgers.length).toBe(1);
    });

    it('resolves a weapon bag back to its own template row', () =>
    {
      // Arrange- the key carries only a letter and an id, so the letter is the whole of what picks
      // which datastore to look the template up in. A weapon key resolved against items or armors
      // would hand back the wrong row entirely, and the held count taken off it would be somebody
      // else's - trimming this bag to a length that has nothing to do with what the player owns.
      const datum = fakeDatum('w', 7);
      $dataWeapons[7] = datum;
      $gameParty.setCount(datum, 3);
      JaftingSalvageManager.appendStampedUnitsToPartyStack(datum, snapshotOf(9), 3);
      $gameParty.setCount(datum, 2);

      // Act
      JaftingSalvageManager.resizeTemplateLedgerBags();

      // Assert
      expect($gameParty._j._jafting._salvageLedgers['w:7'].unitLedgers.length).toBe(2);
    });

    it('spares a copy somebody is wearing', () =>
    {
      // Arrange: the whole reason shrinking waits until here.
      const datum = fakeDatum('a', 4);
      $dataArmors[4] = datum;
      $gameParty.setCount(datum, 1);
      JaftingSalvageManager.appendStampedUnitsToPartyStack(datum, snapshotOf(9), 1);
      $gameParty.setCount(datum, 0);
      globalThis.$gameActors = { existingActors: () => [ { equips: () => [ datum ] } ] };

      // Act
      JaftingSalvageManager.resizeTemplateLedgerBags();

      // Assert
      expect($gameParty._j._jafting._salvageLedgers['a:4'].unitLedgers.length).toBe(1);
    });

    it('drops a bag once its last copy is gone for good', () =>
    {
      // Arrange
      const datum = fakeDatum('i', 1);
      $dataItems[1] = datum;
      $gameParty.setCount(datum, 1);
      JaftingSalvageManager.appendStampedUnitsToPartyStack(datum, snapshotOf(9), 1);
      $gameParty.setCount(datum, 0);

      // Act
      JaftingSalvageManager.resizeTemplateLedgerBags();

      // Assert
      expect($gameParty._j._jafting._salvageLedgers['i:1']).toBeUndefined();
    });

    it('leaves a bag already matching its stack untouched', () =>
    {
      // Arrange: this runs on every map entry, so the no-op case is the common one.
      const datum = fakeDatum('i', 1);
      $dataItems[1] = datum;
      $gameParty.setCount(datum, 2);
      JaftingSalvageManager.appendStampedUnitsToPartyStack(datum, snapshotOf(9), 2);

      // Act
      JaftingSalvageManager.resizeTemplateLedgerBags();

      // Assert
      expect($gameParty._j._jafting._salvageLedgers['i:1'].unitLedgers.length).toBe(2);
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
  describe('appendStampedUnitsToPartyStack', () =>
  {
    it('leaves the template bag untouched when the datum is a dynamic instance', () =>
    {
      // Arrange: a dynamic row keeps its stamp on the row itself. it reports base id 5, so a guard reading the id
      // would route the stamp into the base stack's bag and quietly rewrite the history of items the player
      // separately owns.
      const refined = fakeDatum('w', 5, JaftingSalvageManager.DynamicEquipIndexMin);
      $gameParty.setCount(refined, 1);

      // Act
      JaftingSalvageManager.appendStampedUnitsToPartyStack(refined, snapshotOf(12), 1);

      // Assert
      expect($gameParty._j._jafting._salvageLedgers['w:5']).toBeUndefined();
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
      // index into even though the UI still passes a slot ordinal. the row still reports base id 5, so the ordinal
      // is only skipped if the guard reads the instance slot rather than the template it was cloned from.
      const datum = fakeDatum('w', 5, JaftingSalvageManager.DynamicEquipIndexMin);
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

    it('falls back to the merged bag when the ordinal arrives undefined rather than null', () =>
    {
      // Arrange: "no ordinal" reaches this method two ways - a caller that passes null on purpose and a caller
      // that simply omits the argument - and only the null spelling had a case. With the undefined operand
      // deleted, an omitted ordinal falls through to the stack lookup and indexes `unitLedgers[undefined]`,
      // which quietly answers nothing for a stack that is in fact stamped.
      const datum = fakeDatum('i', 1);
      $gameParty.setCount(datum, 1);
      JaftingSalvageManager.appendStampedUnitsToPartyStack(datum, snapshotOf(1, 2), 1);

      // Act
      const unit = JaftingSalvageManager.getLedgerUnitForDatum(datum, undefined);

      // Assert
      expect(unit.rows[0].n).toBe(2);
    });

    it('mints no bag for a stack it was asked about but never found one for', () =>
    {
      // Arrange: reading is not writing. Coercion fails open and hands back a fresh bag for an absent slot, so
      // skipping the absence check would answer null all the same while leaving an empty bag behind in party
      // storage on every UI read of an unstamped row. The stamped sibling is here so the assertion is a pin on
      // what the map actually holds rather than on it merely being empty.
      const unstamped = fakeDatum('i', 1);
      const stamped = fakeDatum('i', 2);
      $gameParty.setCount(unstamped, 1);
      $gameParty.setCount(stamped, 1);
      JaftingSalvageManager.appendStampedUnitsToPartyStack(stamped, snapshotOf(7), 1);

      // Act
      const unit = JaftingSalvageManager.getLedgerUnitForDatum(unstamped, 0);

      // Assert
      expect(unit).toBe(null);
      expect(Object.keys($gameParty._j._jafting._salvageLedgers)).toEqual([ 'i:2' ]);
    });

    it('reports nothing for a slot whose snapshot exists but records nothing', () =>
    {
      // Arrange: an empty snapshot is not the same absence as a missing one, and both have to answer nothing.
      // A copy can be stamped with a lineage that later expands away, and returning that hollow snapshot would
      // put a dismantle row in the UI that refunds nothing when the player commits to it.
      const datum = fakeDatum('i', 1);
      $gameParty.setCount(datum, 1);
      $gameParty._j._jafting._salvageLedgers['i:1'] = {
        unitLedgers: [ new JaftingSalvageLedgerSnapshot([]) ],
        rows: [],
      };

      // Act
      const unit = JaftingSalvageManager.getLedgerUnitForDatum(datum, 0);

      // Assert
      expect(unit).toBe(null);
    });

    it('reports nothing for a datum of no recognizable kind', () =>
    {
      // Arrange: without a container key there is nowhere for a bag to live.
      const datum = {
        id: 1,
        index: 1,
        _key()
        {
          return this.index;
        },
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
        index: 1,
        _key()
        {
          return this.index;
        },
        isItem: () => false,
        isWeapon: () => false,
        isArmor: () => false,
      };
    }

    it('stamps nothing onto a datum with no container to stamp', () =>
    {
      // Arrange: not throwing is the weaker half of this. Without the key check the method carries on and mints
      // a bag under the key `null`, which is a slot no reader can ever ask for again and which rides along in
      // every save from then on. The stamped sibling proves the map is live and that its real entry survived.
      const stamped = fakeDatum('i', 2);
      $gameParty.setCount(stamped, 1);
      JaftingSalvageManager.appendStampedUnitsToPartyStack(stamped, snapshotOf(7), 1);

      // Act
      JaftingSalvageManager.appendStampedUnitsToPartyStack(kindlessDatum(), snapshotOf(1), 1);

      // Assert
      expect(Object.keys($gameParty._j._jafting._salvageLedgers)).toEqual([ 'i:2' ]);
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

    it('keeps a bag whose stack has emptied, leaving the decision to the sweep', () =>
    {
      // Arrange: an emptied container is not proof the copies are gone - they may be worn. This hook fires from
      // inside transactions, so it defers the call to {@link resizeTemplateLedgerBags}.
      const datum = fakeDatum('i', 1);
      $gameParty.setCount(datum, 1);
      JaftingSalvageManager.appendStampedUnitsToPartyStack(datum, snapshotOf(7), 1);
      $gameParty.setCount(datum, 0);

      // Act
      JaftingSalvageManager.afterPartyGainedItem(datum, 1);

      // Assert
      expect($gameParty._j._jafting._salvageLedgers['i:1']).toBeDefined();
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

    it('drops a bag whose only snapshot records nothing', () =>
    {
      // Arrange: the earlier prune cases hold `null` in every slot, and a null slot is turned away by the first
      // half of the lineage test before the row count is ever consulted - so "this slot has rows" and "this slot
      // is stamped at all" were indistinguishable. A snapshot carrying an empty row list is stamped without being
      // lineage, and treating it as lineage would keep an unbounded keyed bag alive in every save forever.
      $gameParty._j._jafting._salvageLedgers['i:1'] = {
        unitLedgers: [ new JaftingSalvageLedgerSnapshot([]) ],
        rows: [],
      };

      // Act
      JaftingSalvageManager.pruneEmptyPartyLedgerBag('i:1');

      // Assert
      expect($gameParty._j._jafting._salvageLedgers['i:1']).toBeUndefined();
    });
  });
  //endregion non-item refunds

  //region party transaction hooks
  describe('afterPartyGainedItem', () =>
  {
    it('grows the unit array to match a stack that just grew', () =>
    {
      // Arrange: the parallel array is the stack's shadow, so a gained copy needs a slot waiting for it. stamping
      // one copy first is what keeps the bag alive through the prune this hook ends with, which isolates the
      // sizing behavior from the pruning behavior.
      const datum = fakeDatum('i', 1);
      $gameParty.setCount(datum, 1);
      JaftingSalvageManager.appendStampedUnitsToPartyStack(datum, snapshotOf(7), 1);
      $gameParty.setCount(datum, 3);

      // Act
      JaftingSalvageManager.afterPartyGainedItem(datum, 2);

      // Assert
      expect($gameParty._j._jafting._salvageLedgers['i:1'].unitLedgers).toHaveLength(3);
    });

    it('leaves bookkeeping untouched when nothing was actually gained', () =>
    {
      // Arrange: vanilla fires this hook for every transaction, including ones that moved no quantity. an amount
      // of nothing must resize nothing, or a stack that never changed still gets rewritten.
      const datum = fakeDatum('i', 1);
      $gameParty.setCount(datum, 1);
      JaftingSalvageManager.appendStampedUnitsToPartyStack(datum, snapshotOf(7), 1);
      $gameParty.setCount(datum, 3);

      // Act
      JaftingSalvageManager.afterPartyGainedItem(datum, 0);

      // Assert
      expect($gameParty._j._jafting._salvageLedgers['i:1'].unitLedgers).toHaveLength(1);
    });

    it('resizes no template bag when the row gained is a dynamic instance', () =>
    {
      // Arrange: a refined sword still reports the base sword's id, so its container key resolves to the base
      // stack's bag. Letting it through would size *that* bag against the refined instance's own holding - the
      // plain Iron Swords in the bag would grow phantom slots measured by something the player owns separately.
      // The counts are deliberately unequal, because growth is the only direction sizing moves here: with both
      // at the same number the wrong bag would be resized to exactly the length it already had.
      const baseWeapon = fakeDatum('w', 5);
      $gameParty.setCount(baseWeapon, 1);
      JaftingSalvageManager.appendStampedUnitsToPartyStack(baseWeapon, snapshotOf(7), 1);
      const refined = fakeDatum('w', 5, JaftingSalvageManager.DynamicEquipIndexMin);
      $gameParty.setCount(refined, 4);

      // Act
      JaftingSalvageManager.afterPartyGainedItem(refined, 1);

      // Assert
      expect($gameParty._j._jafting._salvageLedgers['w:5'].unitLedgers).toHaveLength(1);
    });
  });
  //endregion party transaction hooks
});
//endregion plugins/jafting/core/managers/salvage-unit-ledgers.test.js