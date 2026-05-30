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
   * @param {JaftingSalvageLedgerRow[]|JaftingSalvageLedgerSnapshot|{ rows?: JaftingSalvageLedgerRow[] }|null|
   *   undefined} rowsSource
   */
  constructor(rowsSource)
  {
    // clone-from-snapshot, accept `{ rows }` literals from older saves/tests, or accept a bare row array.
    if (rowsSource instanceof JaftingSalvageLedgerSnapshot)
    {
      this.rows = rowsSource.rows.map(r => JaftingSalvageLedgerRow.coerce(r).clone());

      // exit early without a payload.
      return;
    }

    // when rowsSource  and  Array.isArray(rowsSource.rows), take this branch.
    if (rowsSource && Array.isArray(rowsSource.rows))
    {
      this.rows = JaftingSalvageLedgerSnapshot.coerceRows(rowsSource.rows);

      // exit early without a payload.
      return;
    }

    // when Array.isArray(rowsSource), take this branch.
    if (Array.isArray(rowsSource))
    {
      this.rows = JaftingSalvageLedgerSnapshot.coerceRows(rowsSource);

      // exit early without a payload.
      return;
    }

    // assign rows on this instance for callers.
    this.rows = [];
  }

  /**
   * Normalizes every entry to {@link JaftingSalvageLedgerRow} (handles post-load plain objects).
   *
   * @param {unknown[]} rows The rows driving this step.
   * @returns {JaftingSalvageLedgerRow[]}
   */
  static coerceRows(rows)
  {
    if (Array.isArray(rows) === false)
    {
      return [];
    }

    // capture out for downstream policy in this routine.
    const out = [];

    // iterate the loop counter until the guard exits.
    for (let i = 0; i < rows.length; i++)
    {
      out.push(JaftingSalvageLedgerRow.coerce(rows[i]));
    }

    // hand back out to the caller.
    return out;
  }

  /**
   * Reads `.rows` from a snapshot instance or a duck-typed interim object.
   *
   * @param {JaftingSalvageLedgerSnapshot|{ rows?: unknown[] }|null|undefined} ledger
   * @returns {JaftingSalvageLedgerRow[]}
   */
  static rowsFromUnknown(ledger)
  {
    if (!ledger || !ledger.rows)
    {
      return [];
    }

    // hand back JaftingSalvageLedgerSnapshot.coerceRows(ledger.rows) to the caller.
    return JaftingSalvageLedgerSnapshot.coerceRows(ledger.rows);
  }

  /**
   * Clones every row into a fresh snapshot (used when stamping multiple outputs from the same recipe shell).
   *
   * @param {JaftingSalvageLedgerSnapshot|{ rows?: JaftingSalvageLedgerRow[] }} ledger
   * @returns {JaftingSalvageLedgerSnapshot}
   */
  static cloneFromLedgerLike(ledger)
  {
    const rows = JaftingSalvageLedgerSnapshot.rowsFromUnknown(ledger);
    const clones = [];

    // iterate the loop counter until the guard exits.
    for (let i = 0; i < rows.length; i++)
    {
      clones.push(rows[i].clone());
    }

    // hand back new JaftingSalvageLedgerSnapshot(clones) to the caller.
    return new JaftingSalvageLedgerSnapshot(clones);
  }
}

export default JaftingSalvageLedgerSnapshot;
//endregion JaftingSalvageLedgerSnapshot