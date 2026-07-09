//region plugins/jafting/core-salvage-manager-direct.test.js
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import JaftingSalvageManager from '../../../src/plugins/jafting/core/managers/JaftingSalvageManager.js';
import JaftingSalvageLedgerRow from '../../../src/plugins/jafting/core/__models/JaftingSalvageLedgerRow.js';
import JaftingSalvageLedgerSnapshot from '../../../src/plugins/jafting/core/__models/JaftingSalvageLedgerSnapshot.js';
import JaftingSalvagePartyLedgerBag from '../../../src/plugins/jafting/core/__models/JaftingSalvagePartyLedgerBag.js';

/**
 * Direct-import coverage for JaftingSalvageManager, exercising the surface not already covered by the
 * existing VM-bundle suites (jafting-core.test.js, salvage-expand-material-armor.test.js,
 * salvage-models-jsonex.test.js). Those tests run through out/jafting/J-JAFTING.js inside a
 * vm.runInContext sandbox; this file imports the real source module directly so coverage attributes to
 * core/managers/JaftingSalvageManager.js itself, following the direct-import convention from
 * game-battler-notes-direct.test.js.
 * <br>
 * JaftingSalvageManager reads $gameParty, $dataWeapons, $dataArmors, $dataItems, RPG_Weapon, and
 * RPG_Armor as bare globals (never imported, since the real engine defines them)- those are stubbed
 * minimally per test rather than pulled from the real engine loader, since nothing here needs real
 * Game_Party inheritance, just the handful of methods JaftingSalvageManager actually calls.
 */
describe('JaftingSalvageManager (direct src import)', () =>
{
  /**
   * Builds a minimal fake RPG datum (item/weapon/armor) with just the surface JaftingSalvageManager
   * reads: isItem/isWeapon/isArmor type predicates and an id.
   *
   * @param {'i'|'w'|'a'} kind
   * @param {number} id
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

  beforeEach(() =>
  {
    // fresh party each test, with a numItems() lookup backed by a plain map keyed by "kind:id".
    globalThis.$gameParty = {
      _counts: {},
      numItems(datum)
      {
        const key = JaftingSalvageManager.containerKeyFromDatum(datum) ?? `?:${datum.id}`;
        return this._counts[key] ?? 0;
      },
      setCount(datum, n)
      {
        const key = JaftingSalvageManager.containerKeyFromDatum(datum);
        this._counts[key] = n;
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

    // real game code reaches this point via DataManager.createGameObjects before anything touches
    // ledgers (see core/objects/DataManager.js); tests that assign $gameParty by hand must do the same.
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

  describe('containerKeyFromDatum', () =>
  {
    it('prefixes by item/weapon/armor kind and returns null for anything else', () =>
    {
      expect(JaftingSalvageManager.containerKeyFromDatum(fakeDatum('i', 3))).toBe('i:3');
      expect(JaftingSalvageManager.containerKeyFromDatum(fakeDatum('w', 4))).toBe('w:4');
      expect(JaftingSalvageManager.containerKeyFromDatum(fakeDatum('a', 5))).toBe('a:5');
      expect(JaftingSalvageManager.containerKeyFromDatum({
        id: 6, isItem: () => false, isWeapon: () => false, isArmor: () => false,
      })).toBe(null);
    });
  });

  describe('initPartySalvageStorage', () =>
  {
    it('creates the nested _j._jafting._salvageLedgers graph when missing', () =>
    {
      JaftingSalvageManager.initPartySalvageStorage();

      expect($gameParty._j._jafting._salvageLedgers).toEqual({});
    });

    it('is a no-op guard when $gameParty is falsy (does not throw)', () =>
    {
      globalThis.$gameParty = null;

      expect(() => JaftingSalvageManager.initPartySalvageStorage()).not.toThrow();
    });

    it('does not clobber an existing ledgers map on repeat calls', () =>
    {
      JaftingSalvageManager.initPartySalvageStorage();
      $gameParty._j._jafting._salvageLedgers['i:1'] = 'sentinel';

      JaftingSalvageManager.initPartySalvageStorage();

      expect($gameParty._j._jafting._salvageLedgers['i:1']).toBe('sentinel');
    });
  });

  describe('getLedgerForDatum / appendStampedUnitsToPartyStack / mergeLedgerIntoPartyOrDatum', () =>
  {
    it('returns null for a null/undefined datum', () =>
    {
      expect(JaftingSalvageManager.getLedgerForDatum(null)).toBe(null);
      expect(JaftingSalvageManager.getLedgerForDatum(undefined)).toBe(null);
    });

    it('reads the ledger straight off the datum when it carries _jaftingSalvageLedger (dynamic refinement rows)', () =>
    {
      const datum = fakeDatum('w', JaftingSalvageManager.DynamicEquipIndexMin);
      const snapshot = new JaftingSalvageLedgerSnapshot([ new JaftingSalvageLedgerRow('i', 1, 1) ]);
      datum._jaftingSalvageLedger = snapshot;

      expect(JaftingSalvageManager.getLedgerForDatum(datum)).toBe(snapshot);
    });

    it('returns null for a vanilla-stack datum with no bag stamped yet', () =>
    {
      const datum = fakeDatum('i', 1);

      expect(JaftingSalvageManager.getLedgerForDatum(datum)).toBe(null);
    });

    it('appendStampedUnitsToPartyStack stamps the tail of the stack (LIFO) with the incoming ledger', () =>
    {
      const datum = fakeDatum('i', 1);
      $gameParty.setCount(datum, 2);

      const incoming = new JaftingSalvageLedgerSnapshot([ new JaftingSalvageLedgerRow('i', 9, 1) ]);
      JaftingSalvageManager.appendStampedUnitsToPartyStack(datum, incoming, 1);

      const bag = $gameParty._j._jafting._salvageLedgers['i:1'];

      expect(bag.unitLedgers.length).toBe(2);
      // only the tail (most-recently-gained) slot got stamped.
      expect(bag.unitLedgers[0]).toBe(null);
      expect(bag.unitLedgers[1].rows[0].id).toBe(9);
      // merged rows mirror the stamped slot.
      expect(bag.rows[0].id).toBe(9);
    });

    it('appendStampedUnitsToPartyStack is a no-op for dynamic refinement ids, zero stampedCount, or a null key', () =>
    {
      const dynamicDatum = fakeDatum('w', JaftingSalvageManager.DynamicEquipIndexMin);
      const incoming = new JaftingSalvageLedgerSnapshot([ new JaftingSalvageLedgerRow('i', 1, 1) ]);

      JaftingSalvageManager.appendStampedUnitsToPartyStack(dynamicDatum, incoming, 1);
      expect($gameParty._j._jafting._salvageLedgers).toEqual({});

      const stackDatum = fakeDatum('i', 1);
      JaftingSalvageManager.appendStampedUnitsToPartyStack(stackDatum, incoming, 0);
      expect($gameParty._j._jafting._salvageLedgers).toEqual({});
    });

    it('mergeLedgerIntoPartyOrDatum merges onto the RPG object for dynamic ids and appends to the stack otherwise', () =>
    {
      const dynamicDatum = fakeDatum('w', JaftingSalvageManager.DynamicEquipIndexMin);
      dynamicDatum._jaftingSalvageLedger = new JaftingSalvageLedgerSnapshot([ new JaftingSalvageLedgerRow('i', 1, 1) ]);

      const incoming = new JaftingSalvageLedgerSnapshot([ new JaftingSalvageLedgerRow('i', 1, 2) ]);
      JaftingSalvageManager.mergeLedgerIntoPartyOrDatum(dynamicDatum, incoming);

      // merged in-place: 1 + 2 = 3 for the same t:id key.
      expect(dynamicDatum._jaftingSalvageLedger.rows[0].n).toBe(3);

      const stackDatum = fakeDatum('a', 1);
      $gameParty.setCount(stackDatum, 1);
      JaftingSalvageManager.mergeLedgerIntoPartyOrDatum(stackDatum, incoming);

      const bag = $gameParty._j._jafting._salvageLedgers['a:1'];
      expect(bag.unitLedgers[0].rows[0].id).toBe(1);
    });
  });

  describe('clearLedgerForDatum / pruneEmptyPartyLedgerBag', () =>
  {
    it('nulls the datum-side ledger and deletes the party-side bag entry', () =>
    {
      const dynamicDatum = fakeDatum('w', JaftingSalvageManager.DynamicEquipIndexMin);
      dynamicDatum._jaftingSalvageLedger = new JaftingSalvageLedgerSnapshot([]);

      JaftingSalvageManager.clearLedgerForDatum(dynamicDatum);
      expect(dynamicDatum._jaftingSalvageLedger).toBe(null);

      JaftingSalvageManager.initPartySalvageStorage();
      $gameParty._j._jafting._salvageLedgers['i:1'] = new JaftingSalvagePartyLedgerBag();

      const stackDatum = fakeDatum('i', 1);
      JaftingSalvageManager.clearLedgerForDatum(stackDatum);

      expect($gameParty._j._jafting._salvageLedgers['i:1']).toBeUndefined();
    });

    it('deletes a keyed bag once both merged rows and every unit slot are empty', () =>
    {
      JaftingSalvageManager.initPartySalvageStorage();
      const bag = new JaftingSalvagePartyLedgerBag();
      bag.unitLedgers = [ null, null ];
      $gameParty._j._jafting._salvageLedgers['i:1'] = bag;

      JaftingSalvageManager.pruneEmptyPartyLedgerBag('i:1');

      expect($gameParty._j._jafting._salvageLedgers['i:1']).toBeUndefined();
    });

    it('keeps a keyed bag when any unit slot still has rows', () =>
    {
      JaftingSalvageManager.initPartySalvageStorage();
      const bag = new JaftingSalvagePartyLedgerBag();
      bag.unitLedgers = [ new JaftingSalvageLedgerSnapshot([ new JaftingSalvageLedgerRow('i', 1, 1) ]) ];
      $gameParty._j._jafting._salvageLedgers['i:1'] = bag;

      JaftingSalvageManager.pruneEmptyPartyLedgerBag('i:1');

      expect($gameParty._j._jafting._salvageLedgers['i:1']).toBe(bag);
    });

    it('is a no-op when the keyed bag does not exist', () =>
    {
      JaftingSalvageManager.initPartySalvageStorage();

      expect(() => JaftingSalvageManager.pruneEmptyPartyLedgerBag('missing:1')).not.toThrow();
    });
  });

  describe('afterPartyGainedItem / afterPartyLostItem', () =>
  {
    it('afterPartyGainedItem ignores dynamic refinement ids, falsy datums, and non-positive amounts', () =>
    {
      const dynamicDatum = fakeDatum('w', JaftingSalvageManager.DynamicEquipIndexMin);

      JaftingSalvageManager.afterPartyGainedItem(dynamicDatum, 1);
      expect($gameParty._j._jafting._salvageLedgers).toEqual({});

      JaftingSalvageManager.afterPartyGainedItem(null, 1);
      expect($gameParty._j._jafting._salvageLedgers).toEqual({});

      JaftingSalvageManager.afterPartyGainedItem(fakeDatum('i', 1), 0);
      expect($gameParty._j._jafting._salvageLedgers).toEqual({});
    });

    it('afterPartyGainedItem grows/prunes bag bookkeeping for a vanilla stack gain', () =>
    {
      const datum = fakeDatum('i', 1);
      $gameParty.setCount(datum, 1);

      JaftingSalvageManager.afterPartyGainedItem(datum, 1);

      // no ledger was ever stamped, so the freshly synced/empty bag gets pruned right back out.
      expect($gameParty._j._jafting._salvageLedgers['i:1']).toBeUndefined();
    });

    it('afterPartyLostItem clears the ledger and reclaims the dynamic slot once the last copy is gone', () =>
    {
      const datum = fakeDatum('w', JaftingSalvageManager.DynamicEquipIndexMin);
      datum._jaftingSalvageLedger = new JaftingSalvageLedgerSnapshot([]);
      $dataWeapons[datum.id] = datum;
      $gameParty.getRefinedWeapons = () => [ { index: datum.id } ];
      $gameParty.setCount(datum, 0);

      JaftingSalvageManager.afterPartyLostItem(datum, 1);

      expect(datum._jaftingSalvageLedger).toBe(null);
      expect($dataWeapons[datum.id]).toEqual({ id: datum.id, empty: true });
    });

    it('afterPartyLostItem stops early while the party still holds copies of the item', () =>
    {
      const datum = fakeDatum('i', 1);
      $gameParty.setCount(datum, 1);

      // should not throw and should not reach clearLedgerForDatum's dynamic-slot branch.
      expect(() => JaftingSalvageManager.afterPartyLostItem(datum, 1)).not.toThrow();
    });

    it('afterPartyLostItem ignores falsy datums and non-positive amounts', () =>
    {
      expect(() => JaftingSalvageManager.afterPartyLostItem(null, 1)).not.toThrow();
      expect(() => JaftingSalvageManager.afterPartyLostItem(fakeDatum('i', 1), 0)).not.toThrow();
    });
  });

  describe('applyCraftRecipeOutputs', () =>
  {
    it('stamps every database-entry output with rows built from the recipe ingredients', () =>
    {
      const outputDatum = fakeDatum('i', 2);
      $gameParty.setCount(outputDatum, 1);

      const ingredientComponent = {
        isDatabaseEntry: () => true,
        isGold: () => false,
        isSdp: () => false,
        isWeapon: () => false,
        isArmor: () => false,
        getItem: () => ({ id: 1 }),
        quantity: () => 3,
      };
      const outputComponent = {
        isDatabaseEntry: () => true,
        getItem: () => outputDatum,
        quantity: () => 1,
      };

      const recipe = { ingredients: [ ingredientComponent ], outputs: [ outputComponent ] };

      JaftingSalvageManager.applyCraftRecipeOutputs(recipe);

      const bag = $gameParty._j._jafting._salvageLedgers['i:2'];
      expect(bag.rows[0]).toMatchObject({ t: 'i', id: 1, n: 3 });
    });
  });

  describe('refinementMaterialHasNoRecoverableRows / buildRefinementOutputLedger', () =>
  {
    it('a stamped material always contributes its rows (returns false)', () =>
    {
      const material = fakeDatum('w', 20);
      material._jaftingSalvageLedger = new JaftingSalvageLedgerSnapshot([ new JaftingSalvageLedgerRow('i', 1, 1) ]);

      expect(JaftingSalvageManager.refinementMaterialHasNoRecoverableRows(material)).toBe(false);
    });

    it('a bare vendor weapon/armor material (no stamp) contributes nothing (returns true)', () =>
    {
      globalThis.J = { JAFTING: { Metadata: { materialArmorTypeId: 5, materialWeaponTypeId: -1 } } };

      const material = fakeDatum('a', 30);
      material.atypeId = 1;

      expect(JaftingSalvageManager.refinementMaterialHasNoRecoverableRows(material)).toBe(true);

      delete globalThis.J;
    });

    it('buildRefinementOutputLedger carries base rows forward and merges stamped material rows', () =>
    {
      const base = fakeDatum('w', 40);
      base._jaftingSalvageLedger = new JaftingSalvageLedgerSnapshot([ new JaftingSalvageLedgerRow('i', 1, 1) ]);

      const material = fakeDatum('w', 41);
      material._jaftingSalvageLedger = new JaftingSalvageLedgerSnapshot([ new JaftingSalvageLedgerRow('i', 2, 1) ]);

      const outputLedger = JaftingSalvageManager.buildRefinementOutputLedger(base, material);

      expect(outputLedger.rows.map(r => r.id).sort()).toEqual([ 1, 2 ]);
    });

    it('buildRefinementOutputLedger falls back to base-only rows for a bare vendor donor', () =>
    {
      globalThis.J = { JAFTING: { Metadata: { materialArmorTypeId: 5, materialWeaponTypeId: -1 } } };

      const base = fakeDatum('w', 42);
      base._jaftingSalvageLedger = new JaftingSalvageLedgerSnapshot([ new JaftingSalvageLedgerRow('i', 1, 1) ]);

      const material = fakeDatum('a', 43);
      material.atypeId = 1;

      const outputLedger = JaftingSalvageManager.buildRefinementOutputLedger(base, material);

      expect(outputLedger.rows.map(r => r.id)).toEqual([ 1 ]);

      delete globalThis.J;
    });
  });

  describe('datumHasSalvageLedger / getSalvageLedgerSnapshotExpanded / visibleExpandedRefundRowCount', () =>
  {
    it('is false when there is no ledger at all', () =>
    {
      const datum = fakeDatum('i', 50);

      expect(JaftingSalvageManager.datumHasSalvageLedger(datum)).toBe(false);
      expect(JaftingSalvageManager.getSalvageLedgerSnapshotExpanded(datum)).toBe(null);
      expect(JaftingSalvageManager.visibleExpandedRefundRowCount(datum)).toBe(0);
    });

    it('counts only non-banned rows after expansion', () =>
    {
      const datum = fakeDatum('w', JaftingSalvageManager.DynamicEquipIndexMin);
      datum._jaftingSalvageLedger = new JaftingSalvageLedgerSnapshot([
        new JaftingSalvageLedgerRow('i', 1, 1),
        new JaftingSalvageLedgerRow('i', 2, 1, true),
      ]);

      expect(JaftingSalvageManager.datumHasSalvageLedger(datum)).toBe(true);
      expect(JaftingSalvageManager.visibleExpandedRefundRowCount(datum)).toBe(1);
    });
  });

  describe('layoutPreviewLineCountSingle / layoutPreviewLineCountTwoColumn', () =>
  {
    it('returns 1 line for an absent datum or a datum with no refund rows', () =>
    {
      expect(JaftingSalvageManager.layoutPreviewLineCountSingle(null)).toBe(1);
      expect(JaftingSalvageManager.layoutPreviewLineCountSingle(fakeDatum('i', 1))).toBe(1);
    });

    it('returns 3 + row count for the single-column layout', () =>
    {
      const datum = fakeDatum('w', JaftingSalvageManager.DynamicEquipIndexMin);
      datum._jaftingSalvageLedger = new JaftingSalvageLedgerSnapshot([
        new JaftingSalvageLedgerRow('i', 1, 1),
        new JaftingSalvageLedgerRow('i', 2, 1),
      ]);

      expect(JaftingSalvageManager.layoutPreviewLineCountSingle(datum)).toBe(5);
    });

    it('two-column layout ceils row count over 2, falling back to single-column with none', () =>
    {
      const noRows = fakeDatum('i', 1);
      expect(JaftingSalvageManager.layoutPreviewLineCountTwoColumn(noRows)).toBe(1);

      const threeRows = fakeDatum('w', JaftingSalvageManager.DynamicEquipIndexMin);
      threeRows._jaftingSalvageLedger = new JaftingSalvageLedgerSnapshot([
        new JaftingSalvageLedgerRow('i', 1, 1),
        new JaftingSalvageLedgerRow('i', 2, 1),
        new JaftingSalvageLedgerRow('i', 3, 1),
      ]);

      // 3 + ceil(3/2) = 3 + 2 = 5.
      expect(JaftingSalvageManager.layoutPreviewLineCountTwoColumn(threeRows)).toBe(5);
    });
  });

  describe('getSalvageCandidateDatums', () =>
  {
    it('keeps only datums the party holds that also have a salvage ledger', () =>
    {
      const eligible = fakeDatum('w', JaftingSalvageManager.DynamicEquipIndexMin);
      eligible._jaftingSalvageLedger = new JaftingSalvageLedgerSnapshot([ new JaftingSalvageLedgerRow('i', 1, 1) ]);

      const noLedger = fakeDatum('i', 60);
      const zeroCount = fakeDatum('i', 61);
      zeroCount._jaftingSalvageLedger = new JaftingSalvageLedgerSnapshot([ new JaftingSalvageLedgerRow('i', 1, 1) ]);

      $gameParty.setCount(eligible, 1);
      $gameParty.setCount(noLedger, 1);
      // zeroCount intentionally left at 0 (never set).
      $gameParty.allItems = () => [ eligible, noLedger, zeroCount, null ];

      const candidates = JaftingSalvageManager.getSalvageCandidateDatums();

      expect(candidates).toEqual([ eligible ]);
    });
  });

  describe('refundLedgerRows / executeSalvage', () =>
  {
    it('refundLedgerRows pays each row type through the matching party API, skipping banned rows', () =>
    {
      const gained = [];
      $gameParty.gainItem = (datum, n) => gained.push([ 'item', datum, n ]);
      $gameParty.gainGold = n => gained.push([ 'gold', n ]);
      const actor = { modSdpPoints: vi.fn() };
      $gameParty.members = () => [ actor ];

      $dataItems[1] = { key: 'item1' };
      $dataWeapons[2] = { key: 'weapon2' };
      $dataArmors[3] = { key: 'armor3' };

      const ledger = {
        rows: [
          new JaftingSalvageLedgerRow('i', 1, 2),
          new JaftingSalvageLedgerRow('w', 2, 1),
          new JaftingSalvageLedgerRow('a', 3, 1),
          new JaftingSalvageLedgerRow('g', 0, 10),
          new JaftingSalvageLedgerRow('s', 0, 4),
          new JaftingSalvageLedgerRow('i', 1, 99, true),
        ],
      };

      JaftingSalvageManager.refundLedgerRows(ledger, 2);

      expect(gained).toContainEqual([ 'item', $dataItems[1], 4 ]);
      expect(gained).toContainEqual([ 'item', $dataWeapons[2], 2 ]);
      expect(gained).toContainEqual([ 'item', $dataArmors[3], 2 ]);
      expect(gained).toContainEqual([ 'gold', 20 ]);
      expect(actor.modSdpPoints).toHaveBeenCalledWith(8);
      // banned row must not have paid out- only 5 non-banned rows above should have produced calls.
      expect(gained.length).toBe(4);
    });

    it('refundLedgerRows does nothing for a non-positive amount', () =>
    {
      const ledger = { rows: [ new JaftingSalvageLedgerRow('g', 0, 10) ] };
      let called = false;
      $gameParty.gainGold = () => { called = true; };

      JaftingSalvageManager.refundLedgerRows(ledger, 0);

      expect(called).toBe(false);
    });

    it('executeSalvage refunds and removes the stack when eligible', () =>
    {
      const datum = fakeDatum('w', JaftingSalvageManager.DynamicEquipIndexMin);
      datum._jaftingSalvageLedger = new JaftingSalvageLedgerSnapshot([ new JaftingSalvageLedgerRow('g', 0, 5) ]);
      $gameParty.setCount(datum, 3);

      let gainedGold = 0;
      let lostArgs = null;
      $gameParty.gainGold = n => { gainedGold += n; };
      $gameParty.loseItem = (d, n) => { lostArgs = [ d, n ]; };

      const result = JaftingSalvageManager.executeSalvage(datum, 2);

      expect(result).toBe(true);
      expect(gainedGold).toBe(10);
      expect(lostArgs).toEqual([ datum, 2 ]);
    });

    it('executeSalvage returns false when there is no ledger, no expanded rows, non-positive amount, or too few in stock', () =>
    {
      const noLedgerDatum = fakeDatum('i', 70);
      expect(JaftingSalvageManager.executeSalvage(noLedgerDatum, 1)).toBe(false);

      const vendorShellDatum = fakeDatum('w', 71);
      vendorShellDatum._jaftingSalvageLedger = new JaftingSalvageLedgerSnapshot([
        new JaftingSalvageLedgerRow('w', 999, 1),
      ]);
      $gameParty.setCount(vendorShellDatum, 1);
      // row references a $dataWeapons id that does not exist, so expansion drops it entirely.
      expect(JaftingSalvageManager.executeSalvage(vendorShellDatum, 1)).toBe(false);

      const stampedDatum = fakeDatum('w', JaftingSalvageManager.DynamicEquipIndexMin + 1);
      stampedDatum._jaftingSalvageLedger = new JaftingSalvageLedgerSnapshot([ new JaftingSalvageLedgerRow('g', 0, 1) ]);
      $gameParty.setCount(stampedDatum, 1);
      expect(JaftingSalvageManager.executeSalvage(stampedDatum, 0)).toBe(false);
      expect(JaftingSalvageManager.executeSalvage(stampedDatum, 5)).toBe(false);
    });
  });

  describe('expandWeaponArmorRowsForSalvage', () =>
  {
    it('passes through non-weapon/armor rows and banned rows unchanged', () =>
    {
      const rows = [
        new JaftingSalvageLedgerRow('i', 1, 2),
        new JaftingSalvageLedgerRow('g', 0, 5, true),
      ];

      const expanded = JaftingSalvageManager.expandWeaponArmorRowsForSalvage(rows, {});

      expect(expanded.find(r => r.t === 'i').n).toBe(2);
      expect(expanded.find(r => r.t === 'g').banned).toBe(true);
    });

    it('recurses into a nested weapon ledger and scales inner rows by the outer row count', () =>
    {
      $dataWeapons[100] = fakeDatum('w', 100);
      $dataWeapons[100]._jaftingSalvageLedger = new JaftingSalvageLedgerSnapshot([
        new JaftingSalvageLedgerRow('i', 1, 3),
      ]);

      const rows = [ new JaftingSalvageLedgerRow('w', 100, 2) ];
      const expanded = JaftingSalvageManager.expandWeaponArmorRowsForSalvage(rows, {});

      // inner row (3 per unit) scaled by the outer stack count (2) = 6.
      expect(expanded).toEqual([ new JaftingSalvageLedgerRow('i', 1, 6) ]);
    });

    it('breaks self-referential cycles via the visited map instead of recursing forever', () =>
    {
      $dataWeapons[101] = fakeDatum('w', 101);
      $dataWeapons[101]._jaftingSalvageLedger = new JaftingSalvageLedgerSnapshot([
        new JaftingSalvageLedgerRow('w', 101, 1),
      ]);

      const rows = [ new JaftingSalvageLedgerRow('w', 101, 1) ];

      expect(() => JaftingSalvageManager.expandWeaponArmorRowsForSalvage(rows, {})).not.toThrow();
    });

    it('drops a weapon/armor row entirely when the referenced $data* entry is missing', () =>
    {
      const rows = [ new JaftingSalvageLedgerRow('a', 9999, 1) ];

      const expanded = JaftingSalvageManager.expandWeaponArmorRowsForSalvage(rows, {});

      expect(expanded).toEqual([]);
    });
  });
});
//endregion plugins/jafting/core-salvage-manager-direct.test.js
