//region plugins/jafting/_component/core-salvage-ledger-models-direct.test.js
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import JaftingSalvageLedgerRow from '../../../../src/plugins/jafting/core/__models/JaftingSalvageLedgerRow.js';
import JaftingSalvageLedgerSnapshot from '../../../../src/plugins/jafting/core/__models/JaftingSalvageLedgerSnapshot.js';
import JaftingSalvagePartyLedgerBag from '../../../../src/plugins/jafting/core/__models/JaftingSalvagePartyLedgerBag.js';

/**
 * Direct-import coverage for the three concrete salvage ledger model classes, plus
 * registerJaftingSalvageSerializableModels.js which just wires them into SerializableRegistry at import
 * time. salvage-models-jsonex.test.js already exercises these three through a VM bundle + JsonEx round
 * trip; this file exercises the same classes' own methods directly so coverage attributes to the real
 * source files instead of the vm.runInContext sandbox.
 */
describe('JAFTING salvage ledger model classes (direct src import)', () =>
{
  describe('JaftingSalvageLedgerRow', () =>
  {
    it('stores t/id/n and omits the banned property when not passed', () =>
    {
      const row = new JaftingSalvageLedgerRow('i', 4, 2);

      expect(row.t).toBe('i');
      expect(row.id).toBe(4);
      expect(row.n).toBe(2);
      expect(row.banned).toBeUndefined();
    });

    it('sets banned only when explicitly true', () =>
    {
      const bannedRow = new JaftingSalvageLedgerRow('w', 7, 1, true);
      const notBannedRow = new JaftingSalvageLedgerRow('w', 7, 1, false);

      expect(bannedRow.banned).toBe(true);
      expect(notBannedRow.banned).toBeUndefined();
    });

    it('clone() returns a distinct instance with the same field values', () =>
    {
      const row = new JaftingSalvageLedgerRow('a', 9, 3, true);
      const clone = row.clone();

      expect(clone).not.toBe(row);
      expect(clone.t).toBe('a');
      expect(clone.id).toBe(9);
      expect(clone.n).toBe(3);
      expect(clone.banned).toBe(true);
    });
  });

  describe('JaftingSalvageLedgerSnapshot', () =>
  {
    it('defaults rows to an empty array when constructed with null/undefined', () =>
    {
      expect(new JaftingSalvageLedgerSnapshot(null).rows).toEqual([]);
      expect(new JaftingSalvageLedgerSnapshot(undefined).rows).toEqual([]);
    });

    it('keeps an array of rows as-is when passed one', () =>
    {
      const rows = [ new JaftingSalvageLedgerRow('i', 1, 1) ];
      const snapshot = new JaftingSalvageLedgerSnapshot(rows);

      expect(snapshot.rows).toBe(rows);
    });

    it('rowsFrom returns [] for a null/undefined ledger and .rows otherwise', () =>
    {
      const rows = [ new JaftingSalvageLedgerRow('i', 1, 1) ];
      const snapshot = new JaftingSalvageLedgerSnapshot(rows);

      expect(JaftingSalvageLedgerSnapshot.rowsFrom(null)).toEqual([]);
      expect(JaftingSalvageLedgerSnapshot.rowsFrom(undefined)).toEqual([]);
      expect(JaftingSalvageLedgerSnapshot.rowsFrom(snapshot)).toBe(rows);
    });

    it('cloneFromLedger deep-clones every row into a new snapshot', () =>
    {
      const original = new JaftingSalvageLedgerSnapshot([ new JaftingSalvageLedgerRow('i', 1, 5) ]);
      const cloned = JaftingSalvageLedgerSnapshot.cloneFromLedger(original);

      expect(cloned).not.toBe(original);
      expect(cloned.rows).not.toBe(original.rows);
      expect(cloned.rows[0]).not.toBe(original.rows[0]);
      expect(cloned.rows[0]).toEqual(original.rows[0]);
    });
  });

  describe('JaftingSalvagePartyLedgerBag', () =>
  {
    it('starts with empty unitLedgers and rows arrays', () =>
    {
      const bag = new JaftingSalvagePartyLedgerBag();

      expect(bag.unitLedgers).toEqual([]);
      expect(bag.rows).toEqual([]);
    });

    it('coerce returns a fresh bag for a null/undefined slot', () =>
    {
      const coerced = JaftingSalvagePartyLedgerBag.coerce(null);

      expect(coerced).toBeInstanceOf(JaftingSalvagePartyLedgerBag);
      expect(coerced.rows).toEqual([]);
    });

    it('coerce returns the same instance when already a bag', () =>
    {
      const bag = new JaftingSalvagePartyLedgerBag();
      bag.rows.push(new JaftingSalvageLedgerRow('i', 1, 1));

      expect(JaftingSalvagePartyLedgerBag.coerce(bag)).toBe(bag);
    });
  });

  describe('registerJaftingSalvageSerializableModels', () =>
  {
    let registerSpy;

    beforeAll(async () =>
    {
      // module has no default export- it just runs SerializableRegistry.register() three times at
      // import time, so the "system under test" is the bare-global side effect, not a return value.
      // Vitest gives each test file its own module registry, and this module is only imported once in
      // this file, so a plain top-level import (no vi.resetModules()) keeps the class identities below
      // matching the ones statically imported at the top of this file.
      registerSpy = vi.fn();
      globalThis.SerializableRegistry = { register: registerSpy };

      await import('../../../../src/plugins/jafting/core/registerJaftingSalvageSerializableModels.js');
    });

    afterAll(() =>
    {
      delete globalThis.SerializableRegistry;
    });

    it('registers all three concrete ledger model classes with SerializableRegistry', () =>
    {
      expect(registerSpy).toHaveBeenCalledTimes(3);
      expect(registerSpy).toHaveBeenCalledWith(JaftingSalvageLedgerRow);
      expect(registerSpy).toHaveBeenCalledWith(JaftingSalvageLedgerSnapshot);
      expect(registerSpy).toHaveBeenCalledWith(JaftingSalvagePartyLedgerBag);
    });
  });
});
//endregion plugins/jafting/_component/core-salvage-ledger-models-direct.test.js
