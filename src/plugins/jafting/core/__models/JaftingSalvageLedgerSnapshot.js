//region JaftingSalvageLedgerSnapshot
import JaftingSalvageLedgerRow from './JaftingSalvageLedgerRow.js';

/**
 * Salvage stamp for **one** inventory unit (craft output slot, refinement output, or one stack ordinal).<br>
 * Party stacks mirror these in {@link JaftingSalvagePartyLedgerBag#unitLedgers}; dynamic refinement rows hang the same
 * shape on {@link RPG_Weapon#_jaftingSalvageLedger} and {@link RPG_Armor#_jaftingSalvageLedger}.
 */
class JaftingSalvageLedgerSnapshot
{
  /**
   * @param {JaftingSalvageLedgerRow[]|null|undefined} rows
   */
  constructor(rows)
  {
    // store rows or initialize empty for snapshots created before any ingredients are stamped.
    this.rows = Array.isArray(rows) ? rows : [];
  }

  /**
   * Returns `.rows` from a snapshot, or an empty array when the snapshot is absent.
   *
   * @param {JaftingSalvageLedgerSnapshot|null|undefined} ledger
   * @returns {JaftingSalvageLedgerRow[]}
   */
  static rowsFrom(ledger)
  {
    // absent ledger means no lineage has been stamped yet.
    if (!ledger)
    {
      return [];
    }

    return ledger.rows;
  }

  /**
   * Clones every row into a fresh snapshot (used when stamping multiple outputs from the same recipe shell).
   *
   * @param {JaftingSalvageLedgerSnapshot} ledger
   * @returns {JaftingSalvageLedgerSnapshot}
   */
  static cloneFromLedger(ledger)
  {
    // clone each row so the new snapshot does not share references with the source.
    const clones = ledger.rows.map(r => r.clone());

    return new JaftingSalvageLedgerSnapshot(clones);
  }
}

export default JaftingSalvageLedgerSnapshot;
//endregion JaftingSalvageLedgerSnapshot
