//region plugins/jafting/salvage-models-jsonex.test.js
import vm from 'node:vm';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { loadJaftingCorePluginVm } from './jafting-core-vm.js';

describe('JAFTING salvage ledger models (JsonEx + SerializableRegistry)', () =>
{
  let sandbox;

  beforeAll(() =>
  {
    sandbox = { console };
    loadJaftingCorePluginVm(sandbox);
  });

  afterAll(() =>
  {
    sandbox = null;
  });

  it('rehydrates party bags and nested snapshots via JsonEx.makeDeepCopy', () =>
  {
    const result = vm.runInContext(
      `
      (() =>
      {
        const bag = new JaftingSalvagePartyLedgerBag();
        bag.unitLedgers.push(new JaftingSalvageLedgerSnapshot([ new JaftingSalvageLedgerRow('i', 12, 3) ]));
        bag.rows.push(new JaftingSalvageLedgerRow('i', 12, 3));

        const copy = JsonEx.makeDeepCopy(bag);

        return {
          bagOk: copy instanceof JaftingSalvagePartyLedgerBag,
          rowOk: copy.rows[0] instanceof JaftingSalvageLedgerRow,
          snapOk: copy.unitLedgers[0] instanceof JaftingSalvageLedgerSnapshot,
          innerRowOk: copy.unitLedgers[0].rows[0] instanceof JaftingSalvageLedgerRow,
          id: copy.rows[0].id,
          n: copy.rows[0].n,
        };
      })()
      `,
      sandbox,
    );

    expect(result.bagOk).toBe(true);
    expect(result.rowOk).toBe(true);
    expect(result.snapOk).toBe(true);
    expect(result.innerRowOk).toBe(true);
    expect(result.id).toBe(12);
    expect(result.n).toBe(3);
  });
});
//endregion plugins/jafting/salvage-models-jsonex.test.js