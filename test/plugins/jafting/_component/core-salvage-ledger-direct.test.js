//region plugins/jafting/_component/core-salvage-ledger-direct.test.js
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import JaftingSalvageLedger from '../../../../src/plugins/jafting/core/__models/JaftingSalvageLedger.js';
import JaftingSalvageLedgerRow from '../../../../src/plugins/jafting/core/__models/JaftingSalvageLedgerRow.js';

/**
 * Direct-import coverage for JaftingSalvageLedger's stateless row helpers. The source file reads
 * J.JAFTING.Metadata and the bare-global CraftingComponent class (never imported- CraftingComponent
 * lives in the optional Creation extension, so core cannot statically import it) so both are stubbed
 * minimally on globalThis here, following the same pattern as heal-event-manager.test.js.
 */
describe('JaftingSalvageLedger (direct src import)', () =>
{
  beforeEach(() =>
  {
    globalThis.J = { JAFTING: { Metadata: { materialArmorTypeId: 5, materialWeaponTypeId: -1 } } };
    globalThis.CraftingComponent = { Types: { Gold: 'g', SDP: 's' } };
  });

  afterEach(() =>
  {
    delete globalThis.J;
    delete globalThis.CraftingComponent;
  });

  describe('getMaterialArmorTypeId / getMaterialWeaponTypeId', () =>
  {
    it('reads straight through to J.JAFTING.Metadata', () =>
    {
      expect(JaftingSalvageLedger.getMaterialArmorTypeId()).toBe(5);
      expect(JaftingSalvageLedger.getMaterialWeaponTypeId()).toBe(-1);
    });
  });

  describe('isMaterialArmorDatum', () =>
  {
    it('is true only when the armor type id matches and the datum is an armor', () =>
    {
      const matchingArmor = { isArmor: () => true, atypeId: 5 };
      const wrongType = { isArmor: () => true, atypeId: 1 };
      const notArmor = { isArmor: () => false, atypeId: 5 };

      expect(JaftingSalvageLedger.isMaterialArmorDatum(matchingArmor)).toBe(true);
      expect(JaftingSalvageLedger.isMaterialArmorDatum(wrongType)).toBe(false);
      expect(JaftingSalvageLedger.isMaterialArmorDatum(notArmor)).toBe(false);
    });

    it('is always false when the configured armor type id is negative (feature disabled)', () =>
    {
      globalThis.J.JAFTING.Metadata.materialArmorTypeId = -1;

      const armor = { isArmor: () => true, atypeId: -1 };

      expect(JaftingSalvageLedger.isMaterialArmorDatum(armor)).toBe(false);
    });
  });

  describe('isMaterialWeaponDatum', () =>
  {
    it('is false while the weapon type id is negative (feature disabled by default)', () =>
    {
      const weapon = { isWeapon: () => true, wtypeId: 0 };

      expect(JaftingSalvageLedger.isMaterialWeaponDatum(weapon)).toBe(false);
    });

    it('is true when enabled and the wtypeId matches, even wtypeId 0', () =>
    {
      globalThis.J.JAFTING.Metadata.materialWeaponTypeId = 0;

      const matchingWeapon = { isWeapon: () => true, wtypeId: 0 };
      const wrongWeapon = { isWeapon: () => true, wtypeId: 1 };

      expect(JaftingSalvageLedger.isMaterialWeaponDatum(matchingWeapon)).toBe(true);
      expect(JaftingSalvageLedger.isMaterialWeaponDatum(wrongWeapon)).toBe(false);
    });
  });

  describe('isStackCountedRefinableEquip', () =>
  {
    it('is true when either the material-armor or material-weapon check passes', () =>
    {
      const materialArmor = { isArmor: () => true, atypeId: 5, isWeapon: () => false };

      expect(JaftingSalvageLedger.isStackCountedRefinableEquip(materialArmor)).toBe(true);
    });

    it('is false when neither check passes', () =>
    {
      const vendorArmor = { isArmor: () => true, atypeId: 1, isWeapon: () => false };

      expect(JaftingSalvageLedger.isStackCountedRefinableEquip(vendorArmor)).toBe(false);
    });
  });

  describe('rowMergeKey', () =>
  {
    it('joins type and id with a colon', () =>
    {
      expect(JaftingSalvageLedger.rowMergeKey({ t: 'i', id: 12 })).toBe('i:12');
    });
  });

  describe('cloneRows', () =>
  {
    it('clones every row into a new array without sharing references', () =>
    {
      const rows = [ new JaftingSalvageLedgerRow('i', 1, 2) ];
      const cloned = JaftingSalvageLedger.cloneRows(rows);

      expect(cloned).not.toBe(rows);
      expect(cloned[0]).not.toBe(rows[0]);
      expect(cloned[0]).toEqual(rows[0]);
    });
  });

  describe('mergeDuplicateRows', () =>
  {
    it('sums quantities for rows sharing the same t:id key', () =>
    {
      const rows = [
        new JaftingSalvageLedgerRow('i', 1, 2),
        new JaftingSalvageLedgerRow('i', 1, 3),
        new JaftingSalvageLedgerRow('w', 5, 1),
      ];

      const merged = JaftingSalvageLedger.mergeDuplicateRows(rows);

      expect(merged.length).toBe(2);

      const itemRow = merged.find(r => r.t === 'i');
      expect(itemRow.n).toBe(5);
    });

    it('poisons the merged row with banned=true if any duplicate is banned', () =>
    {
      const rows = [
        new JaftingSalvageLedgerRow('i', 1, 2, false),
        new JaftingSalvageLedgerRow('i', 1, 3, true),
      ];

      const merged = JaftingSalvageLedger.mergeDuplicateRows(rows);

      expect(merged[0].banned).toBe(true);
    });
  });

  describe('rowsFromCraftingComponents', () =>
  {
    /**
     * Minimal fake mirroring the CraftingComponent surface rowsFromCraftingComponents actually reads.
     *
     * @param {object} opts
     * @returns {object}
     */
    function fakeComponent({ isDb = false, isGold = false, isSdp = false, isWeapon = false, isArmor = false, item, qty })
    {
      return {
        isDatabaseEntry: () => isDb,
        isGold: () => isGold,
        isSdp: () => isSdp,
        isWeapon: () => isWeapon,
        isArmor: () => isArmor,
        getItem: () => item,
        quantity: () => qty,
      };
    }

    it('maps database-entry ingredients to item/weapon/armor row type letters', () =>
    {
      const ingredients = [
        fakeComponent({ isDb: true, item: { id: 10 }, qty: 2 }),
        fakeComponent({ isDb: true, isWeapon: true, item: { id: 11 }, qty: 1 }),
        fakeComponent({ isDb: true, isArmor: true, item: { id: 12 }, qty: 3 }),
      ];

      const rows = JaftingSalvageLedger.rowsFromCraftingComponents(ingredients);

      expect(rows.find(r => r.id === 10).t).toBe('i');
      expect(rows.find(r => r.id === 11).t).toBe('w');
      expect(rows.find(r => r.id === 12).t).toBe('a');
    });

    it('maps gold and SDP ingredients using CraftingComponent.Types letters at id 0', () =>
    {
      const ingredients = [
        fakeComponent({ isGold: true, qty: 100 }),
        fakeComponent({ isSdp: true, qty: 5 }),
      ];

      const rows = JaftingSalvageLedger.rowsFromCraftingComponents(ingredients);

      expect(rows.find(r => r.t === 'g')).toMatchObject({ id: 0, n: 100 });
      expect(rows.find(r => r.t === 's')).toMatchObject({ id: 0, n: 5 });
    });

    it('merges duplicate ingredient rows before returning', () =>
    {
      const ingredients = [
        fakeComponent({ isDb: true, item: { id: 10 }, qty: 1 }),
        fakeComponent({ isDb: true, item: { id: 10 }, qty: 4 }),
      ];

      const rows = JaftingSalvageLedger.rowsFromCraftingComponents(ingredients);

      expect(rows.length).toBe(1);
      expect(rows[0].n).toBe(5);
    });
  });

  describe('mergeRowArrays', () =>
  {
    it('concatenates then dedupes both sides, cloning so neither input array is mutated', () =>
    {
      const a = [ new JaftingSalvageLedgerRow('i', 1, 2) ];
      const b = [ new JaftingSalvageLedgerRow('i', 1, 3), new JaftingSalvageLedgerRow('w', 2, 1) ];

      const merged = JaftingSalvageLedger.mergeRowArrays(a, b);

      expect(merged.length).toBe(2);
      expect(merged.find(r => r.t === 'i').n).toBe(5);
      // originals untouched- mergeRowArrays clones before combining.
      expect(a[0].n).toBe(2);
      expect(b[0].n).toBe(3);
    });
  });
});
//endregion plugins/jafting/_component/core-salvage-ledger-direct.test.js
