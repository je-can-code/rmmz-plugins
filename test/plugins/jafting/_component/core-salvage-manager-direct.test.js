//region plugins/jafting/_component/core-salvage-manager-direct.test.js
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import JaftingSalvageManager from '../../../../src/plugins/jafting/core/managers/JaftingSalvageManager.js';
import JaftingSalvageLedgerRow from '../../../../src/plugins/jafting/core/__models/JaftingSalvageLedgerRow.js';
import JaftingSalvageLedgerSnapshot from '../../../../src/plugins/jafting/core/__models/JaftingSalvageLedgerSnapshot.js';
import JaftingSalvagePartyLedgerBag from '../../../../src/plugins/jafting/core/__models/JaftingSalvagePartyLedgerBag.js';

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

  beforeEach(() =>
  {
    // fresh party each test, with a numItems() lookup backed by a plain map keyed by "kind:instanceSlot".
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
    delete globalThis.$gameActors;
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

    it('refuses to fall back to a party bag for a dynamic instance carrying no ledger of its own', () =>
    {
      // Arrange- a dynamic row's key resolves to the *base* it was cloned from, so continuing past
      // here would read some other item's history and, worse, resize that stack's per-unit array to
      // this instance's count on the way past. The base therefore has to actually own a stamped bag,
      // or the guard and its absence answer null for the same uninteresting reason - nothing is there.
      // The two counts differ so the resize damage is visible too: sizing only ever grows.
      const baseWeapon = fakeDatum('w', 5);
      $gameParty.setCount(baseWeapon, 1);
      const baseStamp = new JaftingSalvageLedgerSnapshot([ new JaftingSalvageLedgerRow('i', 7, 1) ]);
      JaftingSalvageManager.appendStampedUnitsToPartyStack(baseWeapon, baseStamp, 1);

      const datum = fakeDatum('w', 5, JaftingSalvageManager.DynamicEquipIndexMin);
      $gameParty.setCount(datum, 4);

      // Act
      const ledger = JaftingSalvageManager.getLedgerForDatum(datum);

      // Assert
      expect(ledger).toBe(null);
      expect($gameParty._j._jafting._salvageLedgers['w:5'].unitLedgers).toHaveLength(1);
    });

    it('sizes an existing bag up to the copies the party now holds', () =>
    {
      // Arrange: reading a ledger is also the moment the bag gets reconciled with the stack it shadows, which
      // is what keeps a copy acquired since the last stamp from having nowhere to record its own provenance.
      // Skipping that reconciliation returns the very same bag object, so only the array length tells them apart.
      const datum = fakeDatum('i', 1);
      $gameParty.setCount(datum, 1);
      const stamp = new JaftingSalvageLedgerSnapshot([ new JaftingSalvageLedgerRow('i', 7, 1) ]);
      JaftingSalvageManager.appendStampedUnitsToPartyStack(datum, stamp, 1);
      $gameParty.setCount(datum, 3);

      // Act
      JaftingSalvageManager.getLedgerForDatum(datum);

      // Assert
      expect($gameParty._j._jafting._salvageLedgers['i:1'].unitLedgers).toHaveLength(3);
    });

    it('answers nothing for a bag that exists but records no lineage', () =>
    {
      // Arrange: an existing bag and a *useful* existing bag are different things. A stack whose copies were all
      // bought rather than crafted still has a bag hanging around between sweeps, and handing it back would put
      // the row in the salvage list promising a dismantle that pays nothing.
      const datum = fakeDatum('i', 1);
      $gameParty.setCount(datum, 1);
      const bag = new JaftingSalvagePartyLedgerBag();
      bag.unitLedgers = [ null ];
      $gameParty._j._jafting._salvageLedgers['i:1'] = bag;

      // Act
      const ledger = JaftingSalvageManager.getLedgerForDatum(datum);

      // Assert: null despite the bag still being on file, which is what proves the lookup reached it.
      expect(ledger).toBe(null);
      expect($gameParty._j._jafting._salvageLedgers['i:1']).toBe(bag);
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

    it('leaves the base stack\'s bag alone when a dynamic clone of it is cleared', () =>
    {
      // Arrange: discarding the last refined Iron Sword must not strip the salvage stamp off the ordinary Iron
      // Swords. The refined instance reports base id 5 forever, so its container key names the base's bag, and
      // the only thing standing between "clear this instance" and "delete somebody else's history" is the
      // instance-slot check. The base has to own a real bag or there is nothing for the mutant to destroy.
      const baseWeapon = fakeDatum('w', 5);
      $gameParty.setCount(baseWeapon, 1);
      const baseStamp = new JaftingSalvageLedgerSnapshot([ new JaftingSalvageLedgerRow('i', 7, 1) ]);
      JaftingSalvageManager.appendStampedUnitsToPartyStack(baseWeapon, baseStamp, 1);

      const refined = fakeDatum('w', 5, JaftingSalvageManager.DynamicEquipIndexMin);
      refined._jaftingSalvageLedger = new JaftingSalvageLedgerSnapshot([ new JaftingSalvageLedgerRow('i', 8, 1) ]);

      // Act
      JaftingSalvageManager.clearLedgerForDatum(refined);

      // Assert: the instance's own stamp is gone, and the base stack's is untouched.
      expect(refined._jaftingSalvageLedger).toBe(null);
      expect($gameParty._j._jafting._salvageLedgers['w:5'].rows[0].id).toBe(7);
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

    it('afterPartyLostItem leaves a dynamic instance entirely alone, ledger and slot both', () =>
    {
      // a row leaving the bag is not a row leaving the game - equipping spends it out of inventory before the
      // slot is filled, so tearing anything down here would destroy the equip mid-transaction. collection is the
      // sweep's job, from a point where the answer has settled.
      const datum = fakeDatum('w', 5, JaftingSalvageManager.DynamicEquipIndexMin);
      const ledger = new JaftingSalvageLedgerSnapshot([]);
      datum._jaftingSalvageLedger = ledger;
      $dataWeapons[datum.index] = datum;
      $gameParty.getRefinedWeapons = () => [ { index: datum.index } ];
      $gameParty.setCount(datum, 0);

      JaftingSalvageManager.afterPartyLostItem(datum, 1);

      expect(datum._jaftingSalvageLedger).toBe(ledger);
      expect($dataWeapons[datum.index]).toBe(datum);
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

    it('stamps only the outputs that are database rows, leaving gold and points alone', () =>
    {
      // Arrange: a recipe can pay out gold or panel points alongside gear, and those have no datastore row to
      // hang a dismantle history on. Asking such a component for an item anyway is not an error - it answers
      // with whatever it happens to hold - so the wrong output silently acquires a bag of its own. The gear
      // output is the near-miss that has to keep its stamp, which is what makes the key list an exact pin
      // rather than a claim that the loop did nothing at all.
      const currencyDatum = fakeDatum('i', 3);
      const gearDatum = fakeDatum('i', 2);
      $gameParty.setCount(gearDatum, 1);

      const ingredientComponent = {
        isDatabaseEntry: () => true,
        isGold: () => false,
        isSdp: () => false,
        isWeapon: () => false,
        isArmor: () => false,
        getItem: () => ({ id: 1 }),
        quantity: () => 1,
      };
      const currencyOutput = {
        isDatabaseEntry: () => false,
        getItem: () => currencyDatum,
        quantity: () => 1,
      };
      const gearOutput = {
        isDatabaseEntry: () => true,
        getItem: () => gearDatum,
        quantity: () => 1,
      };

      const recipe = { ingredients: [ ingredientComponent ], outputs: [ currencyOutput, gearOutput ] };

      // Act
      JaftingSalvageManager.applyCraftRecipeOutputs(recipe);

      // Assert
      expect(Object.keys($gameParty._j._jafting._salvageLedgers)).toEqual([ 'i:2' ]);
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

    it('is false for a stamp that survives storage but expands to nothing', () =>
    {
      // Arrange: a stamp naming a vendor shell is real history and stays on file for the UI, but expansion drops
      // it because vendor equipment refunds nothing. The candidate list is filtered on this answer, so counting
      // the *stored* rows instead of the expanded ones would offer the player a dismantle that pays out nothing.
      // Row 999 has no datastore entry, which is exactly how expansion drops a row.
      const datum = fakeDatum('w', 71);
      datum._jaftingSalvageLedger = new JaftingSalvageLedgerSnapshot([
        new JaftingSalvageLedgerRow('w', 999, 1),
      ]);

      // Act
      const hasLedger = JaftingSalvageManager.datumHasSalvageLedger(datum);

      // Assert: the raw stamp is still readable, which is what proves expansion is what emptied it.
      expect(hasLedger).toBe(false);
      expect(JaftingSalvageManager.getLedgerForDatum(datum).rows).toHaveLength(1);
    });

    it('expands an empty stamp to nothing at all rather than to an empty snapshot', () =>
    {
      // Arrange: every caller downstream tests the snapshot for absence before reading it, so a hollow snapshot
      // and no snapshot are meant to be the same answer. Handing back the hollow one instead makes the two
      // spellings drift apart, and the next caller written against this method inherits the difference.
      const datum = fakeDatum('w', 72);
      datum._jaftingSalvageLedger = new JaftingSalvageLedgerSnapshot([]);

      // Act
      const expanded = JaftingSalvageManager.getSalvageLedgerSnapshotExpanded(datum);

      // Assert: the stamp itself is found, so the null is the emptiness rule rather than a missing ledger.
      expect(expanded).toBe(null);
      expect(JaftingSalvageManager.getLedgerForDatum(datum)).toBe(datum._jaftingSalvageLedger);
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

    it('executeSalvage refunds half of a unique row\'s cost and consumes it', () =>
    {
      // a refined instance is always exactly one copy - each refinement mints its own slot - so its single snapshot
      // is the whole payout, halved and rounded up.
      const datum = fakeDatum('w', 5, JaftingSalvageManager.DynamicEquipIndexMin);
      datum._jaftingSalvageLedger = new JaftingSalvageLedgerSnapshot([ new JaftingSalvageLedgerRow('g', 0, 5) ]);
      $gameParty.setCount(datum, 1);

      let gainedGold = 0;
      let lostArgs = null;
      $gameParty.gainGold = n => { gainedGold += n; };
      $gameParty.loseItem = (d, n) => { lostArgs = [ d, n ]; };

      const result = JaftingSalvageManager.executeSalvage(datum, 1);

      expect(result).toBe(true);
      expect(gainedGold).toBe(3);
      expect(lostArgs).toEqual([ datum, 1 ]);
      expect(datum._jaftingSalvageLedger).toBe(null);
    });

    it('executeSalvage pays for the copy destroyed, not for the whole stack it came from', () =>
    {
      // three copies each costing two horns summarise as six in `bag.rows`. paying from that summary is what let a
      // player craft a batch, dismantle it one at a time, and walk away with more material than they spent.
      const sword = fakeDatum('w', 9);
      $dataWeapons[9] = sword;
      $dataItems[77] = fakeDatum('i', 77);
      $gameParty.setCount(sword, 3);
      const perCopy = new JaftingSalvageLedgerSnapshot([ new JaftingSalvageLedgerRow('i', 77, 2) ]);
      JaftingSalvageManager.appendStampedUnitsToPartyStack(sword, perCopy, 3);

      const gained = [];
      $gameParty.gainItem = (d, n) => gained.push([ d.id, n ]);
      $gameParty.loseItem = () => {};

      const result = JaftingSalvageManager.executeSalvage(sword, 1);

      // one copy cost two horns, so half rounded up is one.
      expect(result).toBe(true);
      expect(gained).toEqual([ [ 77, 1 ] ]);
      expect($gameParty._j._jafting._salvageLedgers['w:9'].unitLedgers.length).toBe(2);
    });

    it('executeSalvage rounds a single-unit ingredient up so it comes back whole', () =>
    {
      // rounding down would make one-of ingredients evaporate, and a dish built from six different single things
      // would refund nothing at all.
      const dish = fakeDatum('i', 30);
      $dataItems[30] = dish;
      $dataItems[77] = fakeDatum('i', 77);
      $gameParty.setCount(dish, 1);
      const perCopy = new JaftingSalvageLedgerSnapshot([ new JaftingSalvageLedgerRow('i', 77, 1) ]);
      JaftingSalvageManager.appendStampedUnitsToPartyStack(dish, perCopy, 1);

      const gained = [];
      $gameParty.gainItem = (d, n) => gained.push([ d.id, n ]);
      $gameParty.loseItem = () => {};

      JaftingSalvageManager.executeSalvage(dish, 1);

      expect(gained).toEqual([ [ 77, 1 ] ]);
    });

    it('executeSalvage rounds an odd cost up rather than down', () =>
    {
      // nine of something comes back as five.
      const dish = fakeDatum('i', 31);
      $dataItems[31] = dish;
      $dataItems[77] = fakeDatum('i', 77);
      $gameParty.setCount(dish, 1);
      const perCopy = new JaftingSalvageLedgerSnapshot([ new JaftingSalvageLedgerRow('i', 77, 9) ]);
      JaftingSalvageManager.appendStampedUnitsToPartyStack(dish, perCopy, 1);

      const gained = [];
      $gameParty.gainItem = (d, n) => gained.push([ d.id, n ]);
      $gameParty.loseItem = () => {};

      JaftingSalvageManager.executeSalvage(dish, 1);

      expect(gained).toEqual([ [ 77, 5 ] ]);
    });

    it('executeSalvage consumes the most recently stamped copy first', () =>
    {
      // LIFO, matching the order copies are stamped. the older copy's provenance is what survives.
      const dish = fakeDatum('i', 32);
      $dataItems[32] = dish;
      $dataItems[70] = fakeDatum('i', 70);
      $dataItems[71] = fakeDatum('i', 71);
      $gameParty.setCount(dish, 1);
      JaftingSalvageManager.appendStampedUnitsToPartyStack(
        dish, new JaftingSalvageLedgerSnapshot([ new JaftingSalvageLedgerRow('i', 70, 2) ]), 1);
      $gameParty.setCount(dish, 2);
      JaftingSalvageManager.appendStampedUnitsToPartyStack(
        dish, new JaftingSalvageLedgerSnapshot([ new JaftingSalvageLedgerRow('i', 71, 2) ]), 1);

      const gained = [];
      $gameParty.gainItem = (d, n) => gained.push([ d.id, n ]);
      $gameParty.loseItem = () => {};

      JaftingSalvageManager.executeSalvage(dish, 1);

      // the newer copy (71) paid out, and the older copy (70) is the one still on file.
      expect(gained).toEqual([ [ 71, 1 ] ]);
      expect($gameParty._j._jafting._salvageLedgers['i:32'].unitLedgers[0].rows[0].id).toBe(70);
    });

    it('executeSalvage pays past an unstamped copy caught up in the same dismantle', () =>
    {
      // Arrange: a stack mixes crafted copies with ones bought from a shop, which is the whole reason the
      // per-copy array is allowed to hold nulls. Dismantling the pair takes both, and the unstamped one has to
      // be dropped before anything tries to read rows off it. Stamping only the tail leaves slot zero empty.
      const dish = fakeDatum('i', 40);
      $dataItems[40] = dish;
      $dataItems[77] = fakeDatum('i', 77);
      $gameParty.setCount(dish, 2);
      const perCopy = new JaftingSalvageLedgerSnapshot([ new JaftingSalvageLedgerRow('i', 77, 2) ]);
      JaftingSalvageManager.appendStampedUnitsToPartyStack(dish, perCopy, 1);

      const gained = [];
      $gameParty.gainItem = (d, n) => gained.push([ d.id, n ]);
      $gameParty.loseItem = () => {};

      // Act
      const result = JaftingSalvageManager.executeSalvage(dish, 2);

      // Assert: only the stamped copy contributed, halved and rounded up.
      expect(result).toBe(true);
      expect(gained).toEqual([ [ 77, 1 ] ]);
    });

    it('executeSalvage keeps a banned row banned all the way through the halving', () =>
    {
      // Arrange: the ban rides on the row, and the payout loop is the only thing that reads it - so a halving
      // step that rebuilt the row without the flag would hand back a material the recipe deliberately marked
      // unrefundable, and nothing else downstream would object. The refundable sibling has to survive, or
      // "keeps the flag" and "refunds nothing" would look the same.
      const dish = fakeDatum('i', 41);
      $dataItems[41] = dish;
      $dataItems[77] = fakeDatum('i', 77);
      $dataItems[88] = fakeDatum('i', 88);
      $gameParty.setCount(dish, 1);
      const perCopy = new JaftingSalvageLedgerSnapshot([
        new JaftingSalvageLedgerRow('i', 77, 2),
        new JaftingSalvageLedgerRow('i', 88, 2, true),
      ]);
      JaftingSalvageManager.appendStampedUnitsToPartyStack(dish, perCopy, 1);

      const gained = [];
      $gameParty.gainItem = (d, n) => gained.push([ d.id, n ]);
      $gameParty.loseItem = () => {};

      // Act
      JaftingSalvageManager.executeSalvage(dish, 1);

      // Assert
      expect(gained).toEqual([ [ 77, 1 ] ]);
    });

    it('executeSalvage declines an unstamped row the party genuinely holds', () =>
    {
      // Arrange: the stock check is what turned the earlier no-ledger case away, because that fixture held no
      // copies either - so the ledger check itself was never the reason for the refusal. Holding a copy disables
      // that backstop and leaves the missing stamp as the only thing that can stop the dismantle. Without it the
      // payout walks straight into a bag that was never created.
      const datum = fakeDatum('i', 42);
      $dataItems[42] = datum;
      $gameParty.setCount(datum, 1);

      // Act
      const result = JaftingSalvageManager.executeSalvage(datum, 1);

      // Assert
      expect(result).toBe(false);
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

    it('carries a nested row\'s banned flag out through the scaling', () =>
    {
      // Arrange: banned lineage is recorded so the UI can dim it, and dropping the flag on the way out of a
      // nested ledger turns a deliberately unrefundable material into a refundable one - the flag is the only
      // thing the payout loop consults. The unbanned sibling in the same nested ledger is what stops "keeps the
      // flag" and "flags everything" from looking alike.
      $dataWeapons[100] = fakeDatum('w', 100);
      $dataWeapons[100]._jaftingSalvageLedger = new JaftingSalvageLedgerSnapshot([
        new JaftingSalvageLedgerRow('i', 1, 3),
        new JaftingSalvageLedgerRow('i', 2, 1, true),
      ]);

      const rows = [ new JaftingSalvageLedgerRow('w', 100, 2) ];

      // Act
      const expanded = JaftingSalvageManager.expandWeaponArmorRowsForSalvage(rows, {});

      // Assert
      expect(expanded.find(row => row.id === 2).banned).toBe(true);
      expect(expanded.find(row => row.id === 1).banned).toBeUndefined();
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
//endregion plugins/jafting/_component/core-salvage-manager-direct.test.js
