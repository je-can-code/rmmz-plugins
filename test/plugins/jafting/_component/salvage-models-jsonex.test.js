//region plugins/jafting/_component/salvage-models-jsonex.test.js
import { beforeAll, describe, expect, it } from 'vitest';

import { installJBaseHostGlobals } from '../../_base/core/_component/fixtures/install-j-base-host-globals.js';
import JaftingSalvageLedgerRow from '../../../../src/plugins/jafting/core/__models/JaftingSalvageLedgerRow.js';
import JaftingSalvageLedgerSnapshot from '../../../../src/plugins/jafting/core/__models/JaftingSalvageLedgerSnapshot.js';
import JaftingSalvagePartyLedgerBag from '../../../../src/plugins/jafting/core/__models/JaftingSalvagePartyLedgerBag.js';

/**
 * The fixture's JsonEx placeholder (installJBaseHostGlobals) restores a tagged object's prototype via
 * `window[constructorName]`, mirroring real JsonEx._decode's fallback path for classes that don't call
 * SerializableRegistry.register (these salvage models don't)- so the classes just need to be reachable
 * as bare globals by their own constructor.name for round-tripping to work.
 */
describe('JAFTING salvage ledger models JsonEx round-trip (direct src import)', () =>
{
  let bag;
  let copy;

  beforeAll(() =>
  {
    installJBaseHostGlobals();

    globalThis.JaftingSalvagePartyLedgerBag = JaftingSalvagePartyLedgerBag;
    globalThis.JaftingSalvageLedgerSnapshot = JaftingSalvageLedgerSnapshot;
    globalThis.JaftingSalvageLedgerRow = JaftingSalvageLedgerRow;

    bag = new JaftingSalvagePartyLedgerBag();
    bag.unitLedgers.push(new JaftingSalvageLedgerSnapshot([ new JaftingSalvageLedgerRow('i', 12, 3) ]));
    bag.rows.push(new JaftingSalvageLedgerRow('i', 12, 3));

    copy = globalThis.JsonEx.makeDeepCopy(bag);
  });

  it('rehydrates the party bag as a JaftingSalvagePartyLedgerBag instance', () =>
  {
    // Arrange & Act & Assert
    expect(copy).toBeInstanceOf(JaftingSalvagePartyLedgerBag);
  });

  it('rehydrates the merged row as a JaftingSalvageLedgerRow instance', () =>
  {
    // Arrange & Act & Assert
    expect(copy.rows[0]).toBeInstanceOf(JaftingSalvageLedgerRow);
  });

  it('rehydrates the nested unit ledger as a JaftingSalvageLedgerSnapshot instance', () =>
  {
    // Arrange & Act & Assert
    expect(copy.unitLedgers[0]).toBeInstanceOf(JaftingSalvageLedgerSnapshot);
  });

  it('rehydrates the row nested inside the unit ledger as a JaftingSalvageLedgerRow instance', () =>
  {
    // Arrange & Act & Assert
    expect(copy.unitLedgers[0].rows[0]).toBeInstanceOf(JaftingSalvageLedgerRow);
  });

  it('preserves the row id through the round-trip', () =>
  {
    // Arrange & Act & Assert
    expect(copy.rows[0].id).toBe(12);
  });

  it('preserves the row count through the round-trip', () =>
  {
    // Arrange & Act & Assert
    expect(copy.rows[0].n).toBe(3);
  });
});
//endregion plugins/jafting/_component/salvage-models-jsonex.test.js
